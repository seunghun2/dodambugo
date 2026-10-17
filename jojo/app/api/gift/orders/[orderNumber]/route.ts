import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/gift/auth';
import { dispatchDueGiftOrders, getGraceCancelWindow } from '@/lib/gift/dispatcher';
import { maskPhone } from '@/lib/gift/phone';

export const dynamic = 'force-dynamic';

// GET /api/gift/orders/[orderNumber]
// 주문내역 페이지(/order/[orderId])에서 답례품 주문 상세 및 10분 유예 취소 가능 여부 조회
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orderNumber: string }> }
) {
    try {
        const { orderNumber } = await params;
        if (!orderNumber) {
            return NextResponse.json({ error: '주문번호가 필요합니다.' }, { status: 400 });
        }

        // 10분 경과된 주문이 있으면 발송 상태 갱신
        await dispatchDueGiftOrders().catch((e) => console.error('[gift/order detail due dispatch]', e));

        const sb = getSupabase();
        const isUuid = orderNumber.includes('-') && orderNumber.length > 20;
        const query = sb.from('gift_orders').select('*');
        const { data: order, error } = await (isUuid
            ? query.eq('id', orderNumber).maybeSingle()
            : query.eq('order_number', orderNumber).maybeSingle());

        if (error || !order) {
            return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
        }

        const { data: recipients } = await sb
            .from('gift_order_recipients')
            .select('id, name, phone, source, send_status, sent_at')
            .eq('order_id', order.id)
            .order('created_at', { ascending: true });

        const grace = getGraceCancelWindow(order);

        return NextResponse.json(
            {
                success: true,
                order: {
                    id: order.id,
                    order_number: order.order_number,
                    bugo_id: order.bugo_id,
                    bugo_number: order.bugo_number,
                    buyer_name: order.buyer_name || '상주',
                    buyer_phone_masked: order.buyer_phone ? maskPhone(order.buyer_phone) : null,
                    product_id: order.product_id,
                    product_name: order.product_name,
                    unit_price: order.unit_price,
                    quantity: order.quantity,
                    total_amount: order.total_amount,
                    card_id: order.card_id,
                    message: order.message,
                    payment_method: order.payment_method || (order.is_test ? '테스트결제' : '신용카드'),
                    status: order.status,
                    is_test: Boolean(order.is_test),
                    tid: order.tid || null,
                    receipt_url: order.receipt_url || null,
                    created_at: order.created_at,
                    approved_at: order.approved_at || order.created_at,
                    sent_at: order.sent_at || null,
                    cancelled_at: order.cancelled_at || null,
                    cancel_reason: order.cancel_reason || null,
                    can_cancel: grace.canCancel,
                    remaining_cancel_seconds: grace.remainingSeconds,
                    cancel_deadline_at: grace.deadlineIso,
                    recipients: (recipients || []).map((r) => ({
                        id: r.id,
                        name: r.name || '이름없음',
                        masked_phone: maskPhone(r.phone),
                        source: r.source,
                        send_status: r.send_status,
                        sent_at: r.sent_at,
                    })),
                },
            },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (e: any) {
        console.error('[gift/orders/[orderNumber] GET]', e);
        return NextResponse.json({ error: '주문 정보를 불러올 수 없습니다.' }, { status: 500 });
    }
}
