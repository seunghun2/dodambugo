import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/gift/auth';
import { cancelGiftOrder, dispatchDueGiftOrders, dispatchGiftOrder } from '@/lib/gift/dispatcher';

export const dynamic = 'force-dynamic';

// GET: B2B 부고에서 발생한 답례품 주문 및 수신자별 발송 내역 조회 (파트너 정보 매핑 포함)
export async function GET(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dispatchDueGiftOrders().catch((e) => console.error('[b2b/admin/gift-orders auto-dispatch]', e));

        const sb = getSupabase();
        const [
            { data: rawOrders, error: ordersError },
            { data: b2bBugos, error: bugoError },
            { data: b2bCompanies, error: compError },
        ] = await Promise.all([
            sb
                .from('gift_orders')
                .select('*, recipients:gift_order_recipients(*)')
                .order('created_at', { ascending: false })
                .limit(300),
            sb
                .from('bugo')
                .select('id, bugo_number, deceased_name, b2b_user_id, b2b_users ( company_name, owner_name, company_id )')
                .not('b2b_user_id', 'is', null),
            sb.from('b2b_companies').select('id, name'),
        ]);

        if (ordersError) {
            console.error('[b2b/admin/gift-orders GET]', ordersError);
            return NextResponse.json({ error: ordersError.message }, { status: 500 });
        }
        if (bugoError) console.error('[b2b/admin/gift-orders bugo]', bugoError);
        if (compError) console.error('[b2b/admin/gift-orders companies]', compError);

        const companyMap = new Map<string, string>();
        (b2bCompanies || []).forEach((c: any) => companyMap.set(c.id, c.name));

        const bugoById = new Map<string, any>();
        const bugoByNum = new Map<string, any>();
        (b2bBugos || []).forEach((b: any) => {
            if (b.id) bugoById.set(String(b.id), b);
            if (b.bugo_number) bugoByNum.set(String(b.bugo_number), b);
        });

        // B2B 부고에 연결된 답례품 주문만 필터링
        const b2bOrders = (rawOrders || [])
            .map((o: any) => {
                const matchedBugo =
                    (o.bugo_id && bugoById.get(String(o.bugo_id))) ||
                    (o.bugo_number && bugoByNum.get(String(o.bugo_number)));
                if (!matchedBugo) return null;

                const b2bUser = Array.isArray(matchedBugo.b2b_users)
                    ? matchedBugo.b2b_users[0]
                    : matchedBugo.b2b_users;
                const companyName =
                    (b2bUser?.company_id && companyMap.get(b2bUser.company_id)) ||
                    b2bUser?.company_name ||
                    '개인';
                const ownerName = b2bUser?.owner_name || '-';

                return {
                    ...o,
                    deceased_name: matchedBugo.deceased_name || '-',
                    company_name: companyName,
                    owner_name: ownerName,
                };
            })
            .filter(Boolean);

        return NextResponse.json({ orders: b2bOrders }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || '서버 오류' }, { status: 500 });
    }
}

// POST: 즉시 발송 / 실패건 재발송 / 주문 취소(1시간 이내 발송 전 취소)
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
