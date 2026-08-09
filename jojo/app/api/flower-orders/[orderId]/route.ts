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
        // MG 또는 BF(B2B)로 시작하면 order_number로 검색, 아니면 id로 검색
        let query = supabase.from('flower_orders').select('*');

        if (orderId.startsWith('MG') || orderId.startsWith('BF')) {
            query = query.eq('order_number', orderId);
        } else {
            query = query.eq('id', orderId);
        }

        const { data, error } = await query.single();

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
