import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/gift/auth';
import { cancelGiftOrder } from '@/lib/gift/dispatcher';

export const dynamic = 'force-dynamic';

// POST /api/gift/orders/[orderNumber]/cancel
// 구매자(상주)가 결제 완료 후 10분 이내에 주문내역 페이지(/order/[orderId])에서 직접 주문 취소
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ orderNumber: string }> }
) {
    try {
        const { orderNumber } = await params;
        if (!orderNumber) {
            return NextResponse.json({ error: '주문번호가 필요합니다.' }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const reason = String(body?.reason || '주문자 직접 취소 (1시간 이내)').trim();

        const sb = getSupabase();
        const isUuid = orderNumber.includes('-') && orderNumber.length > 20;
        const query = sb.from('gift_orders').select('id, order_number');
        const { data: order } = await (isUuid
            ? query.eq('id', orderNumber).maybeSingle()
            : query.eq('order_number', orderNumber).maybeSingle());

        if (!order) {
            return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
        }

        const res = await cancelGiftOrder(order.id, reason, { enforceGraceWindow: true });
        if (!res.ok) {
            return NextResponse.json({ error: res.error || '주문을 취소할 수 없습니다.' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            orderNumber: order.order_number,
            message: '답례품 주문이 취소되었습니다.',
        });
    } catch (e: any) {
        console.error('[gift/orders/[orderNumber]/cancel POST]', e);
        return NextResponse.json({ error: '주문 취소 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
