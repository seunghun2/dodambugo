import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INNOPAY_CANCEL_API_URL = 'https://api.innopay.co.kr/api/cancelApi';

// 결제방법에 따른 서비스코드 (INNOPAY 문서 기준)
const getSvcCd = (paymentMethod: string) => {
    if (paymentMethod.includes('간편결제') || paymentMethod === 'easy') return '16';
    if (paymentMethod.includes('신용카드') || paymentMethod === 'card') return '01';
    if (paymentMethod.includes('계좌이체') || paymentMethod === 'bank') return '02';
    if (paymentMethod.includes('가상계좌') || paymentMethod === 'virtual') return '03';
    return '01';  // 기본값 카드
};

// 주문 취소 API
export async function POST(request: NextRequest) {
    try {
        const { orderId, cancelReason } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: '주문 ID가 필요합니다.' }, { status: 400 });
        }

        // 1. 주문 정보 조회
        const { data: order, error: orderError } = await supabase
            .from('flower_orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 이미 취소된 주문
        if (order.status === 'cancelled') {
            return NextResponse.json({ error: '이미 취소된 주문입니다.' }, { status: 400 });
        }

        // 2. INNOPAY 취소 API 호출 (TID가 있는 경우)
        let innopayResult = null;
        if (order.tid) {
            const cancelData = {
                mid: process.env.INNOPAY_MID || 'pgmaeum01m',
                tid: order.tid,
                svcCd: getSvcCd(order.payment_method),  // 서비스코드
                partialCancelCode: '0',  // 0: 전체취소
                cancelAmt: String(order.product_price),
                cancelMsg: cancelReason || '고객 요청에 의한 취소',
                cancelPwd: process.env.INNOPAY_CANCEL_PWD || '0612',  // 취소비밀번호
            };

            console.log('🔄 INNOPAY 취소 요청:', cancelData);

            const response = await fetch(INNOPAY_CANCEL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Merchant-Key': process.env.INNOPAY_LICENSE_KEY || '',
                },
                body: JSON.stringify(cancelData),
            });

            innopayResult = await response.json();
            console.log('🔄 INNOPAY 취소 응답:', innopayResult);

            // INNOPAY 취소 실패 시 (2001이 성공)
            if (innopayResult.resultCode !== '2001') {
                console.error('INNOPAY 취소 실패:', innopayResult);
                return NextResponse.json({
                    error: `INNOPAY 취소 실패: ${innopayResult.resultMsg || '알 수 없는 오류'}`,
                    innopayResult
                }, { status: 400 });
            }
        }

        // 3. DB 상태 업데이트 (스키마 캐시 문제 방지 - status만 먼저)
        const { error: updateError } = await supabase
            .from('flower_orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId);

        if (updateError) {
            console.error('DB 업데이트 실패:', updateError);
        }

        // 3-2. cancelled_at 별도 업데이트 (실패해도 OK)
        try {
            await supabase
                .from('flower_orders')
                .update({ cancelled_at: new Date().toISOString() })
                .eq('id', orderId);
            console.log('✅ cancelled_at 저장 완료');
        } catch (e) {
            console.error('cancelled_at 저장 실패 (무시):', e);
        }

        // 3-3. cancel_reason 별도 업데이트 (실패해도 OK)
        try {
            await supabase
                .from('flower_orders')
                .update({ cancel_reason: cancelReason || null })
                .eq('id', orderId);
            console.log('✅ 취소 사유 저장 완료');
        } catch (e) {
            console.error('취소 사유 저장 실패 (무시):', e);
        }

        // 4. 부고 정보 조회 (부고번호 및 B2B 파트너 ID 조회)
        let bugoNumber = '';
        let partnerId = null;
        console.log('🔍 부고 조회:', { bugo_id: order.bugo_id });
        if (order.bugo_id) {
            const { data: bugoData, error: bugoError } = await supabase
                .from('bugo')
                .select('bugo_number, b2b_user_id')
                .eq('id', order.bugo_id)
                .single();
            console.log('🔍 부고 조회 결과:', { bugoData, bugoError });
            bugoNumber = bugoData?.bugo_number || '';
            partnerId = bugoData?.b2b_user_id || null;
        }

        // B2B 수당 회수 로직 추가
        let recommenderIdToNotify: string | null = null;
        let bonusAmountToNotify = 0;
        let partnerUserOwnerName = '';

        if (partnerId) {
            try {
                // 0. 파트너 성함 조회
                const { data: partnerUser } = await supabase
                    .from('b2b_users')
                    .select('owner_name')
                    .eq('id', partnerId)
                    .single();
                partnerUserOwnerName = partnerUser?.owner_name || '';

                // 1. 해당 주문으로 실제 적립되었던 수당 거래 내역 조회 (정확한 회수금액 확보)
                const { data: originalRewardTx } = await supabase
                    .from('deposit_transactions')
                    .select('amount')
                    .eq('related_order_id', order.id)
                    .eq('type', 'wreath_reward')
                    .maybeSingle();

                const rewardAmount = originalRewardTx?.amount ? Math.abs(originalRewardTx.amount) : 20000;

                // 2. 현재 잔액 조회
                const { data: currentDeposit } = await supabase
                    .from('deposits')
                    .select('balance')
                    .eq('user_id', partnerId)
                    .single();

                if (currentDeposit) {
                    const newBalance = Math.max(0, (currentDeposit.balance || 0) - rewardAmount);
                    // 3. 잔액 차감
                    await supabase
                        .from('deposits')
                        .update({
                            balance: newBalance,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('user_id', partnerId);
                    
                    console.log(`📉 B2B 수당 회수 성공: Partner=${partnerId}, Amount=-${rewardAmount}, NewBalance=${newBalance}`);
                }

                // 4. 회수 트랜잭션 기록
                await supabase
                    .from('deposit_transactions')
                    .insert({
                        user_id: partnerId,
                        amount: -rewardAmount,
                        type: 'reward_cancel',
                        description: `화환 주문 취소로 인한 수당 회수 (${order.order_number})`,
                    });

                // 5. 해당 주문에 매칭된 추천인 수당(referral_bonus)이 있다면 추천인 수당도 함께 회수
                const { data: refTx } = await supabase
                    .from('deposit_transactions')
                    .select('*')
                    .eq('related_order_id', order.id)
                    .eq('type', 'referral_bonus')
                    .maybeSingle();

                if (refTx && refTx.user_id && refTx.amount > 0) {
                    const recommenderId = refTx.user_id;
                    const bonusAmount = refTx.amount;
                    recommenderIdToNotify = recommenderId;
                    bonusAmountToNotify = bonusAmount;

                    const { data: refDeposit } = await supabase
                        .from('deposits')
                        .select('balance')
                        .eq('user_id', recommenderId)
                        .single();

                    if (refDeposit) {
                        const newRefBalance = Math.max(0, (refDeposit.balance || 0) - bonusAmount);
                        await supabase
                            .from('deposits')
                            .update({
                                balance: newRefBalance,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('user_id', recommenderId);
                        
                        console.log(`📉 B2B 추천인 수당 회수 성공: Recommender=${recommenderId}, Amount=-${bonusAmount}, NewBalance=${newRefBalance}`);
                    }

                    await supabase
                        .from('deposit_transactions')
                        .insert({
                            user_id: recommenderId,
                            amount: -bonusAmount,
                            type: 'reward_cancel',
                            description: `화환 주문 취소로 인한 추천 수당 회수 (${order.order_number})`,
                        });
                }

                // 6. 상조회사 정산 장부(b2b_company_settlements) 상태 취소(cancelled)로 변경
                await supabase
                    .from('b2b_company_settlements')
                    .update({ status: 'cancelled' })
                    .eq('order_id', order.id);
                console.log(`📉 상조회사 정산 장부 취소 처리 완료: OrderId=${order.id}`);
            } catch (err) {
                console.error('❌ B2B 수당 회수 처리 중 에러:', err);
            }

            // 인앱 알람: 화환 환불 알림 (비동기)
            import('@/lib/partner-notification').then(({ insertInAppAlarm }) => {
                // 1. 화환 수주 파트너(김미연) 알림
                insertInAppAlarm(
                    partnerId!, 'flower_refund',
                    '화환 주문이 취소되었습니다',
                    `${order.product_name || '화환'} | 주문자: ${order.sender_name || ''}`,
                    '/b2b/wallet', 'alarm_order'
                );

                // 2. 상위 추천인 파트너(백승훈) 알림
                if (recommenderIdToNotify && bonusAmountToNotify > 0) {
                    const sellerTitle = partnerUserOwnerName ? `${partnerUserOwnerName} 장례지도사님` : '추천 파트너';
                    insertInAppAlarm(
                        recommenderIdToNotify, 'flower_refund',
                        '추천 수당 회수 안내',
                        `추천 수당 ${bonusAmountToNotify.toLocaleString()}원이 회수되었습니다 (${sellerTitle}의 화환 주문 취소)`,
                        '/b2b/wallet', 'alarm_reward'
                    );
                }
            });
        }

        // 5. 알림톡 발송 (고객에게)
        if (order.sender_phone) {
            try {
                const phoneNumber = order.sender_phone.replace(/-/g, '');
                // 결제수단 한글 변환
                const paymentMethodText: Record<string, string> = {
                    'card': '신용카드',
                    'easy': '간편결제',
                    'bank': '계좌이체',
                    'virtual': '가상계좌',
                };

                const isB2B = !!partnerId;
                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP260128002330965AMneEQhHRIM',  // 화환 구매 취소 템플릿
                    {
                        '주문자명': order.sender_name || '',
                        '환불금액': order.product_price?.toLocaleString() || '',
                        '결제수단': paymentMethodText[order.payment_method] || order.payment_method || '',
                    },
                    undefined,
                    isB2B
                );
                console.log('📱 취소 알림톡 발송 완료:', phoneNumber);
            } catch (err) {
                console.error('취소 알림톡 실패:', err);
            }
        }

        // 6. 슬랙 알림
        try {
            const isB2BOrder = !!partnerId;
            const slackWebhookUrl = isB2BOrder
                ? (process.env.SLACK_WEBHOOK_B2B_FLOWER || process.env.SLACK_WEBHOOK_FLOWER)
                : process.env.SLACK_WEBHOOK_FLOWER;
            const brand = isB2BOrder ? '부고온' : '마음부고';
            if (slackWebhookUrl) {
                await fetch(slackWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `[${brand}] 화환 주문이 취소되었습니다. (부고장번호: ${bugoNumber || '-'} / 주문번호: ${order.order_number || '-'})\n- 상품명: ${order.product_name || '-'}\n- 배송지: ${order.funeral_home || ''}${order.room ? ' ' + order.room : ''}${order.address ? ' ' + order.address : ''}\n- 주문자: ${order.sender_name || ''}(${order.sender_phone || ''})\n- 결제수단: ${order.payment_method === 'card' ? '신용카드' : order.payment_method || '-'}`,
                    }),
                });
                console.log('📢 취소 슬랙 알림 발송 완료');
            }
        } catch (err) {
            console.error('취소 슬랙 알림 실패:', err);
        }

        return NextResponse.json({
            success: true,
            message: '주문이 취소되었습니다.',
            innopayResult,
        });

    } catch (err) {
        console.error('주문 취소 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
