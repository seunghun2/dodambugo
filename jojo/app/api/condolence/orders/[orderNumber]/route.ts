import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 부의금 주문번호로 주문 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderNumber: string }> }
) {
    const { orderNumber } = await params;

    if (!orderNumber) {
        return NextResponse.json({ error: '주문번호가 필요합니다.' }, { status: 400 });
    }

    try {
        let query = supabase.from('condolence_orders').select('*');

        if (orderNumber.startsWith('DO')) {
            // B2B DO 주문번호 → B2B 순번으로 조회
            const doNum = parseInt(orderNumber.replace('DO', ''), 10);
            if (isNaN(doNum) || doNum < 1) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            // B2B 주문만 id 오름차순으로 가져와서 N번째 찾기
            const { data: b2bOrders } = await supabase
                .from('condolence_orders')
                .select('*')
                .eq('source', 'b2b')
                .order('id', { ascending: true });

            const targetOrder = (b2bOrders || [])[doNum - 1];
            if (!targetOrder) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            targetOrder.order_number = 'DO' + String(doNum).padStart(6, '0');
            return NextResponse.json({ success: true, order: targetOrder });

        } else if (orderNumber.startsWith('CO')) {
            query = query.eq('order_number', orderNumber);
        } else if (orderNumber.startsWith('COND_') || orderNumber.startsWith('BCOND_')) {
            query = query.eq('moid', orderNumber);
        } else {
            query = query.eq('id', orderNumber);
        }

        const { data, error } = await query.single();

        if (error || !data) {
            console.error('부의금 주문 조회 실패:', error);
            return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
        }

        // B2C 주문은 CO 그대로 유지 (마음부고 영향 zero)
        return NextResponse.json({ success: true, order: data });
    } catch (err) {
        console.error('부의금 주문 조회 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
