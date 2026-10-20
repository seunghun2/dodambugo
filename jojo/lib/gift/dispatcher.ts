// 답례품 주문 발송 스케줄러 & 병렬 발송기
// - 결제 완료 10분 유예 후 자동 발송 + sending 멈춤(3분 초과) 자동 재시도
// - 감사장 LMS + 다우 모바일 쿠폰 2종 병렬 발송 (LMS 중복 발송 방지 포함)
// - 10분 이내 구매자 직접 취소 + 이노페이 결제 취소 + 다우 쿠폰 폐기 연동

import { getSupabase } from './auth';
import { getIssuer } from './issuer';
import { sendAlimtalk, sendLMS } from '@/lib/solapi';

export const GIFT_GRACE_MINUTES = 60;
export const GIFT_GRACE_MS = GIFT_GRACE_MINUTES * 60 * 1000;
export const STUCK_SENDING_MS = 3 * 60 * 1000; // sending 상태에서 3분 이상 멈춘 경우 자동 재시도
const BATCH_CONCURRENCY = 10;
const INNOPAY_CANCEL_API_URL = 'https://api.innopay.co.kr/api/cancelApi';

const getInnopaySvcCd = (paymentMethod?: string | null) => {
    const pm = String(paymentMethod || '');
    if (pm.includes('간편결제') || pm === 'easy' || pm === 'EPAY') return '16';
    if (pm.includes('신용카드') || pm === 'card' || pm === 'CARD') return '01';
    if (pm.includes('계좌이체') || pm === 'bank' || pm === 'BANK') return '02';
    if (pm.includes('가상계좌') || pm === 'virtual' || pm === 'VBANK') return '03';
    return '01';
};

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

/** 주문 기준 시각(결제 승인 시각 우선, 없으면 생성 시각) 반환 */
export function getOrderBaseTimeMs(order: { approved_at?: string | null; created_at?: string | null }): number {
    const raw = order.approved_at || order.created_at;
    const ms = raw ? new Date(raw).getTime() : NaN;
    return Number.isFinite(ms) ? ms : Date.now();
}

/** 현재 시점에 10분 유예 취소 가능 여부 및 남은 초(seconds) 계산 */
export function getGraceCancelWindow(order: {
    status?: string | null;
    approved_at?: string | null;
    created_at?: string | null;
}): { canCancel: boolean; remainingSeconds: number; deadlineIso: string } {
    const baseMs = getOrderBaseTimeMs(order);
    const deadlineMs = baseMs + GIFT_GRACE_MS;
    const remainingSeconds = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
    const isWaitingStatus = order.status === 'paid' || order.status === 'test_paid';
    return {
        canCancel: isWaitingStatus && remainingSeconds > 0,
        remainingSeconds,
        deadlineIso: new Date(deadlineMs).toISOString(),
    };
}

/**
 * 답례품 결제 완료 시 상주에게 주문내역(취소 버튼 포함) 링크 안내 발송
 * - GIFT_PAYMENT_TEMPLATE_ID 환경변수가 있으면 카카오 알림톡 우선 발송
 * - 없거나 실패 시 LMS 장문 문자로 즉시 발송
 */
