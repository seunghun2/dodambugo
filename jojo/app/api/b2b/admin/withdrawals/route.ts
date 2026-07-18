import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendB2BWithdrawalApproveNotification, sendB2BWithdrawalRejectNotification } from '@/lib/slack';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 출금 신청 목록 조회
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    try {
        let query = supabase
            .from('withdrawal_requests')
            .select(`
                *,
                b2b_users ( company_name, owner_name, phone )
            `);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        // 최신 신청일 순 정렬
        query = query.order('created_at', { ascending: false });

        const { data: requests, error } = await query;

        if (error) throw error;

        // 결과 가공
        const formattedRequests = requests?.map(r => ({
            id: r.id,
            user_id: r.user_id,
            amount: r.amount,
            bank_name: r.bank_name,
            account_no: r.account_no,
            account_holder: r.account_holder,
            status: r.status,
            created_at: r.created_at,
            processed_at: r.processed_at,
            company_name: r.b2b_users?.company_name || '알 수 없음',
            owner_name: r.b2b_users?.owner_name || '알 수 없음',
            phone: r.b2b_users?.phone || ''
        })) || [];

        return NextResponse.json({ success: true, requests: formattedRequests });
    } catch (error: any) {
        console.error('B2B 출금 신청 목록 조회 오류:', error);
        return NextResponse.json({ error: '출금 신청 목록을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}

// 은행코드 매핑
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

// POST: 출금 신청 승인 또는 반려 처리 (이노페이 송금 API 연동 + RPC)
export async function POST(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { requestId, action } = body;

        if (!requestId || !action) {
            return NextResponse.json({ error: '필수 정보를 입력해주세요.' }, { status: 400 });
        }

        if (action === 'approve') {
            // 1. 출금 신청 내역 조회
            const { data: requestData, error: findError } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (findError || !requestData) {
                console.error('출금 신청 조회 실패:', findError);
                return NextResponse.json({ error: '출금 신청 내역을 찾을 수 없습니다.' }, { status: 404 });
            }

            if (requestData.status !== 'pending') {
                return NextResponse.json({ error: '이미 처리된 출금 신청입니다.' }, { status: 400 });
            }

            // 파트너(b2b_users) 정보 조회 (슬랙 알림용)
            const { data: userData } = await supabase
                .from('b2b_users')
                .select('company_name, owner_name')
                .eq('id', requestData.user_id)
                .single();

            // 2. 은행 코드 변환
            const bankCode = getBankCode(requestData.bank_name);
            if (!bankCode) {
                return NextResponse.json({ error: `지원하지 않거나 식별되지 않는 은행입니다: ${requestData.bank_name}` }, { status: 400 });
            }

            const cleanAccNo = requestData.account_no.replace(/-/g, '');
            const txMoid = `B2BWD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date();
            const reqDt = now.getFullYear().toString() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0') +
                String(now.getSeconds()).padStart(2, '0');

            // 3. 이노페이 송금 API 호출 (로컬 개발 환경이거나 테스트 목적인 경우 모의 성공 처리)
            const isLocalOrTest = process.env.NODE_ENV === 'development' || 
                                  cleanAccNo.startsWith('111222') || 
                                  cleanAccNo.startsWith('444555') ||
                                  requestData.account_holder.includes('테스트') || 
                                  requestData.account_holder.includes('피추천인');

            if (isLocalOrTest) {
                console.log('⚠️ [MOCK] Bypassing Innopay transfer for testing/development:', {
                    bankCode,
                    accountHolder: requestData.account_holder,
                    amount: requestData.amount
                });
            } else {
                console.log('📤 [B2B] 이노페이 송금 API 호출 시작...', {
                    bankCode,
                    accountHolder: requestData.account_holder,
                    amount: requestData.amount
                });

                try {
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
                            acntNm: requestData.account_holder,
                            amt: String(requestData.amount),
                            depAcntNo: '66400001397152',
                            depAcntNm: '부고온정산',
                        }),
                    });

                    const transferResult = await transferRes.json();
                    console.log('📥 [B2B] 송금 결과:', transferResult);

                    if (transferResult.resultCode !== '0000') {
                        return NextResponse.json({ 
                            error: `이노페이 송금 실패: ${transferResult.resultMsg || '알 수 없는 오류'}` 
                        }, { status: 400 });
                    }
                } catch (transferErr: any) {
                    console.error('이노페이 송금 API 연동 오류:', transferErr);
                    return NextResponse.json({ error: `이노페이 송금 API 연동 중 오류 발생: ${transferErr.message}` }, { status: 500 });
                }
            }

            // 4. 송금 성공 시 RPC 호출하여 승인 완료 처리
            const { data, error } = await supabase.rpc('approve_withdrawal_request', {
                p_request_id: requestId
            });

            if (error) {
                console.error('출금 승인 RPC 오류 (송금은 됨):', error);
                return NextResponse.json({ 
                    error: '이체는 완료되었으나 DB 상태 업데이트에 실패했습니다. 어드민 수동 보정이 필요합니다.' 
                }, { status: 500 });
            }

            console.log(`✅ B2B 출금 승인 및 실이체 완료: RequestID=${requestId}`);

            // 슬랙 알림 전송 (비동기)
            if (userData) {
                sendB2BWithdrawalApproveNotification({
                    company_name: userData.company_name || '미등록',
                    owner_name: userData.owner_name || '미등록',
                    amount: requestData.amount,
                    net_amount: requestData.net_amount || requestData.amount,
                    bank_name: requestData.bank_name,
                    account_no: requestData.account_no,
                    account_holder: requestData.account_holder,
                    request_id: requestId,
                }).catch(err => console.error('❌ 출금 승인 슬랙 알림 실패:', err));
            }

            return NextResponse.json({ success: true, message: '출금 이체가 정상적으로 완료되었으며 승인 처리되었습니다.' });
        } else if (action === 'reject') {
            // 출금 반려 RPC 호출
            const { data, error } = await supabase.rpc('reject_withdrawal_request', {
                p_request_id: requestId
            });

            if (error) {
                console.error('출금 반려 RPC 오류:', error);
                return NextResponse.json({ error: error.message || '출금 반려 처리에 실패했습니다.' }, { status: 500 });
            }

            console.log(`❌ B2B 출금 반려 및 예치금 환원 완료: RequestID=${requestId}`);

            // 슬랙 알림 전송을 위해 출금 신청 내역 및 파트너 정보 조회
            const { data: rejectRequestData } = await supabase
                .from('withdrawal_requests')
                .select('user_id, amount, bank_name, account_no, account_holder')
                .eq('id', requestId)
                .single();

            if (rejectRequestData) {
                const { data: rejectUserData } = await supabase
                    .from('b2b_users')
                    .select('company_name, owner_name')
                    .eq('id', rejectRequestData.user_id)
                    .single();

                if (rejectUserData) {
                    sendB2BWithdrawalRejectNotification({
                        company_name: rejectUserData.company_name || '미등록',
                        owner_name: rejectUserData.owner_name || '미등록',
                        amount: rejectRequestData.amount,
                        bank_name: rejectRequestData.bank_name,
                        account_no: rejectRequestData.account_no,
                        account_holder: rejectRequestData.account_holder,
                        request_id: requestId,
                    }).catch(err => console.error('❌ 출금 반려 슬랙 알림 실패:', err));
                }
            }

            return NextResponse.json({ success: true, message: '출금 신청이 반려되었으며 예치금이 안전하게 환원되었습니다.' });
        } else {
            return NextResponse.json({ error: '올바르지 않은 액션입니다.' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('B2B 출금 처리 API 오류:', error);
        return NextResponse.json({ error: '출금 처리에 실패했습니다.' }, { status: 500 });
    }
}
