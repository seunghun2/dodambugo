import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';
import { sendFlowerOrderNotification } from '@/lib/slack';

// Supabase 클라이언트
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// INNOPAY 승인 API
export async function POST(request: NextRequest) {
    console.log('🔵 INNOPAY 승인 API 호출됨');

    try {
        const body = await request.json();
        const { paymentToken, tid, mid, amt, taxFreeAmt, moid, orderId } = body;

        console.log('📥 승인 요청 데이터:', { paymentToken: paymentToken?.substring(0, 20) + '...', tid, mid, amt, taxFreeAmt, moid, orderId });

        if (!paymentToken || !tid) {
            console.log('❌ 필수 파라미터 누락');
            return NextResponse.json(
                { success: false, error: '필수 결제 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // INNOPAY 승인 API 호출
        console.log('📤 INNOPAY API 호출 시작...');
        const approveResponse = await fetch('https://api.innopay.co.kr/v1/transactions/pay', {
            method: 'POST',
            headers: {
                'Payment-Token': paymentToken,
                'Merchant-Key': process.env.INNOPAY_LICENSE_KEY || '',
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                tid,
                mid: mid || process.env.INNOPAY_MID || 'pgmaeum01m',
                amt,
                taxFreeAmt: taxFreeAmt || '0',
                moid,
            }),
        });

        const approveResult = await approveResponse.json();
        console.log('📥 INNOPAY 승인 결과:', JSON.stringify(approveResult));

        // INNOPAY HTTP 에러 체크
        if (!approveResponse.ok) {
            console.log('❌ INNOPAY HTTP 에러:', approveResponse.status);
            return NextResponse.json(
                {
                    success: false,
                    error: approveResult.message || approveResult.resultMsg || '결제 승인 실패',
                    code: approveResult.code || approveResult.resultCode,
                    innopayResponse: approveResult,  // 전체 응답 포함
                },
                { status: 400 }
            );
        }

        // 승인 성공 체크 - INNOPAY는 success 필드 사용
        // 성공: {success: true, data: {...}}
        // 실패: {success: false, error: {...}} 또는 {resultCode: 'XXXX', resultMsg: '...'}
        const isSuccess = approveResult.success === true ||
            approveResult.resultCode === '0000' ||
            approveResult.resultCode === '00';

        if (!isSuccess) {
            const errorInfo = approveResult.error || {};
            return NextResponse.json(
                {
                    success: false,
                    error: errorInfo.message || approveResult.resultMsg || '결제 승인 실패',
                    code: errorInfo.code || approveResult.resultCode,
                    innopayResponse: approveResult,
                },
                { status: 400 }
            );
        }

        console.log('✅ INNOPAY 승인 성공!');

        // INNOPAY 응답에서 영수증 URL 추출
        const receiptUrl = approveResult.data?.receiptUrl || '';

        // mallReserved에서 orderId, bugoId 추출 (INNOPAY 응답에서 가져옴)
        let actualOrderId = '';
        let bugoNumber = '';
        try {
            const mallReserved = approveResult.data?.etc?.mallReserved;
            if (mallReserved) {
                const parsed = JSON.parse(mallReserved);
                actualOrderId = parsed.orderId || '';
                bugoNumber = parsed.bugoId || '';
                console.log('📦 mallReserved 추출:', { orderId: actualOrderId, bugoNumber });
            }
        } catch (e) {
            console.error('mallReserved 파싱 오류:', e);
        }

        // DB 업데이트 - 결제 완료 상태로 변경 + TID 저장
        let orderData: any = null;
        const transactionId = approveResult.data?.tid || '';
        const payMethod = approveResult.data?.payMethod || 'CARD';

        if (actualOrderId) {
            const { data: updatedOrder, error: updateError } = await supabase
                .from('flower_orders')
                .update({
                    status: 'completed',
                    tid: transactionId,  // 취소 시 필요!
                    payment_method: payMethod === 'EPAY' ? 'easy' : 'card',
                })
                .eq('id', actualOrderId)
                .select('*')
                .single();

            if (updateError) {
                console.error('주문 상태 업데이트 오류:', updateError);
            } else {
                orderData = updatedOrder;

                // bugo_number 별도 조회
                if (orderData.bugo_id) {
                    const { data: bugoData } = await supabase
                        .from('bugos')
                        .select('bugo_number, deceased_name')
                        .eq('id', orderData.bugo_id)
                        .single();

                    if (bugoData) {
                        orderData.bugo = bugoData;
                    }
                }
            }
        }

        // 📱 알림톡 발송 (결제 완료)
        console.log('📱 알림톡 발송 체크:', {
            hasOrderData: !!orderData,
            senderPhone: orderData?.sender_phone,
            actualOrderId
        });

        if (orderData?.sender_phone) {
            const phoneNumber = orderData.sender_phone.replace(/-/g, '');
            try {
                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP26012700534231305PoQ81TX6h',  // 화환 결제완료 템플릿
                    {
                        '상품명': orderData.product_name || '',
                        '금액': Number(amt).toLocaleString(),
                        '주문번호': orderData.order_number || moid,
                        '받는분': orderData.recipient_name || '',
                        '장례식장': `${orderData.funeral_home || ''} ${orderData.room || ''}`.trim(),
                        '부고번호': orderData.bugo?.bugo_number || orderData.bugo_id || '',
                    }
                );
                console.log('✅ 화환 결제완료 알림톡 발송:', phoneNumber);
            } catch (err) {
                console.error('❌ 화환 결제완료 알림톡 실패:', err);
            }
        }

        // 🔔 슬랙 알림 발송
        if (orderData) {
            try {
                await sendFlowerOrderNotification({
                    id: orderData.order_number || moid,
                    bugo_number: bugoNumber || orderData.bugo?.bugo_number || '',
                    deceased_name: orderData.bugo?.deceased_name || orderData.recipient_name || '',
                    sender_name: orderData.sender_name,
                    sender_phone: orderData.sender_phone,
                    recipient_name: orderData.recipient_name,
                    product_name: orderData.product_name,
                    price: Number(amt),
                    ribbon_text1: orderData.ribbon_text1,
                    ribbon_text2: orderData.ribbon_text2,
                    funeral_hall: orderData.funeral_home,
                    room: orderData.room,
                    payment_method: 'card',
                });
                console.log('✅ 슬랙 알림 발송 완료');
            } catch (err) {
                console.error('❌ 슬랙 알림 실패:', err);
            }
        }

        return NextResponse.json({
            success: true,
            message: '결제 승인 완료',
            data: {
                tid,
                moid,
                amt,
                receiptUrl,
                approvedAt: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('결제 승인 처리 오류:', error);
        return NextResponse.json(
            { success: false, error: '결제 승인 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
