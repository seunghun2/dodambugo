import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { orderId, type } = await request.json();

        if (!orderId || !type) {
            return NextResponse.json({ error: 'orderId와 type이 필요합니다' }, { status: 400 });
        }

        // 주문 정보 조회
        const { data: order, error: orderError } = await supabase
            .from('flower_orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError) {
            console.error('주문 조회 에러:', orderError);
            return NextResponse.json({ error: '주문 조회 실패: ' + orderError.message }, { status: 404 });
        }

        if (!order) {
            return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });
        }

        // 부고에서 고인명 별도 조회
        let deceasedName = '';
        if (order.bugo_id) {
            const { data: bugo } = await supabase
                .from('bugo')
                .select('deceased_name')
                .eq('id', order.bugo_id)
                .single();
            deceasedName = bugo?.deceased_name || '';
        }

        const phone = order.sender_phone?.replace(/-/g, '');
        if (!phone) {
            return NextResponse.json({ error: '주문자 연락처가 없습니다' }, { status: 400 });
        }

        let templateId = '';
        let variables: Record<string, string> = {};

        if (type === 'delivering') {
            // 05-화환 배송 안내
            templateId = 'KA01TP260128002838240ioiYHpImLDY';
            variables = {
                '#{상품명}': order.product_name,
                '#{주문자명}': order.sender_name,
                '#{주소}': order.funeral_home
                    ? `${order.funeral_home}${order.room ? ' ' + order.room : ''}`
                    : order.address || '장례식장'
            };
        } else if (type === 'delivered') {
            // 06-화환 배송 완료
            templateId = 'KA01TP260127010157157MBMxvZX3qUI';
            variables = {
                '#{상품명}': order.product_name || '',
                '#{받는분}': order.recipient_name || '',
                '#{장례식장}': order.funeral_home
                    ? `${order.funeral_home}${order.room ? ' ' + order.room : ''}`
                    : '',
                '#{주문번호}': order.order_number || '',
                '#{고인명}': deceasedName
            };
        } else {
            return NextResponse.json({ error: '잘못된 type입니다' }, { status: 400 });
        }

        // 알림톡 발송
        const result = await sendAlimtalk(
            phone,
            templateId,
            variables
        );

        console.log('알림톡 발송 API 결과:', JSON.stringify(result, null, 2));

        // Solapi 응답에서 에러 확인 (groupId가 있으면 성공, errorCode가 있으면 실패)
        if (result.errorCode || result.errorMessage) {
            console.error('알림톡 발송 실패:', result.errorCode, result.errorMessage);
            return NextResponse.json({ error: '알림톡 발송 실패: ' + (result.errorMessage || result.errorCode) }, { status: 500 });
        }

        // 📱 [B2B] 파트너에게 화환 배송 완료 안내 문자 및 인앱 알람 발송
        if (type === 'delivered' && order.bugo_id) {
            try {
                const { data: bugoData } = await supabase
                    .from('bugo')
                    .select('b2b_user_id')
                    .eq('id', order.bugo_id)
                    .single();
 
                if (bugoData?.b2b_user_id) {
                    // 1. 인앱 알림 적재
                    try {
                        const { insertInAppAlarm } = await import('@/lib/partner-notification');
                        const alarmTitle = '화환 배송 완료';
                        const alarmBody = `故 ${deceasedName || ''}님 빈소로 주문된 화환 배송이 완료되었습니다. (${order.product_name || ''})`;
                        const alarmUrl = `/b2b/order/${order.id}`;
                        
                        await insertInAppAlarm(
                            bugoData.b2b_user_id,
                            'flower_delivery_completed',
                            alarmTitle,
                            alarmBody,
                            alarmUrl,
                            'alarm_order'
                        );
                        console.log(`🔔 [B2B] 파트너 화환 배송 완료 인앱 알람 적재 완료: ${bugoData.b2b_user_id}`);
                    } catch (inAppErr) {
                        console.error('❌ [B2B] 파트너 화환 배송 완료 인앱 알람 적재 실패:', inAppErr);
                    }

                    // 2. 파트너용 LMS 발송
                    const { data: partnerUser } = await supabase
                        .from('b2b_users')
                        .select('phone, company_name, owner_name')
                        .eq('id', bugoData.b2b_user_id)
                        .single();
 
                    if (partnerUser?.phone) {
                        const partnerPhone = partnerUser.phone.replace(/-/g, '');
                        const { sendLMS } = await import('@/lib/solapi');
 
                        const partnerMsg = `[부고온] 파트너 화환 배송 완료 안내
 
안녕하세요, ${partnerUser.company_name} ${partnerUser.owner_name} 파트너님.
개설하신 부고에서 주문된 화환의 배송이 완료되었습니다.
 
■ 고인명: 故 ${deceasedName || ''}
■ 상품명: ${order.product_name || ''}
■ 주문자: ${order.sender_name || ''}
■ 배송처: ${order.funeral_home || ''} ${order.room || ''}
 
부고온 파트너 서비스를 이용해 주셔서 감사합니다.`;
 
                        await sendLMS(partnerPhone, '[부고온] 화환 배송 완료', partnerMsg);
                        console.log(`📱 [B2B] 파트너 화환 배송 완료 문자 발송 완료: ${partnerPhone}`);
                    }
                }
            } catch (partnerErr) {
                console.error('❌ [B2B] 파트너 화환 배송 완료 알림 발송 실패:', partnerErr);
            }
        }

        // 상태 업데이트
        const newStatus = type === 'delivering' ? 'delivering' : 'delivered';
        await supabase
            .from('flower_orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        return NextResponse.json({
            success: true,
            message: `${type === 'delivering' ? '배송중' : '배송완료'} 알림톡이 발송되었습니다.`
        });

    } catch (error) {
        console.error('배송 알림톡 발송 오류:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
