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
            // B2B DO 주문번호 → B2B 순번으로 조회
            const doNum = parseInt(orderNumber.replace('DO', ''), 10);
            if (isNaN(doNum) || doNum < 1) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }

            // source 컬럼으로 조회 시도, PostgREST 캐시 문제 시 moid 기반 fallback
            let b2bOrders: any[] = [];
            try {
                const { data } = await supabase
                    .from('condolence_orders')
                    .select('*')
                    .eq('source', 'b2b')
                    .order('id', { ascending: true });
                b2bOrders = data || [];
            } catch {
                // source 컬럼 캐시 미반영 시 moid BCOND_ 기반으로 fallback
                const { data } = await supabase
                    .from('condolence_orders')
                    .select('*')
                    .like('moid', 'BCOND_%')
                    .order('id', { ascending: true });
                b2bOrders = data || [];
            }

            // source 쿼리가 빈 결과면 moid fallback도 시도
            if (b2bOrders.length === 0) {
                const { data } = await supabase
                    .from('condolence_orders')
                    .select('*')
                    .like('moid', 'BCOND_%')
                    .order('id', { ascending: true });
                b2bOrders = data || [];
            }

            const targetOrder = b2bOrders[doNum - 1];
            if (!targetOrder) {
                return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
            }
            targetOrder.order_number = 'DO' + String(doNum).padStart(6, '0');
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

        } else if (orderNumber.startsWith('COND_') || orderNumber.startsWith('BCOND_')) {
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
