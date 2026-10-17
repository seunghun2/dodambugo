import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/gift/auth';
import { GIFT_GRACE_MINUTES, dispatchDueGiftOrders } from '@/lib/gift/dispatcher';
import { isResponse, requireMourner } from '@/lib/gift/guard';
import { GiftNotReadyError, getIssuer, isLiveMode } from '@/lib/gift/issuer';
import { dedupeRecipients, normalizePhone, type GiftRecipient } from '@/lib/gift/phone';
import { resolveRefPhone } from '@/lib/gift/recipient-source';

export const dynamic = 'force-dynamic';

const MAX_RECIPIENTS = 200;
const MAX_MESSAGE = 500;
const CARD_IDS = ['general', 'christian', 'catholic', 'buddhist', 'none'];

interface InRecipient {
    name?: string;
    phone?: string;
    source?: string;
    ref?: string; // 조의금/화환 목록에서 고른 경우: 번호 대신 ref 만 받는다
}

function newOrderNumber(): string {
    const d = new Date(Date.now() + 9 * 3600 * 1000);
    const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
    return `GF${ymd}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// POST: 답례품 주문 생성 (결제 완료 후 10분 유예 뒤 발송되는 대기 상태로 저장)
//  - 상품 가격, 받는 사람 전화번호(조의금/화환 목록)는 반드시 서버가 DB에서 다시 조회한다.
//  - 결제 즉시 발송하지 않고 status = 'paid'(또는 'test_paid'), 수신자 send_status = 'pending'으로 저장하여
//    10분 이내 취소 가능 유예 시간을 보장하고, 200명 대량 주문 시에도 응답 지연을 없앤다.
export async function POST(req: NextRequest) {
    try {
        // 기존 주문 중 10분 경과된 대기 건이 있으면 비동기로 발송 트리거
        dispatchDueGiftOrders().catch((err) => console.error('[gift/orders due dispatch]', err));

        const body = await req.json();
        const guarded = await requireMourner(req, body.bugoId ?? null);
        if (isResponse(guarded)) return guarded;
        const { bugo, session } = guarded;

        // 발행기 확인 (live 인데 준비 전이면 여기서 거부)
        try {
            getIssuer();
        } catch (e) {
            if (e instanceof GiftNotReadyError) {
                return NextResponse.json({ error: e.message, code: 'NOT_READY' }, { status: 503 });
            }
            throw e;
        }

        const supabase = getSupabase();

        // 1) 상품 (가격은 DB 기준)
        const { data: product } = await supabase
            .from('gift_products')
            .select('id, brand, name, sale_price, daou_goods_code')
            .eq('id', String(body.productId || ''))
            .eq('is_active', true)
            .single();
        if (!product) return NextResponse.json({ error: '선택하신 상품을 찾을 수 없습니다.' }, { status: 400 });

        // 2) 메시지 / 카드
        const message = String(body.message ?? '').slice(0, MAX_MESSAGE);
        const cardId = CARD_IDS.includes(body.cardId) ? body.cardId : 'general';

        // 3) 받는 사람 (ref 는 서버에서 번호 조회)
        const incoming: InRecipient[] = Array.isArray(body.recipients) ? body.recipients : [];
        if (incoming.length === 0) return NextResponse.json({ error: '받는 사람을 선택해주세요.' }, { status: 400 });
        if (incoming.length > MAX_RECIPIENTS) {
            return NextResponse.json({ error: `한 번에 최대 ${MAX_RECIPIENTS}명까지 보낼 수 있습니다.` }, { status: 400 });
        }

        const resolved: GiftRecipient[] = [];
        for (const r of incoming) {
            if (r.ref) {
                const hit = await resolveRefPhone(String(r.ref), bugo, session);
                if (!hit) {
                    return NextResponse.json({ error: '받는 사람 정보를 확인할 수 없습니다. 목록을 새로고침해주세요.' }, { status: 400 });
                }
                resolved.push({ name: hit.name, phone: hit.phone, source: hit.source });
            } else {
                const source = (['contact', 'excel', 'manual'] as const).find((s) => s === r.source) ?? 'manual';
                resolved.push({ name: String(r.name ?? ''), phone: normalizePhone(r.phone), source });
            }
        }
        const { valid, invalid } = dedupeRecipients(resolved);
        if (invalid.length > 0) {
            return NextResponse.json(
                { error: `휴대폰 번호가 올바르지 않은 받는 사람이 ${invalid.length}명 있습니다.`, code: 'INVALID_PHONE', invalid: invalid.map((i) => i.name || '이름 없음') },
                { status: 400 }
            );
        }
        if (valid.length === 0) return NextResponse.json({ error: '받는 사람을 선택해주세요.' }, { status: 400 });

        const total = product.sale_price * valid.length;
        const live = isLiveMode();
        if (live && !product.daou_goods_code) {
            return NextResponse.json(
                { error: '선택하신 상품의 발송 코드(NO_REQ)가 아직 연결되지 않았습니다.', code: 'NOT_READY' },
                { status: 503 }
            );
        }

        // 4) 주문 저장 (10분 유예 발송 대기 상태: paid / test_paid)
        let order: { id: string; order_number: string } | null = null;
        for (let i = 0; i < 2 && !order; i++) {
            const { data, error } = await supabase
                .from('gift_orders')
                .insert({
                    order_number: newOrderNumber(),
                    bugo_id: bugo.id,
                    bugo_number: bugo.bugo_number,
                    buyer_name: session.n,
                    product_id: product.id,
                    product_name: `[${product.brand}] ${product.name}`,
                    unit_price: product.sale_price,
                    quantity: valid.length,
                    total_amount: total,
                    card_id: cardId,
                    message,
                    status: live ? 'paid' : 'test_paid',
                    is_test: !live,
                })
                .select('id, order_number')
                .single();
            if (!error) order = data;
            else if (error.code !== '23505') throw error;
        }
        if (!order) return NextResponse.json({ error: '주문 번호 생성에 실패했습니다. 다시 시도해주세요.' }, { status: 500 });

        const { error: recErr } = await supabase
            .from('gift_order_recipients')
            .insert(
                valid.map((r) => ({
                    order_id: order!.id,
                    name: r.name || null,
                    phone: r.phone,
                    source: r.source,
                    send_status: 'pending',
                }))
            );
        if (recErr) {
            await supabase.from('gift_orders').update({ status: 'failed' }).eq('id', order.id);
            throw recErr;
        }

        return NextResponse.json({
            success: true,
            orderNumber: order.order_number,
            total,
            count: valid.length,
            graceMinutes: GIFT_GRACE_MINUTES,
            isTest: !live,
        });
    } catch (e) {
        console.error('[gift/orders]', e);
        return NextResponse.json({ error: '주문 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
