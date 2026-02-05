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
            .select('*, bugo:bugo_id(funeral_home, address, room)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 });
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
                '#{주소}': order.bugo?.funeral_home
                    ? `${order.bugo.funeral_home}${order.bugo.room ? ' ' + order.bugo.room : ''}`
                    : order.address || '장례식장'
            };
        } else if (type === 'delivered') {
            // 06-화환 배송 완료
            templateId = 'KA01TP260127010157157MBMxvZX3qUI';
            variables = {
                '#{상품명}': order.product_name,
                '#{장례식장}': order.bugo?.funeral_home || order.funeral_home || '장례식장'
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

        if (!result.success) {
            console.error('알림톡 발송 실패:', result.error);
            return NextResponse.json({ error: '알림톡 발송 실패: ' + result.error }, { status: 500 });
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
