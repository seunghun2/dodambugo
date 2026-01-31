import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 주문번호로 주문 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const { orderId } = await params;

    if (!orderId) {
        return NextResponse.json({ error: '주문번호가 필요합니다.' }, { status: 400 });
    }

    try {
        // 주문번호(order_number) 또는 ID로 검색
        const { data, error } = await supabase
            .from('flower_orders')
            .select('*')
            .or(`order_number.eq.${orderId},id.eq.${orderId}`)
            .single();

        if (error || !data) {
            console.error('주문 조회 실패:', error);
            return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error('주문 조회 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
