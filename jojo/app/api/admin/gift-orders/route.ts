import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/gift/auth';
import { cancelGiftOrder, dispatchDueGiftOrders, dispatchGiftOrder } from '@/lib/gift/dispatcher';

export const dynamic = 'force-dynamic';

// GET: 답례품 주문 및 수신자별 발송 내역 전체 조회 (10분 경과된 대기 주문 자동 발송 포함)
export async function GET(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dispatchDueGiftOrders().catch((e) => console.error('[admin/gift-orders auto-dispatch]', e));

        const sb = getSupabase();
        const { data: orders, error } = await sb
            .from('gift_orders')
            .select('*, recipients:gift_order_recipients(*)')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) {
            console.error('[admin/gift-orders GET]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ orders: orders ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || '서버 오류' }, { status: 500 });
    }
}

// POST: 즉시 발송 / 실패건 재발송 / 주문 취소(10분 이내 발송 취소 또는 쿠폰 폐기)
export async function POST(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const action = String(body.action || '');
        const orderId = String(body.orderId || '');

        if (action === 'dispatch-due') {
            const res = await dispatchDueGiftOrders();
            return NextResponse.json({ ok: true, ...res });
        }

        if (!orderId) {
            return NextResponse.json({ error: '주문 ID가 필요합니다.' }, { status: 400 });
        }

        if (action === 'dispatch') {
            const res = await dispatchGiftOrder(orderId, { retryFailed: true });
            if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
            return NextResponse.json(res);
        }

        if (action === 'cancel') {
            const reason = String(body.reason || '관리자 취소').trim();
            const res = await cancelGiftOrder(orderId, reason);
            if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
            return NextResponse.json(res);
        }

        return NextResponse.json({ error: '지원하지 않는 action입니다.' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || '서버 오류' }, { status: 500 });
    }
}

// DELETE: 테스트 주문 등 주문 내역 삭제
export async function DELETE(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return NextResponse.json({ error: '주문 ID가 필요합니다.' }, { status: 400 });

        const sb = getSupabase();
        const { error } = await sb.from('gift_orders').delete().eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || '서버 오류' }, { status: 500 });
    }
}