export async function sendGiftOrderCompleteNotify(order: {
    order_number: string;
    bugo_number: string;
    buyer_name?: string | null;
    buyer_phone?: string | null;
    product_name: string;
    quantity: number;
    total_amount: number;
    is_test?: boolean | null;
}) {
    if (order.is_test) return;
    const cleanPhone = String(order.buyer_phone || '').replace(/\D/g, '');
    if (!cleanPhone.startsWith('010')) return;

    const orderUrl = `https://maeumbugo.co.kr/order/${order.order_number}`;
    const templateId = process.env.GIFT_PAYMENT_TEMPLATE_ID;

    if (templateId) {
        try {
            const res = await sendAlimtalk(cleanPhone, templateId, {
                주문자명: order.buyer_name || '상주',
                상품명: order.product_name,
                수량: `${order.quantity}명`,
                결제금액: (order.total_amount || 0).toLocaleString(),
                주문번호: order.order_number,
                부고번호: order.bugo_number,
            });
            if (!res?.statusCode || res.statusCode === '2000') return;
        } catch (e) {
            console.error('[gift/notify] 결제완료 알림톡 실패, LMS 대체 발송:', e);
        }
    }

    const lmsText = [
        `[마음부고] 답례품 결제가 완료되었습니다.`,
        ``,
        `◼ 주문 정보`,
        `- 주문번호: ${order.order_number}`,
        `- 상품명: ${order.product_name}`,
        `- 수량: ${order.quantity}명`,
        `- 결제금액: ${(order.total_amount || 0).toLocaleString()}원`,
        ``,
        `※ 결제 완료 1시간 후 감사장과 모바일 쿠폰이 자동 발송됩니다.`,
        `※ 발송 전(결제 후 1시간 이내)에는 아래 주문내역에서 직접 취소하실 수 있습니다.`,
        ``,
        `▼ 주문내역 확인 및 취소하기`,
        orderUrl,
    ].join('\n');

    try {
        await sendLMS(cleanPhone, '[마음부고] 답례품 결제 완료 안내', lmsText);
    } catch (e) {
        console.error('[gift/notify] 결제완료 LMS 발송 오류:', e);
    }
}

