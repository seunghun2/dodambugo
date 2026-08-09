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
        // CO로 시작하면 order_number로 검색, 아니면 id로 검색
        let query = supabase.from('condolence_orders').select('*');

        if (orderNumber.startsWith('CO') || orderNumber.startsWith('DO')) {
            const rawCoNumber = orderNumber.replace(/^DO/, 'CO');
            query = query.or(`order_number.eq.${orderNumber},order_number.eq.${rawCoNumber},id.eq.30`);
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

        // B2B 부의금 주문번호 표시 변환 (CO -> DO, 첫 결제건 DO000001 고정)
        if (data.source === 'b2b' || data.moid?.startsWith('BCOND_') || orderNumber.startsWith('DO')) {
            if (data.id === 30 || orderNumber === 'DO000001') {
                data.order_number = 'DO000001';
            } else {
                data.order_number = data.order_number ? data.order_number.replace(/^CO/, 'DO') : 'DO' + String(data.id).padStart(6, '0');
            }
        }

        return NextResponse.json({ success: true, order: data });
    } catch (err) {
        console.error('부의금 주문 조회 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

