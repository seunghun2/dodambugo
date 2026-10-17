'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import ProductPicker, { ProductThumb } from './ProductPicker';
import RecipientPanel from './RecipientPanel';
import { AuthModal, ConfirmModal, DoneModal, PreviewModal } from './Modals';
import { won, type GiftProduct, type RecipientItem } from './types';

interface Props {
    bugoId: string;
    bugoUuid: string;
    bugoNumber: string;
    deceasedName: string;
    mournerName: string;
    religion: string | null;
    thanksReligion: string | null;
    thanksMessage: unknown;
}

const TAB_KEYS = RELIGION_TABS.map((t) => t.key);

export default function GiftSendContent({ bugoId, deceasedName, mournerName, religion, thanksReligion, thanksMessage }: Props) {
    const router = useRouter();

    // ----- 카드 / 문구 -----
    const initialTab: ReligionType = TAB_KEYS.includes(thanksReligion as ReligionType) ? (thanksReligion as ReligionType) : getReligionType(religion);
    const [tab, setTab] = useState<ReligionType>(initialTab);
    const [cardId, setCardId] = useState<CardId>(initialTab);
    const [messages, setMessages] = useState<Record<ReligionType, string>>(() => {
        const custom = parseCustomMessages(thanksMessage);
        return Object.fromEntries(TAB_KEYS.map((k) => [k, buildMessage(k, deceasedName, custom)])) as Record<ReligionType, string>;
    });
    const [hideMessage, setHideMessage] = useState(false);
    const message = messages[tab];
    // 문구 탭을 바꾸면 카드도 같은 종류로 맞춘다 (카드 '없음'은 유지) — 카드와 문구가 따로 놀지 않게
    const selectTab = (k: ReligionType) => {
        setTab(k);
        setCardId((prev) => (prev === 'none' ? prev : k));
    };
    const pickCard = (id: CardId) => {
        setCardId(id);
        if (id !== 'none') setTab(id); // 카드를 고르면 같은 종류의 문구 탭으로 맞춰준다
    };

    // ----- 상품 / 받는 사람 -----
    const [products, setProducts] = useState<GiftProduct[]>([]);
    const [live, setLive] = useState<boolean | null>(null);
    const [productError, setProductError] = useState(false);
    const [product, setProduct] = useState<GiftProduct | null>(null);
    const [items, setItems] = useState<RecipientItem[]>([]);

    // ----- 오버레이 -----
    const [pickerOpen, setPickerOpen] = useState(false);
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

    // ----- 상품 로드 -----
    useEffect(() => {
        let alive = true;
        fetch('/api/gift/products')
            .then((r) => r.json())
            .then((d) => {
                if (!alive) return;
                setProducts(d.products || []);
                setLive(!!d.live);
            })
            .catch(() => alive && setProductError(true));
        return () => {
            alive = false;
        };
    }, []);

    // 오버레이가 열려 있으면 뒤 화면 스크롤 잠금
    const anyOverlay = pickerOpen || previewOpen || confirmOpen || helpOpen || authOpen || !!done;
    useEffect(() => {
        document.body.style.overflow = anyOverlay ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [anyOverlay]);

    // ----- 상주 확인 -----
    // 서버가 상주 확인을 요구하지 않으면(기본) 바로 통과하고 모달은 뜨지 않는다.
    // 서버에서 GIFT_REQUIRE_AUTH=true 로 다시 잠그면 그때만 모달이 열린다.
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
    const canPay = !!product && items.length > 0;

    const startPay = async () => {
        if (!product) return notify('답례품을 선택해주세요.');
        if (items.length === 0) return notify('받는 사람을 선택해주세요.');
        if (!(await ensureAuth())) return;
        setConfirmOpen(true);
    };

    const submitOrder = async (retried = false): Promise<void> => {
        if (!product || busy) return;
        setBusy(true);
        try {
            const res = await fetch('/api/gift/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bugoId,
                    productId: product.id,
                    cardId,
                    message: hideMessage ? '' : message,
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
            setDone({ orderNumber: data.orderNumber, count: data.count, total: data.total, isTest: !!data.isTest });
            setItems([]);
        } catch {
            setConfirmOpen(false);
            notify('네트워크 오류가 발생했습니다.');
        } finally {
            setBusy(false);
        }
    };

    const strip = useMemo(() => products.slice(0, 8), [products]);

    return (
        <div className="gs-page">
            <header className="gs-header">
                <button className="gs-icon-btn" onClick={() => router.push(`/view/${bugoId}/thanks`)} aria-label="뒤로">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1>답례품과 함께 보내기</h1>
                <span className="gs-header-spacer" />
            </header>

            {live === false && <div className="gs-banner">테스트 모드 — 실제 결제와 발송은 이루어지지 않습니다.</div>}

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
                    <div className="gs-row-between">
                        <h3 className="gs-h3">메시지 입력</h3>
                        <button className="gs-link" onClick={() => setHideMessage((v) => !v)}>
                            {hideMessage ? '문구 보이기' : '문구 숨기기'}
                        </button>
                    </div>
                    <div className="gs-chips gs-chips-scroll">
                        {RELIGION_TABS.map((t) => (
                            <button key={t.key} className={`gs-chip ${tab === t.key ? 'active' : ''}`} onClick={() => selectTab(t.key)}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className={`gs-msgbox ${hideMessage ? 'hidden' : ''}`}>
                        <button className="gs-viewcard" onClick={() => setPreviewOpen(true)}>
                            카드 보기
                        </button>
                        {hideMessage ? (
                            <p className="gs-msg-hidden">문구가 숨겨졌습니다. 카드만 전달돼요.</p>
                        ) : (
                            <>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessages((prev) => ({ ...prev, [tab]: e.target.value.slice(0, MESSAGE_MAX) }))}
                                    rows={10}
                                    aria-label="답례 문구"
                                />
                                <span className="gs-count-in" aria-live="polite">
                                    {message.length}/{MESSAGE_MAX}
                                </span>
                            </>
                        )}
                    </div>
                </section>

                {/* 선물하기 */}
                <section className="gs-section">
                    <div className="gs-row-between">
                        <h3 className="gs-h3">
                            선물하기{' '}
                            <button className="gs-help" onClick={() => setHelpOpen(true)} aria-label="선물하기 안내">
                                ?
                            </button>
                        </h3>
                    </div>
                    {productError ? (
                        <p className="gs-empty">상품을 불러오지 못했습니다. 새로고침해주세요.</p>
                    ) : (
                        <>
                            <div className="gs-strip">
                                {strip.map((p) => (
                                    <button key={p.id} className={`gs-strip-item ${product?.id === p.id ? 'active' : ''}`} onClick={() => setProduct(p)} aria-label={p.name}>
                                        <ProductThumb product={p} size="sm" />
                                    </button>
                                ))}
                            </div>
                            <div className="gs-selected">
                                {product ? (
                                    <>
                                        <ProductThumb product={product} size="sm" />
                                        <div className="gs-selected-info">
                                            <p>
                                                [{product.brand}] {product.name}
                                            </p>
                                            <strong>{won(product.sale_price)}</strong>
                                        </div>
                                        <button className="gs-btn-outline" onClick={() => setPickerOpen(true)}>
                                            변경
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="gs-placeholder">답례품을 선택해주세요.</span>
                                        <button className="gs-btn-outline" onClick={() => setPickerOpen(true)} disabled={products.length === 0}>
                                            선택
                                        </button>
                                    </>
                                )}
                            </div>
                            <p className="gs-hint">선택한 답례품은 받는 분께 모바일 쿠폰으로 자동 발송돼요.</p>
                        </>
                    )}
                </section>

                <RecipientPanel items={items} setItems={(u) => setItems(u)} bugoId={bugoId} ensureAuth={ensureAuth} notify={notify} />

                {product && items.length > 0 && (
                    <p className="gs-total">
                        {items.length}명 × {won(product.sale_price)} = <strong>{won(total)}</strong>
                    </p>
                )}
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
            {pickerOpen && (
                <ProductPicker
                    products={products}
                    selectedId={product?.id ?? null}
                    onSelect={(p) => {
                        setProduct(p);
                        setPickerOpen(false);
                    }}
                    onClose={() => setPickerOpen(false)}
                />
            )}
            {previewOpen && <PreviewModal cardId={cardId} message={message} hideMessage={hideMessage} mournerName={mournerName} onClose={() => setPreviewOpen(false)} />}
            {authOpen && <AuthModal bugoId={bugoId} defaultName={mournerName} onSuccess={() => closeAuth(true)} onClose={() => closeAuth(false)} />}
            {confirmOpen && product && (
                <ConfirmModal
                    product={product}
                    count={items.length}
                    isTest={live !== true}
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
                            <li>결제하면 받는 분께 모바일 쿠폰이 문자(MMS)나 알림톡으로 전달됩니다.</li>
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