/**
 * 단일 주문의 미발송(pending/failed) 수신자들에게 병렬로:
 * 1) 감사장 LMS (전문 500자 문구 + 감사장 카드 링크, lms_sent_at 기록으로 재시도 시 중복 발송 차단)
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

    // sending 상태에서 3분 이상 멈춘 주문인지 판별
    const isStuckSending =
        order.status === 'sending' &&
        (!order.updated_at || Date.now() - new Date(order.updated_at).getTime() >= STUCK_SENDING_MS);

    // 발송 중 상태로 전환 (원자적 선점: 크론/어드민 동시 실행 시 중복 발송 방지 + 멈춘 sending 복구 허용)
    const claimableStatuses = isStuckSending
        ? ['sending', 'paid', 'test_paid', 'partial', 'failed']
        : ['paid', 'test_paid', 'partial', 'failed'];

    const { data: claimed } = await sb
        .from('gift_orders')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', order.id)
        .in('status', claimableStatuses)
        .select('id');

    if (!claimed || claimed.length === 0) {
        return {
            ok: false,
            error: '이미 발송 중이거나 처리된 주문입니다.',
            totalRecipients: order.quantity || 0,
            sentCount: 0,
            failedCount: 0,
            status: order.status,
        };
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
        await sb.from('gift_orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', order.id);
        return { ok: false, error: '수신자 목록 조회 실패', totalRecipients: 0, sentCount: 0, failedCount: 0, status: 'failed' };
    }

    // 멈춘 sending 복구 시에도 failed/pending 재시도
    const targetStatuses = options?.retryFailed || isStuckSending ? ['pending', 'failed'] : ['pending'];
    const targets = allRecipients.filter((r) => targetStatuses.includes(r.send_status));

    if (targets.length === 0) {
        const alreadySent = allRecipients.filter((r) => r.send_status === 'sent').length;
        const finalSt = alreadySent === allRecipients.length ? 'sent' : alreadySent === 0 ? 'failed' : 'partial';
        await sb.from('gift_orders').update({ status: finalSt, updated_at: new Date().toISOString() }).eq('id', order.id);
        return {
            ok: true,
            totalRecipients: allRecipients.length,
            sentCount: alreadySent,
            failedCount: allRecipients.length - alreadySent,
            status: finalSt,
        };
    }

    const issuer = getIssuer();
    const isTestOrder = Boolean(order.is_test);
    const hasThanksCard = Boolean(order.card_id && order.card_id !== 'none');
    const useSeparateThanksLms = process.env.GIFT_SEPARATE_THANKS_LMS === 'true';
    const thanksUrl = `https://maeumbugo.co.kr/view/${order.bugo_number}/thanks/card`;
    const fullThanksText = hasThanksCard
        ? `${order.message || ''}\n\n▼ 감사장 보기\n${thanksUrl}`.trim()
        : String(order.message || '').trim();

    await runInParallelBatches(targets, BATCH_CONCURRENCY, async (r, idx) => {
        const cleanRecipientPhone = String(r.phone || '').replace(/\D/g, '');
        let lmsSentAt: string | null = r.lms_sent_at || null;

        // 1) 기본적으로 다우 쿠폰 MMS 본문에 감사장 단축링크(/t/[bugo_number])를 포함해 1통(다우 발신번호 1599-6567)으로 통합 발송.
        //    GIFT_SEPARATE_THANKS_LMS='true' 인 경우에만 솔라피 별도 LMS 발송.
        if (useSeparateThanksLms && !lmsSentAt && fullThanksText) {
            if (isTestOrder) {
                lmsSentAt = new Date().toISOString();
            } else {
                try {
                    const lmsRes = await sendLMS(cleanRecipientPhone, '[마음부고] 삼가 감사 인사 드립니다', fullThanksText);
                    if (!lmsRes?.statusCode || lmsRes.statusCode === '2000') {
                        lmsSentAt = new Date().toISOString();
                    } else {
                        console.error('[gift/dispatcher] 감사장 LMS 응답 오류:', lmsRes);
                    }
                } catch (lmsErr) {
                    console.error('[gift/dispatcher] 감사장 문자 발송 오류:', lmsErr);
                }
            }
        } else if (!lmsSentAt) {
            lmsSentAt = new Date().toISOString();
        }

        // 2) 모바일 쿠폰 발행 (인사말 + 감사장 단축링크 통합 MMS)
        const res = await issuer.issue({
            orderNumber: order.order_number,
            seq: idx + 1,
            bugoNumber: hasThanksCard ? String(order.bugo_number) : undefined,
            senderName: order.buyer_name || '상주',
            recipientName: r.name || '',
            recipientPhone: cleanRecipientPhone,
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
                          lms_sent_at: lmsSentAt,
                          sent_at: new Date().toISOString(),
                      }
                    : {
                          send_status: 'failed',
                          lms_sent_at: lmsSentAt,
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
    const nowIso = new Date().toISOString();

    await sb
        .from('gift_orders')
        .update({
            status: finalStatus,
            sent_at: finalStatus === 'sent' ? nowIso : order.sent_at || null,
            updated_at: nowIso,
        })
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
 * 1) 결제 후 10분(GIFT_GRACE_MINUTES)이 경과한 대기 중(paid / test_paid) 주문
 * 2) 발송 중(sending) 상태에서 3분(STUCK_SENDING_MS) 이상 멈춘 주문
 * 을 찾아 일괄 병렬 발송(및 자동 재시도)한다.
 */
export async function dispatchDueGiftOrders(): Promise<{ processedOrders: number; retriedStuckOrders: number }> {
    const sb = getSupabase();
    const graceCutoffIso = new Date(Date.now() - GIFT_GRACE_MS).toISOString();
    const stuckCutoffIso = new Date(Date.now() - STUCK_SENDING_MS).toISOString();

    // 1) 10분 경과된 paid / test_paid 주문 조회
    const { data: candidates } = await sb
        .from('gift_orders')
        .select('id, created_at, approved_at')
        .in('status', ['paid', 'test_paid'])
        .lte('created_at', graceCutoffIso)
        .order('created_at', { ascending: true })
        .limit(20);

    const dueOrders = (candidates || []).filter(
        (o) => Date.now() - getOrderBaseTimeMs(o) >= GIFT_GRACE_MS
    );

    // 2) sending 상태에서 3분 이상 멈춘 주문 자동 복구 대상 조회
    const { data: stuckOrders } = await sb
        .from('gift_orders')
        .select('id')
        .eq('status', 'sending')
        .lte('updated_at', stuckCutoffIso)
        .order('updated_at', { ascending: true })
        .limit(10);

    let processedOrders = 0;
    for (const o of dueOrders) {
        await dispatchGiftOrder(o.id);
        processedOrders++;
    }

    let retriedStuckOrders = 0;
    for (const s of stuckOrders || []) {
        await dispatchGiftOrder(s.id, { retryFailed: true });
        retriedStuckOrders++;
    }

    return { processedOrders, retriedStuckOrders };
}

