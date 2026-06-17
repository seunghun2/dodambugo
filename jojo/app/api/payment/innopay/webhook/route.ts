import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';
import { sendFlowerOrderNotification } from '@/lib/slack';

// Supabase 클라이언트
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// INNOPAY 가상계좌 입금 웹훅
export async function POST(request: NextRequest) {
    console.log('🔔 INNOPAY 가상계좌 웹훅 수신');

    try {
        const body = await request.json();
        console.log('📥 웹훅 데이터:', JSON.stringify(body));

        // INNOPAY 가상계좌 입금 통보 파라미터
        const {
            mid,
            tid,
            moid,      // 주문번호
            amt,       // 입금액
            status,    // 입금상태 (0: 입금완료)
            bankCode,  // 은행코드
            accountNo, // 계좌번호
            depositName, // 입금자명
            mallReserved, // 가맹점 예약 필드 (orderId 포함)
        } = body;

        // 입금 완료 상태가 아니면 무시
        if (status !== '0' && status !== 0) {
            console.log('⏳ 입금 완료 아님, 상태:', status);
            return NextResponse.json({ success: true, message: '대기 상태' });
        }

        // mallReserved에서 orderId 추출
        let orderId = '';
        try {
            if (mallReserved) {
                const parsed = JSON.parse(mallReserved);
                orderId = parsed.orderId || '';
            }
        } catch (e) {
            console.error('mallReserved 파싱 오류:', e);
        }

        console.log('📦 orderId:', orderId, 'moid:', moid);

        // DB 업데이트 - 입금 완료 상태로 변경
        let orderData: any = null;
        if (orderId) {
            const { data: updatedOrder, error: updateError } = await supabase
                .from('flower_orders')
                .update({ status: 'completed' })
                .eq('id', orderId)
                .select('*')
                .single();

            if (updateError) {
                console.error('주문 상태 업데이트 오류:', updateError);
            } else {
                orderData = updatedOrder;
                console.log('✅ 주문 상태 업데이트 완료');
            }
        }

        // 📱 알림톡 발송 (입금 완료)
        if (orderData?.sender_phone) {
            const phoneNumber = orderData.sender_phone.replace(/-/g, '');
            sendAlimtalk(
                phoneNumber,
                'KA01TP2601311316586435pxsJOWuWbz',  // 화환 결제완료 템플릿
                {
                    '상품명': orderData.product_name || '',
                    '금액': Number(amt).toLocaleString(),
                    '주문번호': orderData.order_number || moid,
                    '받는분': orderData.recipient_name || '',
                    '장례식장': `${orderData.funeral_home || ''} ${orderData.room || ''}`.trim(),
                }
            ).then(() => {
                console.log('✅ 가상계좌 입금완료 알림톡 발송:', phoneNumber);
            }).catch(err => console.error('❌ 가상계좌 입금완료 알림톡 실패:', err));
        }

        // 🔔 슬랙 알림 발송
        if (orderData) {
            // 부고 데이터 조회 (대표상주, 주소 포함)
            let bugoData: any = null;
            if (orderData.bugo_id) {
                const { data } = await supabase
                    .from('bugo')
                    .select('bugo_number, deceased_name, mourner_name, phone_password, mourners, address')
                    .eq('id', orderData.bugo_id)
                    .single();
                bugoData = data;
            }

            // mourners에서 수신자 연락처 매칭
            let recipientPhone = '';
            if (bugoData?.mourners && Array.isArray(bugoData.mourners)) {
                const matched = bugoData.mourners.find(
                    (m: any) => m.name === orderData.recipient_name && m.contact
                );
                if (matched) recipientPhone = matched.contact;
            }

            sendFlowerOrderNotification({
                id: orderData.order_number || moid,
                bugo_number: bugoData?.bugo_number || '',
                deceased_name: bugoData?.deceased_name || orderData.recipient_name || '',
                sender_name: orderData.sender_name,
                sender_phone: orderData.sender_phone,
                recipient_name: orderData.recipient_name,
                recipient_phone: recipientPhone,
                product_name: orderData.product_name,
                price: Number(amt),
                ribbon_text1: orderData.ribbon_text1,
                ribbon_text2: orderData.ribbon_text2,
                funeral_hall: orderData.funeral_home,
                room: orderData.room,
                address: orderData.address || bugoData?.address || '',
                payment_method: 'vbank',
                chief_mourner_name: bugoData?.mourner_name || '',
                chief_mourner_phone: bugoData?.phone_password || '',
            }).catch(err => console.error('❌ 슬랙 알림 실패:', err));
        }

        return NextResponse.json({ success: true, message: '입금 처리 완료' });

    } catch (error) {
        console.error('웹훅 처리 오류:', error);
        return NextResponse.json(
            { success: false, error: '웹훅 처리 중 오류 발생' },
            { status: 500 }
        );
    }
}
