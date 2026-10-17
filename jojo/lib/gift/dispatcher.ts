// 답례품 주문 발송 스케줄러 & 병렬 발송기 (결제 10분 후 발송 + 감사장·쿠폰 2종 동시 발송 + 취소 처리)

import { getSupabase } from './auth';
import { getIssuer } from './issuer';
import { sendLMS } from '@/lib/solapi';

export const GIFT_GRACE_MINUTES = 10;
export const GIFT_GRACE_MS = GIFT_GRACE_MINUTES * 60 * 1000;
const BATCH_CONCURRENCY = 10;

/** 배열을 N개씩 병렬 배치로 나눠 실행 (200명 발송 시에도 타임아웃 없이 수 초 내 완료) */
async function runInParallelBatches<T, R>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += concurrency) {
        const chunk = items.slice(i, i + concurrency);
        const settled = await Promise.all(chunk.map((item, offset) => worker(item, i + offset)));
        results.push(...settled);
    }
    return results;
}

/**
 * 단일 주문의 미발송(pending/failed) 수신자들에게 병렬로:
 * 1) 감사장 LMS (전문 500자 문구 + 감사장 카드 링크)
 * 2) 다우 모바일 쿠폰 (바코드 MMS)
 * 총 2건을 발송한다.
 */
export async function dispatchGiftOrder(
    orderId: string,
    options?: { retryFailed?: boolean }
): Promise<{
    ok: boolean;
    error?: string;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    status: string;
}> {
    const sb = getSupabase();

    const { data: order, error: orderErr } = await sb
        .from('gift_orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderErr || !order) {
        return { ok: false, error: '주문을 찾을 수 없습니다.', totalRecipients: 0, sentCount: 0, failedCount: 0, status: 'failed' };
    }

    if (order.status === 'cancelled') {
        return { ok: false, error: '이미 취소된 주문입니다.', totalRecipients: order.quantity, sentCount: 0, failedCount: 0, status: 'cancelled' };
    }

    // 상품의 다우 상품코드 조회
    let daouGoodsCode: string | null = null;
    if (order.product_id) {
        const { data: prod } = await sb
            .from('gift_products')
            .select('daou_goods_code')
            .eq('id', order.product_id)
            .maybeSingle();
        daouGoodsCode = prod?.daou_goods_code || null;
    }

    const { data: allRecipients, error: recErr } = await sb
        .from('gift_order_recipients')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });

    if (recErr || !allRecipients) {
        return { ok: false, error: '수신자 목록 조회 실패', totalRecipients: 0, sentCount: 0, failedCount: 0, status: 'failed' };
    }

    const targetStatuses = options?.retryFailed ? ['pending', 'failed'] : ['pending'];
    const targets = allRecipients.filter((r) => targetStatuses.includes(r.send_status));

    if (targets.length === 0) {
        const alreadySent = allRecipients.filter((r) => r.send_status === 'sent').length;
        return {
            ok: true,
            totalRecipients: allRecipients.length,
            sentCount: alreadySent,
            failedCount: allRecipients.length - alreadySent,
            status: order.status,
        };
    }

    // 발송 중 상태로 전환
    await sb.from('gift_orders').update({ status: 'sending', updated_at: new Date().toISOString() }).eq('id', order.id);

    const issuer = getIssuer();
    const isTestOrder = Boolean(order.is_test);
    const thanksUrl = `https://maeumbugo.co.kr/view/${order.bugo_number}/thanks`;
    const fullThanksText = `${order.message || ''}\n\n▼ 감사장 보기\n${thanksUrl}`.trim();

    await runInParallelBatches(targets, BATCH_CONCURRENCY, async (r, idx) => {
        // 1) 실발송 모드일 때 감사장 LMS 발송 (1번째 메시지)
        if (!isTestOrder) {
            try {
                await sendLMS(r.phone, '[마음부고] 삼가 감사 인사 드립니다', fullThanksText);
            } catch (lmsErr) {
                console.error('[gift/dispatcher] 감사장 문자 발송 오류:', lmsErr);
            }
        }

        // 2) 모바일 쿠폰 발행 (2번째 메시지)
        const res = await issuer.issue({
            orderNumber: order.order_number,
            seq: idx + 1,
            senderName: order.buyer_name || '상주',
            recipientName: r.name || '',
            recipientPhone: r.phone,
            goodsName: order.product_name,
            daouGoodsCode,
            message: order.message || '',
        });

        await sb
            .from('gift_order_recipients')
            .update(
                res.ok
                    ? {
                          send_status: 'sent',
                          coupon_ref: res.couponRef ?? null,
                          error: null,
                          sent_at: new Date().toISOString(),
                      }
                    : {
                          send_status: 'failed',
                          error: (res.error || '발송 실패').slice(0, 200),
                      }
            )
            .eq('id', r.id);
    });

    // 최종 집계
    const { data: refreshed } = await sb
        .from('gift_order_recipients')
        .select('send_status')
        .eq('order_id', order.id);

    const list = refreshed || [];
    const sentCount = list.filter((r) => r.send_status === 'sent').length;
    const failedCount = list.length - sentCount;
    const finalStatus = sentCount === list.length ? 'sent' : sentCount === 0 ? 'failed' : 'partial';

    await sb
        .from('gift_orders')
        .update({ status: finalStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id);

    return {
        ok: true,
        totalRecipients: list.length,
        sentCount,
        failedCount,
        status: finalStatus,
    };
}