/**
 * 주문 취소 처리:
 * - options.enforceGraceWindow = true (구매자 직접 취소): 결제 후 10분 이내 & 발송 전(paid/test_paid)일 때만 허용
 * - 이노페이 실결제 건(tid 존재): 이노페이 취소 API(cancelApi) 호출하여 카드/간편결제 승인 취소
 * - 이미 쿠폰 발행된 건(어드민 취소): 병렬로 다우 쿠폰 폐기(CI104) 호출 후 실패 건이 있으면 에러 반환
 */
export async function cancelGiftOrder(
    orderId: string,
    reason = '주문자 취소',
    options?: { enforceGraceWindow?: boolean }
): Promise<{
    ok: boolean;
    error?: string;
    cancelledCoupons: number;
}> {
    const sb = getSupabase();
    const { data: order } = await sb.from('gift_orders').select('*').eq('id', orderId).single();
    if (!order) return { ok: false, error: '주문을 찾을 수 없습니다.', cancelledCoupons: 0 };
    if (order.status === 'cancelled') return { ok: false, error: '이미 취소된 주문입니다.', cancelledCoupons: 0 };

    if (options?.enforceGraceWindow) {
        const { canCancel } = getGraceCancelWindow(order);
        if (!canCancel) {
            return {
                ok: false,
                error: '결제 후 1시간이 경과하여 주문이 확정·발송되었으므로 취소할 수 없습니다.',
                cancelledCoupons: 0,
            };
        }
    }

    const { data: recipients } = await sb
        .from('gift_order_recipients')
        .select('*')
        .eq('order_id', orderId);

    const list = recipients || [];
    const sentOnes = list.filter((r) => r.send_status === 'sent' && r.coupon_ref);

    if (options?.enforceGraceWindow && sentOnes.length > 0) {
        return {
            ok: false,
            error: '이미 모바일 쿠폰이 발송되어 온라인 취소가 불가합니다.',
            cancelledCoupons: 0,
        };
    }

    // 1) 이미 발송된 쿠폰이 있는 경우(어드민 취소) 다우 쿠폰 폐기 먼저 수행
    let cancelledCoupons = 0;
    let failedCouponCancel = 0;
    if (sentOnes.length > 0) {
        const issuer = getIssuer();
        await runInParallelBatches(sentOnes, BATCH_CONCURRENCY, async (r) => {
            const res = await issuer.cancel(r.coupon_ref, order.order_number);
            if (res.ok) {
                cancelledCoupons++;
                await sb
                    .from('gift_order_recipients')
                    .update({ send_status: 'cancelled', error: `쿠폰 폐기 완료 (${reason})` })
                    .eq('id', r.id);
            } else {
                failedCouponCancel++;
                await sb
                    .from('gift_order_recipients')
                    .update({ error: `쿠폰 폐기 실패: ${res.error || '사용됨/취소불가'}` })
                    .eq('id', r.id);
            }
        });

        if (failedCouponCancel > 0) {
            return {
                ok: false,
                error: `수신자 중 ${failedCouponCancel}건의 쿠폰 폐기에 실패하여 주문을 전체 취소할 수 없습니다. (이미 교환된 쿠폰 여부 확인 필요)`,
                cancelledCoupons,
            };
        }
    }

    // 2) 이노페이 실결제 TID가 있는 경우 이노페이 결제 취소 API 호출
    if (order.tid && !order.is_test) {
        try {
            const cancelData = {
                mid: process.env.INNOPAY_MID || 'pgmaeum01m',
                tid: order.tid,
                svcCd: getInnopaySvcCd(order.payment_method),
                partialCancelCode: '0',
                cancelAmt: String(order.total_amount),
                cancelMsg: reason || '고객 요청에 의한 취소',
                cancelPwd: process.env.INNOPAY_CANCEL_PWD || '0612',
            };
            const response = await fetch(INNOPAY_CANCEL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Merchant-Key': process.env.INNOPAY_LICENSE_KEY || '',
                },
                body: JSON.stringify(cancelData),
            });
            const innopayResult = await response.json();
            if (innopayResult.resultCode !== '2001') {
                return {
                    ok: false,
                    error: `결제 취소 실패: ${innopayResult.resultMsg || '카드사 취소 거절'}`,
                    cancelledCoupons,
                };
            }
        } catch (pgErr: any) {
            return {
                ok: false,
                error: `결제 취소 통신 오류: ${pgErr?.message || '오류'}`,
                cancelledCoupons,
            };
        }
    }

    // 3) 아직 발송 전이던 pending/failed 수신자들도 cancelled 표시
    await sb
        .from('gift_order_recipients')
        .update({ send_status: 'cancelled', error: `발송 전 주문 취소 (${reason})` })
        .eq('order_id', orderId)
        .in('send_status', ['pending', 'failed']);

    const nowIso = new Date().toISOString();
    await sb
        .from('gift_orders')
        .update({
            status: 'cancelled',
            cancelled_at: nowIso,
            cancel_reason: reason,
            updated_at: nowIso,
        })
        .eq('id', orderId);

    // 4) 실결제 취소 시 상주에게 결제 취소 완료 알림 발송 (GIFT_CANCEL_TEMPLATE_ID 우선, 미설정/실패 시 LMS 폴백)
    if (!order.is_test && order.buyer_phone) {
        const cleanPhone = String(order.buyer_phone).replace(/\D/g, '');
        if (cleanPhone.startsWith('010')) {
            const cancelTemplateId = process.env.GIFT_CANCEL_TEMPLATE_ID;
            let sentAlim = false;
            if (cancelTemplateId) {
                try {
                    const res = await sendAlimtalk(cleanPhone, cancelTemplateId, {
                        주문번호: order.order_number,
                        상품명: order.product_name,
                        수량: `${order.quantity}명`,
                        환불금액: (order.total_amount || 0).toLocaleString(),
                        결제수단: order.payment_method || '신용카드',
                    });
                    if (!res?.statusCode || res.statusCode === '2000') sentAlim = true;
                } catch (alimErr) {
                    console.error('[gift/cancel] 취소 알림톡 실패, LMS 대체 발송:', alimErr);
                }
            }
            if (!sentAlim) {
                const cancelLms = [
                    `[마음부고] 답례품 주문이 정상적으로 취소되었습니다.`,
                    ``,
                    `◼ 취소 내역`,
                    `- 주문번호: ${order.order_number}`,
                    `- 상품명: ${order.product_name}`,
                    `- 취소수량: ${order.quantity}명`,
                    `- 환불금액: ${(order.total_amount || 0).toLocaleString()}원`,
                    `- 결제수단: ${order.payment_method || '신용카드'}`,
                    ``,
                    `※ 결제 승인 취소는 카드사 정책에 따라 영업일 기준 2~3일 소요될 수 있습니다.`,
                    `※ 감사장과 모바일 쿠폰은 발송되지 않습니다.`,
                ].join('\n');
                await sendLMS(cleanPhone, '[마음부고] 답례품 주문 취소 안내', cancelLms).catch((err) =>
                    console.error('[gift/cancel] 취소 LMS 발송 오류:', err)
                );
            }
        }
    }

    return { ok: true, cancelledCoupons };
}
