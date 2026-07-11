import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
    sendB2BAutoWithdrawalSuccessNotification, 
    sendB2BAutoWithdrawalFailureNotification 
} from '@/lib/slack';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BANK_CODE_MAP: Record<string, string> = {
    'KB국민': '004', '국민': '004', '국민은행': '004',
    '신한': '088', '신한은행': '088', '우리': '020', '우리은행': '020',
    '하나': '081', '하나은행': '081', 'NH농협': '011', '농협': '011', '농협은행': '011',
    'IBK기업': '003', '기업': '003', '기업은행': '003',
    'SC제일': '023', '제일은행': '023',
    '케이뱅크': '089', '카카오뱅크': '090', '카카오': '090',
    '토스뱅크': '092', '토스': '092',
    '새마을금고': '045', '새마을': '045', '우체국': '071',
    '부산': '032', '부산은행': '032', '대구': '031', '대구은행': '031',
    '경남': '039', '경남은행': '039', '수협': '007', '수협은행': '007',
    '신협': '048', '신협은행': '048',
};

const getBankCode = (name: string) => {
    if (BANK_CODE_MAP[name]) return BANK_CODE_MAP[name];
    for (const key in BANK_CODE_MAP) { 
        if (name.includes(key) || key.includes(name)) return BANK_CODE_MAP[key]; 
    }
    return null;
};

function verifyCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
    if (process.env.NODE_ENV === 'development') return true;
    return false;
}

