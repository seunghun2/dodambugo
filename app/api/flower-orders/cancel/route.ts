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
        default: return '01';
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

        // 3. DB 상태 업데이트
        const { error: updateError } = await supabase
            .from('flower_orders')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancel_reason: cancelReason || null,
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('DB 업데이트 실패:', updateError);
        }

        // 4. 알림톡 발송 (고객에게)
        if (order.sender_phone) {
            try {
                const phoneNumber = order.sender_phone.replace(/-/g, '');
                // TODO: 취소 알림톡 템플릿 승인 후 사용
                // await sendAlimtalk(
                //     phoneNumber,
                //     'CANCEL_TEMPLATE_ID',  // 취소 템플릿 ID
                //     {
                //         '상품명': order.product_name || '',
                //         '환불금액': order.product_price?.toLocaleString() || '',
                //     }
                // );
                console.log('📱 취소 알림톡 발송 예정:', phoneNumber);
            } catch (err) {
                console.error('취소 알림톡 실패:', err);
            }
        }

        // 5. 슬랙 알림
        try {
            const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
            if (slackWebhookUrl) {
                await fetch(slackWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `🚫 *화환 주문 취소*\n• 주문번호: ${order.order_number}\n• 상품: ${order.product_name}\n• 금액: ${order.product_price?.toLocaleString()}원\n• 보낸분: ${order.sender_name}\n• 사유: ${cancelReason || '미입력'}`,
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