/**
 * 결제 후 10분(GIFT_GRACE_MINUTES)이 경과한 대기 중(paid / test_paid) 주문들을 찾아 일괄 병렬 발송한다.
 */
export async function dispatchDueGiftOrders(): Promise<{ processedOrders: number }> {
    const sb = getSupabase();
    const cutoffIso = new Date(Date.now() - GIFT_GRACE_MS).toISOString();

    const { data: dueOrders } = await sb
        .from('gift_orders')
        .select('id')
        .in('status', ['paid', 'test_paid'])
        .lte('created_at', cutoffIso)
        .order('created_at', { ascending: true })
        .limit(20);

    if (!dueOrders || dueOrders.length === 0) {
        return { processedOrders: 0 };
    }

    for (const o of dueOrders) {
        await dispatchGiftOrder(o.id);
    }

    return { processedOrders: dueOrders.length };
}

/**
 * 주문 취소 처리:
 * - 발송 전(10분 유예 중): 즉시 cancelled 전환
 * - 이미 쿠폰 발행된 건이 있는 경우: 병렬로 쿠폰 폐기(CI104) 호출 후 cancelled 전환
 */
export async function cancelGiftOrder(orderId: string, reason = '관리자/구매자 취소'): Promise<{
    ok: boolean;
    error?: string;
    cancelledCoupons: number;
}> {
    const sb = getSupabase();
    const { data: order } = await sb.from('gift_orders').select('*').eq('id', orderId).single();
    if (!order) return { ok: false, error: '주문을 찾을 수 없습니다.', cancelledCoupons: 0 };
    if (order.status === 'cancelled') return { ok: false, error: '이미 취소된 주문입니다.', cancelledCoupons: 0 };

    const { data: recipients } = await sb
        .from('gift_order_recipients')
        .select('*')
        .eq('order_id', orderId);

    const list = recipients || [];
    const sentOnes = list.filter((r) => r.send_status === 'sent' && r.coupon_ref);
    let cancelledCoupons = 0;

    if (sentOnes.length > 0) {
        const issuer = getIssuer();
        await runInParallelBatches(sentOnes, BATCH_CONCURRENCY, async (r) => {
            const res = await issuer.cancel(r.coupon_ref, order.order_number);
            if (res.ok) {
                cancelledCoupons++;
                await sb
                    .from('gift_order_recipients')
                    .update({ send_status: 'failed', error: `쿠폰 폐기 완료 (${reason})` })
                    .eq('id', r.id);
            }
        });
    }

    // 아직 발송 전이던 pending 수신자들도 취소 표시
    await sb
        .from('gift_order_recipients')
        .update({ send_status: 'failed', error: `발송 전 주문 취소 (${reason})` })
        .eq('order_id', orderId)
        .eq('send_status', 'pending');

    await sb
        .from('gift_orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId);

    return { ok: true, cancelledCoupons };
}
