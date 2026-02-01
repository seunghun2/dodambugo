import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INNOPAY_CANCEL_API_URL = 'https://api.innopay.co.kr/api/cancelApi';

// 결제방법에 따른 서비스코드
const getSvcCd = (paymentMethod: string) => {
    switch (paymentMethod) {
        case 'card': return '01';  // 신용카드
        case 'bank': return '02';  // 계좌이체
        case 'virtual': return '04';  // 가상계좌
        case 'easy': return '07';  // 간편결제
        default: return '01';  // 기본값 카드
    }
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

        // 4. 부고 정보 조회 (부고번호 필요)
        let bugoNumber = '';
        console.log('🔍 부고 조회:', { bugo_id: order.bugo_id });
        if (order.bugo_id) {
            const { data: bugoData, error: bugoError } = await supabase
                .from('bugo')
                .select('bugo_number')
                .eq('id', order.bugo_id)
                .single();
            console.log('🔍 부고 조회 결과:', { bugoData, bugoError });
            bugoNumber = bugoData?.bugo_number || '';
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

                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP260128002330965AMneEQhHRIM',  // 화환 구매 취소 템플릿
                    {
                        '주문자명': order.sender_name || '',
                        '환불금액': order.product_price?.toLocaleString() || '',
                        '결제수단': paymentMethodText[order.payment_method] || order.payment_method || '',
                    }
                );
                console.log('📱 취소 알림톡 발송 완료:', phoneNumber);
            } catch (err) {
                console.error('취소 알림톡 실패:', err);
            }
        }

        // 6. 슬랙 알림
        try {
            const slackWebhookUrl = process.env.SLACK_WEBHOOK_FLOWER;
            if (slackWebhookUrl) {
                await fetch(slackWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `[마음부고] 화환 주문이 취소되었습니다. (부고장번호: ${bugoNumber || '-'} / 주문번호: ${order.order_number || '-'})\n- 상품명: ${order.product_name || '-'}\n- 배송지: ${order.funeral_home || ''}${order.room ? ' ' + order.room : ''}${order.address ? ' ' + order.address : ''}\n- 주문자: ${order.sender_name || ''}(${order.sender_phone || ''})\n- 결제수단: ${order.payment_method === 'card' ? '신용카드' : order.payment_method || '-'}`,
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
