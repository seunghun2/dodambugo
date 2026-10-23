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
        if (orderNumber.startsWith('DO')) {
            // B2B DO 주문번호 → B2B 순번으로 조회 (DO000001, DO000002...)
            const doNum = parseInt(orderNumber.replace('DO', ''), 10);
            if (isNaN(doNum) || doNum < 1) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }

            // moid가 BCOND_로 시작하는 주문 또는 source가 b2b인 주문
            const { data: allOrders } = await supabase
                .from('condolence_orders')
                .select('*')
                .order('id', { ascending: true });

            const b2bOrders = (allOrders || []).filter(
                (o: any) => o.moid?.startsWith('BCOND_') || o.source === 'b2b'
            );

            const targetOrder = b2bOrders[doNum - 1];
            if (!targetOrder) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            targetOrder.order_number = 'DO' + String(doNum).padStart(6, '0');
            return NextResponse.json({ success: true, order: targetOrder });

        } else if (orderNumber.startsWith('BCOND_')) {
            // B2B moid로 직접 조회시에도 DO 순번 계산하여 반환
            const { data: allOrders } = await supabase
                .from('condolence_orders')
                .select('*')
                .order('id', { ascending: true });

            const b2bOrders = (allOrders || []).filter(
                (o: any) => o.moid?.startsWith('BCOND_') || o.source === 'b2b'
            );

            const targetIdx = b2bOrders.findIndex((o: any) => o.moid === orderNumber);
            if (targetIdx === -1) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }

            const targetOrder = b2bOrders[targetIdx];
            targetOrder.order_number = 'DO' + String(targetIdx + 1).padStart(6, '0');
            return NextResponse.json({ success: true, order: targetOrder });

        } else if (orderNumber.startsWith('CO')) {
            const { data, error } = await supabase
                .from('condolence_orders')
                .select('*')
                .eq('order_number', orderNumber)
                .single();
            if (error || !data) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            return NextResponse.json({ success: true, order: data });

        } else if (orderNumber.startsWith('COND_')) {
            const { data, error } = await supabase
                .from('condolence_orders')
                .select('*')
                .eq('moid', orderNumber)
                .single();
            if (error || !data) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            return NextResponse.json({ success: true, order: data });

        } else {
            const { data, error } = await supabase
                .from('condolence_orders')
                .select('*')
                .eq('id', orderNumber)
                .single();
            if (error || !data) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            return NextResponse.json({ success: true, order: data });
        }
    } catch (err) {
        console.error('부의금 주문 조회 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
