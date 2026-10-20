'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
    CARD_OPTIONS,
    MESSAGE_MAX,
    RELIGION_TABS,
    buildMessage,
    getReligionType,
    parseCustomMessages,
    type CardId,
    type ReligionType,
} from '@/lib/gift/thanks-messages';
import { AGREE_TEXT, GIFT_VALID_DAYS } from '@/lib/gift/notices';
import { ProductThumb } from './ProductThumb';
import RecipientPanel from './RecipientPanel';
import { AuthModal, ConfirmModal, DoneModal, PreviewModal } from './Modals';
import { won, type GiftProduct, type RecipientItem } from './types';

interface Props {
    bugoId: string;
    bugoUuid: string;
    bugoNumber: string;
    initialProduct: GiftProduct;
    live: boolean;
    deceasedName: string;
    mournerName: string;
    religion: string | null;
    thanksReligion: string | null;
    thanksMessage: unknown;
}

const TAB_KEYS = RELIGION_TABS.map((t) => t.key);

export default function GiftSendContent({ bugoId, initialProduct, live, deceasedName, mournerName, religion, thanksReligion, thanksMessage }: Props) {
    const router = useRouter();
    const draftStorageKey = `maeum_gift_draft_${bugoId}`;

    // ----- 카드 / 문구 -----
    const initialTab: ReligionType = TAB_KEYS.includes(thanksReligion as ReligionType) ? (thanksReligion as ReligionType) : getReligionType(religion);
    const [tab, setTab] = useState<ReligionType>(initialTab);
    const [cardId, setCardId] = useState<CardId>(initialTab);
    const [messages, setMessages] = useState<Record<ReligionType, string>>(() => {
        const custom = parseCustomMessages(thanksMessage);
        return Object.fromEntries(TAB_KEYS.map((k) => [k, buildMessage(k, deceasedName, custom)])) as Record<ReligionType, string>;
    });
    const message = messages[tab];

    const selectTab = (k: ReligionType) => {
        setTab(k);
        setCardId((prev) => (prev === 'none' ? prev : k));
    };
    const pickCard = (id: CardId) => {
        setCardId(id);
        if (id !== 'none') setTab(id);
    };

    // ----- 상품 / 받는 사람 -----
    const product = initialProduct;
    const [items, setItems] = useState<RecipientItem[]>([]);
    const [agree, setAgree] = useState(false);
    const [draftRestored, setDraftRestored] = useState(false);

    // ----- 초안 복원 (카톡→크롬 이동 시 URL ?draft= 파라미터 또는 상품 변경 시 localStorage) -----
    useEffect(() => {
        try {
            const url = new URL(window.location.href);
            const urlDraft = url.searchParams.get('draft');
            let parsed: any = null;

            if (urlDraft) {
                const jsonStr = decodeURIComponent(escape(window.atob(urlDraft)));
                parsed = JSON.parse(jsonStr);
                url.searchParams.delete('draft');
                window.history.replaceState({}, '', url.toString());
            } else {
                const saved = window.localStorage.getItem(draftStorageKey);
                if (saved) parsed = JSON.parse(saved);
            }

            if (parsed) {
                if (parsed.tab && TAB_KEYS.includes(parsed.tab)) setTab(parsed.tab);
                if (parsed.cardId) setCardId(parsed.cardId);
                if (parsed.messages && typeof parsed.messages === 'object') {
                    setMessages((prev) => ({ ...prev, ...parsed.messages }));
                }
                if (Array.isArray(parsed.items) && parsed.items.length > 0) {
                    setItems(parsed.items);
                }
            }
        } catch {
            /* 파싱 오류 무시 */
        } finally {
            setDraftRestored(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftStorageKey]);

    // ----- 초안 자동 저장 (localStorage) -----
    useEffect(() => {
        if (!draftRestored) return;
        try {
            window.localStorage.setItem(
                draftStorageKey,
                JSON.stringify({ tab, cardId, messages, items })
            );
        } catch {
            /* 용량 초과 등 무시 */
        }
    }, [draftRestored, draftStorageKey, tab, cardId, messages, items]);

    // 카톡 인앱 → 크롬 이동 시 현재 작성 중인 문구·명단을 URL에 실어 넘긴다
    const buildShareableDraftUrl = useCallback(() => {
        try {
            const url = new URL(window.location.href);
            const payload = JSON.stringify({ tab, cardId, messages, items });
            const encoded = window.btoa(unescape(encodeURIComponent(payload)));
            url.searchParams.set('draft', encoded);
            return url.toString();
        } catch {
            return window.location.href;
        }
    }, [tab, cardId, messages, items]);

    // ----- 오버레이 -----
    const [previewOpen, setPreviewOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const authResolver = useRef<((ok: boolean) => void) | null>(null);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState<null | { orderNumber: string; count: number; total: number; isTest: boolean }>(null);

    // ----- 토스트 -----
    const [toast, setToast] = useState<string | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notify = useCallback((m: string) => {
        setToast(m);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2800);
    }, []);

    // 오버레이가 열려 있으면 뒤 화면 스크롤 잠금
    const anyOverlay = previewOpen || confirmOpen || helpOpen || authOpen || !!done;
    useEffect(() => {
        document.body.style.overflow = anyOverlay ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [anyOverlay]);

    // ----- 상주 확인 -----
    const ensureAuth = useCallback(async (): Promise<boolean> => {
        try {
            const r = await fetch(`/api/gift/auth?bugoId=${encodeURIComponent(bugoId)}`, { cache: 'no-store' });
            const s = await r.json();
            if (s.authenticated) return true;
        } catch {
            /* 확인 실패 시 모달로 진행 */
        }
        return new Promise<boolean>((resolve) => {
            authResolver.current = resolve;
            setAuthOpen(true);
        });
    }, [bugoId]);
    const closeAuth = (ok: boolean) => {
        setAuthOpen(false);
        authResolver.current?.(ok);
        authResolver.current = null;
    };

    // ----- 결제(주문) -----
    const total = product ? product.sale_price * items.length : 0;
    const hasRefs = items.some((i) => i.ref);
    const canPay = items.length > 0 && agree;

    const startPay = async () => {
        if (items.length === 0) return notify('받는 사람을 선택해주세요.');
        if (!agree) return notify('상품 안내를 확인하고 동의해주세요.');
        if (!(await ensureAuth())) return;
        setConfirmOpen(true);
    };

    const submitOrder = async (retried = false): Promise<void> => {
        if (busy) return;
        setBusy(true);
        try {
            const res = await fetch('/api/gift/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bugoId,
                    productId: product.id,
                    cardId,
                    message,
                    recipients: items.map((i) =>
                        i.ref ? { ref: i.ref, name: i.name, source: i.source } : { name: i.name, phone: i.phone, source: i.source }
                    ),
                }),
            });
            const data = await res.json();
            if (res.status === 401 && !retried) {
                setBusy(false);
                setConfirmOpen(false);
                if (await ensureAuth()) setConfirmOpen(true);
                return;
            }
            if (!res.ok) {
                setConfirmOpen(false);
                return notify(data.error || '주문에 실패했습니다.');
            }
            setConfirmOpen(false);

            // 실결제(이노페이) 모드일 경우 이노페이 결제창 호출 → 콜백 승인 후 /order/[orderNumber] 이동
            if (!data.isTest) {
                if (typeof window === 'undefined' || !window.innopay) {
                    return notify('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                }
                try {
                    sessionStorage.setItem(
                        `payment_${bugoId}`,
                        JSON.stringify({
                            orderId: data.orderId,
                            orderNumber: data.orderNumber,
                            moid: data.orderNumber,
                            paymentType: 'gift',
                        })
                    );
                } catch {}

                const dynamicPrefix =
                    typeof window !== 'undefined' &&
                    (window.location.port === '3001' ||
                        window.location.hostname.includes('partner') ||
                        window.location.hostname.includes('b2b') ||
                        window.location.hostname.includes('bugoon') ||
                        window.location.pathname.startsWith('/b2b'))
                        ? '/b2b'
                        : '';

                const rawGoodsName = String(data.productName || `[${product.brand}] ${product.name}`);
                const prefixedGoodsName = rawGoodsName.startsWith('답례품') ? rawGoodsName : `답례품 ${rawGoodsName}`;
                const safeGoodsName = prefixedGoodsName
                    .replace(/[+&%"'\\]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 20);
                const finalTotalStr = String(data.total || total);

                window.innopay.goPay({
                    payMethod: 'CARD',
                    mid: process.env.NEXT_PUBLIC_INNOPAY_MID || 'pgmaeum01m',
                    moid: data.orderNumber,
                    goodsName: safeGoodsName,
                    goodsCnt: String(data.count || items.length),
                    amt: '0', // 모바일 쿠폰(유가증권/상품권)은 부가세 비과세 대상
                    taxFreeAmt: finalTotalStr, // 전액 비과세(면세) 금액으로 처리
                    buyerName: data.buyerName || mournerName || '상주',
                    buyerTel: String(data.buyerPhone || '01000000000').replace(/\D/g, ''),
                    buyerEmail: 'order@maeumbugo.co.kr',
                    returnUrl: `${window.location.origin}${dynamicPrefix}/view/${bugoId}/payment/callback`,
                    currency: 'KRW',
                    mallReserved: JSON.stringify({
                        type: 'gift',
                        bugoId,
                        orderId: data.orderId,
                        orderNumber: data.orderNumber,
                        originalTaxFreeAmt: finalTotalStr,
                    }),
                });
                return;
            }

            // 테스트 모드: 임시저장 정리 후 주문내역(10분 내 취소 가능) 페이지로 바로 이동
            setItems([]);
            try {
                window.localStorage.removeItem(draftStorageKey);
            } catch {}
            router.push(`/order/${data.orderNumber}`);
        } catch {
            setConfirmOpen(false);
            notify('네트워크 오류가 발생했습니다.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="gs-page">
            <Script src="https://pg.innopay.co.kr/tpay/js/v1/innopay.js" strategy="lazyOnload" />
            <header className="gs-header">
                <button className="gs-icon-btn" onClick={() => router.push(`/view/${bugoId}/gift/${product.id}`)} aria-label="뒤로">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1>답례품과 함께 보내기</h1>
                <span className="gs-header-spacer" />
            </header>

            {!live && <div className="gs-banner">테스트 모드 — 실제 결제와 발송은 이루어지지 않습니다.</div>}

            <main className="gs-main">
                {/* 카드 선택 */}
                <div className="gs-cards">
                    {CARD_OPTIONS.map((c) => (
                        <button key={c.id} className={`gs-cardopt ${cardId === c.id ? 'active' : ''}`} onClick={() => pickCard(c.id)} aria-label={`${c.label} 카드`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {c.image ? <img src={c.image} alt={c.label} /> : <span>없음</span>}
                            {c.image && <em className="gs-cardlabel">{c.label}</em>}
                        </button>
                    ))}
                </div>

                {/* 메시지 */}
                <section className="gs-section">
                    <h3 className="gs-h3">메시지 입력</h3>
                    <div className="gs-chips gs-chips-scroll">
                        {RELIGION_TABS.map((t) => (
                            <button key={t.key} className={`gs-chip ${tab === t.key ? 'active' : ''}`} onClick={() => selectTab(t.key)}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className="gs-msgbox">
                        <button className="gs-viewcard" onClick={() => setPreviewOpen(true)}>
                            카드 보기
                        </button>
                        <textarea
                            value={message}
                            onChange={(e) => setMessages((prev) => ({ ...prev, [tab]: e.target.value.slice(0, MESSAGE_MAX) }))}
                            rows={10}
                            aria-label="답례 문구"
                        />
                        <span className="gs-count-in" aria-live="polite">
                            {message.length}/{MESSAGE_MAX}
                        </span>
                    </div>
                </section>

                {/* 선물하기: 상품은 상품 상세에서 고른 것으로 고정, 바꾸려면 목록으로 */}
                <section className="gs-section">
                    <div className="gs-row-between">
                        <h3 className="gs-h3">
                            선물하기{' '}
                            <button className="gs-help" onClick={() => setHelpOpen(true)} aria-label="선물하기 안내">
                                ?
                            </button>
                        </h3>
                    </div>
                    <div className="gs-selected">
                        <ProductThumb product={product} size="sm" />
                        <div className="gs-selected-info">
                            <p>
                                [{product.brand}] {product.name}
                            </p>
                            <strong>{won(product.sale_price)}</strong>
                        </div>
                        <button className="gs-btn-outline" onClick={() => router.push(`/view/${bugoId}/gift`)}>
                            변경
                        </button>
                    </div>
                    <p className="gs-hint">
                        모바일 쿠폰은 받는 분께 자동 발송돼요 · 유효기간 발송일로부터 {GIFT_VALID_DAYS}일, 만료 후 연장·환불 불가{' '}
                        <a className="gs-detail-link" href={`/view/${bugoId}/gift/${product.id}`}>
                            상품 안내 보기
                        </a>
                    </p>
                </section>

                <RecipientPanel
                    items={items}
                    setItems={(u) => setItems(u)}
                    bugoId={bugoId}
                    ensureAuth={ensureAuth}
                    notify={notify}
                    buildShareableDraftUrl={buildShareableDraftUrl}
                />

                {items.length > 0 && (
                    <p className="gs-total">
                        {items.length}명 × {won(product.sale_price)} = <strong>{won(total)}</strong>
                    </p>
                )}

                <label className="gs-agree">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                    <span>{AGREE_TEXT}</span>
                </label>
            </main>

            {/* 하단 바: 기존 감사장 화면(문구 수정 | 감사장 전달하기)과 같은 디자인, 미리보기 | 결제하기 반반 */}
            <div className="gs-bottom">
                <button className="gs-bottom-btn" onClick={() => setPreviewOpen(true)}>
                    미리보기
                </button>
                <button className={`gs-bottom-cta ${canPay ? '' : 'disabled'}`} onClick={startPay} aria-disabled={!canPay}>
                    결제하기
                </button>
            </div>

            {/* 오버레이 */}
            {previewOpen && <PreviewModal cardId={cardId} message={message} mournerName={mournerName} onClose={() => setPreviewOpen(false)} />}
            {authOpen && <AuthModal bugoId={bugoId} defaultName={mournerName} onSuccess={() => closeAuth(true)} onClose={() => closeAuth(false)} />}
            {confirmOpen && product && (
                <ConfirmModal
                    product={product}
                    count={items.length}
                    isTest={!live}
                    hasRefs={hasRefs}
                    busy={busy}
                    onConfirm={() => submitOrder()}
                    onClose={() => setConfirmOpen(false)}
                />
            )}
            {done && <DoneModal {...done} onClose={() => setDone(null)} />}
            {helpOpen && (
                <div className="gs-overlay gs-center-wrap" onClick={() => setHelpOpen(false)}>
                    <div className="gs-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="선물하기 안내">
                        <h3 className="gs-h3">답례품은 이렇게 전달돼요</h3>
                        <ol className="gs-help-list">
                            <li>카드와 문구를 정하고 답례품을 고릅니다.</li>
                            <li>받는 분을 조의금·화환 목록, 직접 입력, 엑셀 등으로 추가합니다.</li>
                            <li>결제 완료 1시간 후 받는 분께 감사장과 모바일 쿠폰이 함께 발송됩니다.</li>
                        </ol>
                        <div className="gs-dialog-btns">
                            <button className="gs-btn-dark" onClick={() => setHelpOpen(false)}>
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="gs-toast" role="status">
                    {toast}
                </div>
            )}
        </div>
    );
}