export async function GET(request: NextRequest) {
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('🔍 [Cron] B2B 첫 출금 자동 이체 스케줄러 실행 시작');

        // 1. auto_approve_at이 현재 시각 이하이고 status가 pending인 출금 신청 조회
        const { data: requests, error: queryError } = await supabase
            .from('withdrawal_requests')
            .select(`
                *,
                b2b_users ( company_name, owner_name )
            `)
            .eq('status', 'pending')
            .lte('auto_approve_at', new Date().toISOString());

        if (queryError) {
            console.error('❌ [Cron] 자동 이체 대상 조회 실패:', queryError);
            return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
        }

        if (!requests || requests.length === 0) {
            console.log('✅ [Cron] 자동 이체 대상이 없습니다.');
            return NextResponse.json({ success: true, count: 0 });
        }

        console.log(`🔍 [Cron] 처리할 자동 이체 대상: ${requests.length}건`);
        const results = [];

        for (const req of requests) {
            const companyName = req.b2b_users?.company_name || '알 수 없음';
            const ownerName = req.b2b_users?.owner_name || '알 수 없음';

            console.log(`🚀 [Cron] 자동 이체 처리 중: ID=${req.id}, 파트너=${companyName}(${ownerName}), 금액=${req.amount}`);

            // 2. 은행 코드 식별
            const bankCode = getBankCode(req.bank_name);
            if (!bankCode) {
                const failReason = `지원하지 않는 은행명: ${req.bank_name}`;
                console.error(`❌ [Cron] ${failReason}`);

                // 자동 이체 재시도 방지를 위해 auto_approve_at을 null로 변경
                await supabase
                    .from('withdrawal_requests')
                    .update({ auto_approve_at: null })
                    .eq('id', req.id);

                await sendB2BAutoWithdrawalFailureNotification({
                    company_name: companyName,
                    owner_name: ownerName,
                    amount: req.amount,
                    bank_name: req.bank_name,
                    account_no: req.account_no,
                    account_holder: req.account_holder,
                    request_id: req.id,
                    reason: failReason,
                });

                results.push({ id: req.id, success: false, reason: failReason });
                continue;
            }

            const cleanAccNo = req.account_no.replace(/-/g, '');
            const txMoid = `B2BWD_AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date();
            const reqDt = now.getFullYear().toString() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0') +
                String(now.getSeconds()).padStart(2, '0');

            try {
                // 3. 이노페이 송금 API 호출
                const transferRes = await fetch('http://49.50.139.204/proxy/transfer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mid: 'bumaeum02m',
                        merkey: '7bYbeddYcp6/zom99bje/iNEqLO3HFx2wcWGFgKeSCg95b8kRx9IcQtx3aoL3C6BufEXAD/V7bd6INig0ge0Zw==',
                        moid: txMoid,
                        req_dt: reqDt,
                        bankCode: bankCode,
                        acntNo: cleanAccNo,
                        acntNm: req.account_holder,
                        amt: String(req.amount),
                        depAcntNo: '66400001397152',
                        depAcntNm: '부고온정산',
                    }),
                });

                const transferResult = await transferRes.json();
                console.log(`📥 [Cron] 송금 API 응답 (ID=${req.id}):`, transferResult);

                if (transferResult.resultCode === '0000') {
                    // 4. 송금 성공 시 승인 완료 처리
                    const { error: rpcError } = await supabase.rpc('approve_withdrawal_request', {
                        p_request_id: req.id
                    });

                    if (rpcError) {
                        const failReason = `송금은 성공했으나 DB 업데이트(RPC) 실패: ${rpcError.message}`;
                        console.error(`❌ [Cron] ${failReason}`);

                        // RPC 실패 시에는 auto_approve_at을 null로 변경하여 중복 송금을 예방 (중요!)
                        await supabase
                            .from('withdrawal_requests')
                            .update({ auto_approve_at: null })
                            .eq('id', req.id);

                        await sendB2BAutoWithdrawalFailureNotification({
                            company_name: companyName,
                            owner_name: ownerName,
                            amount: req.amount,
                            bank_name: req.bank_name,
                            account_no: req.account_no,
                            account_holder: req.account_holder,
                            request_id: req.id,
                            reason: failReason,
                        });

                        results.push({ id: req.id, success: false, reason: failReason });
                    } else {
                        // 성공 알림 전송
                        await sendB2BAutoWithdrawalSuccessNotification({
                            company_name: companyName,
                            owner_name: ownerName,
                            amount: req.amount,
                            bank_name: req.bank_name,
                            account_no: req.account_no,
                            account_holder: req.account_holder,
                            request_id: req.id,
                        });

                        // 자동 푸시 알림: 정산 완료 (비동기)
                        import('@/lib/partner-notification').then(({ sendPartnerNotification }) => {
                            sendPartnerNotification(req.user_id, 'settlement', {
                                월: new Date().toLocaleDateString('ko-KR', { month: 'long' }),
                                금액: (req.amount || 0).toLocaleString(),
                            }, { url: '/b2b/wallet' }).catch(err =>
                                console.error('[PartnerNotification] 정산 푸시 실패:', err)
                            );
                        });

                        // auto_approve_at을 null로 지워 깔끔하게 처리 (이미 completed가 되었으므로 status 검사에서 걸러지긴 함)
                        await supabase
                            .from('withdrawal_requests')
                            .update({ auto_approve_at: null })
                            .eq('id', req.id);

                        results.push({ id: req.id, success: true });
                    }
                } else {
                    const failReason = `이노페이 송금 거절: ${transferResult.resultMsg || '알 수 없는 오류'}`;
                    console.error(`❌ [Cron] ${failReason}`);

                    // 송금 실패 시 auto_approve_at을 null로 처리하여 무한 재시도 방지
                    await supabase
                        .from('withdrawal_requests')
                        .update({ auto_approve_at: null })
                        .eq('id', req.id);

                    await sendB2BAutoWithdrawalFailureNotification({
                        company_name: companyName,
                        owner_name: ownerName,
                        amount: req.amount,
                        bank_name: req.bank_name,
                        account_no: req.account_no,
                        account_holder: req.account_holder,
                        request_id: req.id,
                        reason: failReason,
                    });

                    results.push({ id: req.id, success: false, reason: failReason });
                }
            } catch (transferErr: any) {
                const failReason = `이노페이 송금 API 연동 오류: ${transferErr.message}`;
                console.error(`❌ [Cron] ${failReason}`, transferErr);

                // 통신 오류인 경우에도 auto_approve_at을 null로 처리하고 어드민이 수동 확인하도록 유도
                await supabase
                    .from('withdrawal_requests')
                    .update({ auto_approve_at: null })
                    .eq('id', req.id);

                await sendB2BAutoWithdrawalFailureNotification({
                    company_name: companyName,
                    owner_name: ownerName,
                    amount: req.amount,
                    bank_name: req.bank_name,
                    account_no: req.account_no,
                    account_holder: req.account_holder,
                    request_id: req.id,
                    reason: failReason,
                });

                results.push({ id: req.id, success: false, reason: failReason });
            }
        }

        console.log('✅ [Cron] B2B 첫 출금 자동 이체 스케줄러 실행 완료');
        return NextResponse.json({ success: true, count: requests.length, results });

    } catch (err: any) {
        console.error('❌ [Cron] 스케줄러 치명적 에러:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
