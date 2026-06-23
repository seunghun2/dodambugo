import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderNumber: string }> }
) {
    try {
        const { orderNumber } = await params;

        if (!orderNumber) {
            return NextResponse.json(
                { success: false, error: '주문번호가 필요합니다.' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('condolence_orders')
            .select('*')
            .eq('order_number', orderNumber)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { success: false, error: '주문을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            order: data,
        });
    } catch (error: any) {
        console.error('부의금 주문 조회 오류:', error);
        return NextResponse.json(
            { success: false, error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
