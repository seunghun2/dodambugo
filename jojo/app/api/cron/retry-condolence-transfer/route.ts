import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';

// Cron Job: 매일 아침 7시 실행 (KST 07:00 = UTC 22:00)
// 자정 점검(D091 업무 개시전) 등으로 즉시 송금에 실패한 부의금을 자동으로 재송금(입금이체) 처리

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function verifyCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
    if (process.env.NODE_ENV === 'development') return true;
    const { searchParams } = new URL(request.url);
    if (searchParams.get('key') === process.env.CRON_SECRET) return true;
    return false;
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

function getBankCode(name: string): string | null {
    if (!name) return null;
    if (BANK_CODE_MAP[name]) return BANK_CODE_MAP[name];
    for (const key in BANK_CODE_MAP) {
        if (name.includes(key) || key.includes(name)) return BANK_CODE_MAP[key];
    }
    return null;
}

async function handleRetryTransfers() {
    const supabase = getSupabase();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // 1. 카드결제 완료(completed)되었으나 아직 송금 미완료(settled_at is null)인 건 조회 (최근 3일 이내)
    const { data: pendingOrders, error: queryError } = await supabase
        .from('condolence_orders')
        .select('*')
        .eq('status', 'completed')
        .is('settled_at', null)
        .gte('created_at', threeDaysAgo)
        .order('created_at', { ascending: true });

    if (queryError) {
        console.error('❌ [Cron-Retry] 미정산 부의금 조회 실패:', queryError);
        return { success: false, error: queryError.message, processed: 0 };
    }

    if (!pendingOrders || pendingOrders.length === 0) {
        console.log('ℹ️ [Cron-Retry] 재송금 대상 미정산 부의금 없음');
        return { success: true, message: 'No pending condolence transfers', processed: 0 };
    }

    console.log(`🚀 [Cron-Retry] 재송금 대상 총 ${pendingOrders.length}건 발견`);
    const results: Array<{ order_number: string; success: boolean; error?: string }> = [];

    for (const order of pendingOrders) {
        try {
            if (!order.bank_name || !order.account_no || !order.amount || order.amount <= 0) {
                console.warn(`⚠️ [Cron-Retry] 송금 정보 부족 (주문: ${order.order_number})`);
                results.push({ order_number: order.order_number, success: false, error: 'Missing transfer info' });
                continue;
            }

            const bankCode = getBankCode(order.bank_name);
            if (!bankCode) {
                console.error(`❌ [Cron-Retry] 지원하지 않는 은행: ${order.bank_name} (주문: ${order.order_number})`);
                results.push({ order_number: order.order_number, success: false, error: `Unsupported bank: ${order.bank_name}` });
                continue;
            }

            const cleanAccNo = (order.account_no || '').replace(/-/g, '');
            const txMoid = `CONDTX_RETRY_${order.id}_${Date.now()}`;
            const now = new Date();
            const reqDt = now.getFullYear().toString() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0') +
                String(now.getSeconds()).padStart(2, '0');

            console.log(`📤 [Cron-Retry] 송금 요청 시작 (${order.order_number}):`, {
                bank: order.bank_name,
                acc: cleanAccNo,
                holder: order.recipient_name,
                amt: order.amount,
            });

            // 이노페이 펌뱅킹 프록시 호출
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
                    acntNm: (order.recipient_name || '').trim(),
                    amt: String(order.amount),
                    depAcntNo: '66400001397152',
                    depAcntNm: order.buyer_name || '마음부고',
                }),
            });

            const transferResult = await transferRes.json();
            console.log(`📥 [Cron-Retry] 송금 응답 (${order.order_number}):`, transferResult);

            if (transferResult.resultCode === '0000') {
                // 송금 성공 -> DB 상태 갱신
                await supabase
                    .from('condolence_orders')
                    .update({
                        status: 'transferred',
                        settled_at: new Date().toISOString()
                    })
                    .eq('id', order.id);

                console.log(`✅ [Cron-Retry] 송금 성공 및 DB 갱신 완료: ${order.order_number}`);

                // 상주 연락처 확인 후 알림톡 발송
                try {
                    let mournerPhone = '';
                    const recipientName = (order.recipient_name || '').trim();

                    if (order.bugo_number) {
                        const { data: bugoData } = await supabase
                            .from('bugo')
                            .select('*')
                            .eq('bugo_number', order.bugo_number)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .single();

                        if (bugoData) {
                            if (bugoData.mourners && Array.isArray(bugoData.mourners)) {
                                const matched = bugoData.mourners.find(
                                    (m: any) => m.name === recipientName && m.contact
                                );
                                if (matched) mournerPhone = matched.contact;
                            }
                            if (!mournerPhone && recipientName === (bugoData.mourner_name || '').trim()) {
                                mournerPhone = bugoData.applicant_phone || bugoData.phone_password || '';
                            }

                            if (mournerPhone) {
                                const cleanPhone = mournerPhone.replace(/-/g, '');
                                const isB2B = !!bugoData.b2b_user_id || (order.moid && order.moid.startsWith('BCOND_'));
                                await sendAlimtalk(
                                    cleanPhone,
                                    'KA01TP260213060236557haj4AEvPgIn', // 부의금 전달 완료 (상주용)
                                    {
                                        '수신자명': recipientName,
                                        '보내는분': order.buyer_name || '',
                                        '부의금액': Number(order.amount).toLocaleString(),
                                        '은행명': order.bank_name || '',
                                        '계좌번호': order.account_no || '',
                                    },
                                    undefined,
                                    isB2B
                                );
                                console.log(`✅ [Cron-Retry] 상주 알림톡 발송 완료: ${cleanPhone}`);
                            }
                        }
                    }
                } catch (alimErr) {
                    console.error(`⚠️ [Cron-Retry] 알림톡 발송 실패 (${order.order_number}):`, alimErr);
                }

                results.push({ order_number: order.order_number, success: true });
            } else {
                console.error(`❌ [Cron-Retry] 송금 실패 (${order.order_number}):`, transferResult.resultCode, transferResult.resultMsg);
                results.push({
                    order_number: order.order_number,
                    success: false,
                    error: `[${transferResult.resultCode}] ${transferResult.resultMsg}`
                });
            }
        } catch (err: any) {
            console.error(`❌ [Cron-Retry] 처리 오류 (${order.order_number}):`, err);
            results.push({ order_number: order.order_number, success: false, error: err.message });
        }
    }

    return {
        success: true,
        total: pendingOrders.length,
        results
    };
}

export async function GET(request: NextRequest) {
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await handleRetryTransfers();
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await handleRetryTransfers();
    return NextResponse.json(data);
}
