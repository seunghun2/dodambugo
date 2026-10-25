'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { gaEvents } from '@/components/GoogleAnalytics';
import '@/app/view/[id]/order/[productId]/order.css';

interface OrderData {
    id: string;
    order_number: string;
    product_name: string;
    product_price: number;
    sender_name: string;
    sender_phone: string;
    recipient_name: string;
    funeral_home: string;
    room: string;
    address: string;
    ribbon_text1: string;
    ribbon_text2: string;
    status: string;
    payment_method: string;
    created_at: string;
    approved_at: string;
    bugo_id: string;
    bugo_number?: string;
    tid: string;
}

interface CondolenceOrderData {
    id: number;
    order_number: string;
    bugo_number: string;
    buyer_name: string;
    buyer_phone: string;
    recipient_name: string;
    amount: number;
    fee: number;
    total_amount: number;
    payment_method: string;
    status: string;
    tid: string;
    bank_name: string;
    account_no: string;
    receipt_url: string;
    created_at: string;
}

interface GiftOrderRecipientItem {
    id: string;
    name: string;
    masked_phone: string;
    source: string;
    send_status: string;
    sent_at: string | null;
}

interface GiftOrderData {
    id: string;
    order_number: string;
    bugo_id: string | null;
    bugo_number: string;
    buyer_name: string;
    buyer_phone_masked: string | null;
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    total_amount: number;
    card_id: string;
    message: string;
    payment_method: string;
    status: string;
    is_test: boolean;
    tid: string | null;
    receipt_url: string | null;
    created_at: string;
    approved_at: string;
    sent_at: string | null;
    cancelled_at: string | null;
    cancel_reason: string | null;
    can_cancel: boolean;
    remaining_cancel_seconds: number;
    cancel_deadline_at: string;
    recipients: GiftOrderRecipientItem[];
}

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<OrderData | null>(null);
    const [condolenceOrder, setCondolenceOrder] = useState<CondolenceOrderData | null>(null);
    const [giftOrder, setGiftOrder] = useState<GiftOrderData | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
    const [cancellingGift, setCancellingGift] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isExpanded, setIsExpanded] = useState({
        productInfo: false,
        refund: false,
        withdrawal: false,
        recipients: false,
    });

    const isCondolence =
        orderId?.startsWith('CO') ||
        orderId?.startsWith('DO') ||
        orderId?.startsWith('COND_') ||
        orderId?.startsWith('BCOND_');
    const isGift = orderId?.startsWith('GF');

    const fetchGiftOrder = useCallback(async () => {
        const res = await fetch(`/api/gift/orders/${orderId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('주문을 찾을 수 없습니다.');
        const data = await res.json();
        if (!data.success || !data.order) throw new Error('주문을 찾을 수 없습니다.');
        setGiftOrder(data.order);
        setRemainingSeconds(data.order.remaining_cancel_seconds || 0);
    }, [orderId]);

    useEffect(() => {
        async function fetchOrder() {
            try {
                if (isGift) {
                    await fetchGiftOrder();
                    return;
                }
                if (isCondolence) {
                    // 부의금 주문 조회 (DB 커밋 타이밍 이슈 대비 재시도)
                    let retries = 3;
                    while (retries > 0) {
                        const res = await fetch(`/api/condolence/orders/${orderId}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.success && data.order) {
                                setCondolenceOrder(data.order);
                                return;
                            }
                        }
                        retries--;
                        if (retries > 0) {
                            await new Promise((r) => setTimeout(r, 1500));
                        }
                    }
                    throw new Error('주문을 찾을 수 없습니다.');
                } else {
                    // 화환 주문 조회
                    const res = await fetch(`/api/flower-orders/${orderId}`);
                    if (!res.ok) throw new Error('주문을 찾을 수 없습니다.');
                    const data = await res.json();
                    setOrder(data);
                }
            } catch (err: any) {
                setError(err.message || '주문 정보를 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        }

        if (orderId) {
            fetchOrder();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, isCondolence, isGift]);

    // 답례품 10분 유예 카운트다운 타이머
    useEffect(() => {
        if (!giftOrder) return;
        const isWaiting = giftOrder.status === 'paid' || giftOrder.status === 'test_paid';
        if (!isWaiting || !giftOrder.cancel_deadline_at) {
            setRemainingSeconds(0);
            return;
        }

        const deadlineMs = new Date(giftOrder.cancel_deadline_at).getTime();
        const tick = () => {
            const left = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
            setRemainingSeconds(left);
            if (left === 0) {
                // 10분 경과 시 서버에 발송 트리거 및 최신 상태 갱신
                fetchGiftOrder().catch(() => {});
            }
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [giftOrder, fetchGiftOrder]);

    // GA 이벤트 & Google Ads 전환 추적 (한 번만 실행)
    const trackedRef = useRef(false);
    useEffect(() => {
        if (trackedRef.current) return;

        if (isCondolence && condolenceOrder) {
            trackedRef.current = true;
            gaEvents.completeCondolence(condolenceOrder.amount || 0);
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'conversion', {
                    send_to: 'AW-17911391889/lh3xCPb08IYcEJHN6NxC',
                    value: condolenceOrder.total_amount || 0,
                    currency: 'KRW',
                });
            }
        } else if (!isCondolence && !isGift && order) {
            trackedRef.current = true;
            gaEvents.completeFlowerOrder(order.order_number, order.product_price || 0);
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'conversion', {
                    send_to: 'AW-17911391889/lh3xCPb08IYcEJHN6NxC',
                    value: order.product_price || 0,
                    currency: 'KRW',
                });
            }
        }
    }, [isCondolence, isGift, condolenceOrder, order]);

    // 날짜 포맷 함수
    const formatDateTime = (date?: string | null) => {
        if (!date) return '-';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        return `${year}.${month}.${day} ${hour}:${minute}`;
    };

    const formatDispatchTime = (deadlineAt?: string | null) => {
        if (!deadlineAt) return '';
        const d = new Date(deadlineAt);
        const hour = d.getHours();
        const minute = String(d.getMinutes()).padStart(2, '0');
        return `${hour}시 ${minute}분`;
    };

    const handleCancelGiftOrder = async () => {
        if (!giftOrder || cancellingGift) return;
        const canNow =
            (giftOrder.status === 'paid' || giftOrder.status === 'test_paid') && remainingSeconds > 0;
        if (!canNow) {
            alert('결제 후 1시간이 경과하여 주문이 확정되었으므로 취소할 수 없습니다.');
            return;
        }
        if (
            !confirm(
                `답례품 주문(${giftOrder.product_name} · ${giftOrder.quantity}명)을 취소하시겠습니까?\n\n결제 금액(${giftOrder.total_amount.toLocaleString()}원)이 전액 취소되며 감사장과 모바일 쿠폰이 발송되지 않습니다.`
            )
        ) {
            return;
        }

        setCancellingGift(true);
        try {
            const res = await fetch(`/api/gift/orders/${giftOrder.order_number}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: '주문자 직접 취소 (1시간 이내)' }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                alert(json.error || '주문을 취소할 수 없습니다.');
                await fetchGiftOrder().catch(() => {});
            } else {
                await fetchGiftOrder();
            }
        } catch (e: any) {
            alert(e?.message || '취소 처리 중 오류가 발생했습니다.');
        } finally {
            setCancellingGift(false);
        }
    };

    if (loading) {
        return (
            <div className="order-page">
                <div className="order-loading">주문 정보를 불러오는 중...</div>
            </div>
        );
    }

    if (error || (!order && !condolenceOrder && !giftOrder)) {
        return (
            <div className="order-page">
                <div className="order-body" style={{ textAlign: 'center', paddingTop: '120px', paddingLeft: '24px', paddingRight: '24px' }}>
                    <span style={{ fontSize: '64px' }}>😔</span>
                    <h2 style={{ marginTop: '24px', fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>주문을 찾을 수 없습니다</h2>
                    <p style={{ color: '#888', marginTop: '10px', fontSize: '14px', lineHeight: '1.5' }}>{error || '주문 정보가 존재하지 않거나 만료되었습니다.'}</p>
                    <Link href="/" className="btn-payment" style={{ marginTop: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: '#FFD43B', color: '#1A1A1A', fontWeight: '600', height: '52px', borderRadius: '12px' }}>
                        홈으로
                    </Link>
                </div>
            </div>
        );
    }

    // ===== 답례품 주문내역 / 결제완료 화면 (화환·부의금 결제완료와 동일한 디자인) =====
    if (isGift && giftOrder) {
        const isCancelled = giftOrder.status === 'cancelled';
        const isSent = giftOrder.status === 'sent' || giftOrder.status === 'partial';
        const isWaiting = giftOrder.status === 'paid' || giftOrder.status === 'test_paid';
        const canCancelNow = isWaiting && remainingSeconds > 0;
        const firstRecipient = giftOrder.recipients?.[0];
        const recipientSummary = firstRecipient
            ? giftOrder.quantity > 1
                ? `${firstRecipient.name} (${firstRecipient.masked_phone}) 외 ${giftOrder.quantity - 1}명`
                : `${firstRecipient.name} (${firstRecipient.masked_phone})`
            : `${giftOrder.quantity}명`;

        return (
            <div className="order-page">
                <header className="order-header" style={{ justifyContent: 'center' }}>
                    <h1>{isCancelled ? '주문 취소 완료' : '주문내역'}</h1>
                </header>

                <div className="order-body complete-body">
                    <div className="complete-banner">
                        {isCancelled ? (
                            <>
                                <div
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: '50%',
                                        background: '#FEE2E2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 18px',
                                    }}
                                >
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </div>
                                <h2>주문이 정상적으로 취소<br />되었습니다.</h2>
                                <p style={{ fontSize: 14, color: '#888', marginTop: 8 }}>
                                    감사장과 모바일 쿠폰이 발송되지 않으며 결제 금액이 환불 처리됩니다.
                                </p>
                            </>
                        ) : (
                            <>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="#FFD43B" style={{ marginBottom: '20px' }}>
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                <h2>
                                    {isSent ? (
                                        <>답례품과 감사장이<br />전달되었습니다.</>
                                    ) : (
                                        <>답례품 주문이 정상적으로<br />완료되었습니다.</>
                                    )}
                                </h2>
                                <p style={{ fontSize: 14, color: '#888', marginTop: 8 }}>
                                    {isSent
                                        ? '받으시는 분들께 감사장 문자와 모바일 쿠폰이 발송되었습니다.'
                                        : '결제 완료 1시간 후 감사장 문자와 모바일 쿠폰이 순차 발송됩니다.'}
                                </p>
                            </>
                        )}
                    </div>

                    {/* 상세 안내 */}
                    <section className="order-section">
                        <h2 className="section-title">상세 안내</h2>

                        <div className="detail-row">
                            <span className="label">주문번호</span>
                            <span className="value">{giftOrder.order_number}</span>
                        </div>

                        <div className="detail-row">
                            <span className="label">발송 상태</span>
                            <span
                                className="value"
                                style={{
                                    fontWeight: 700,
                                    color: isCancelled
                                        ? '#DC2626'
                                        : isSent
                                          ? '#16A34A'
                                          : '#1A1A1A',
                                }}
                            >
                                {isCancelled
                                    ? '주문 취소됨'
                                    : isSent
                                      ? '발송완료'
                                      : giftOrder.status === 'sending'
                                        ? '발송 진행 중'
                                        : `발송대기(${formatDispatchTime(giftOrder.cancel_deadline_at)} 발송 예정)`}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="label">보내시는 분</span>
                            <span className="value">
                                {giftOrder.buyer_name}
                                {giftOrder.buyer_phone_masked ? ` / ${giftOrder.buyer_phone_masked}` : ''}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="label">받으시는 분</span>
                            <div className="value">
                                <div>{recipientSummary}</div>
                                {giftOrder.recipients?.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsExpanded((prev) => ({ ...prev, recipients: !prev.recipients }))
                                        }
                                        style={{
                                            marginTop: 6,
                                            padding: '3px 8px',
                                            fontSize: 12,
                                            borderRadius: 4,
                                            border: '1px solid #DDD',
                                            background: '#F8F9FA',
                                            color: '#555',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {isExpanded.recipients ? '명단 접기' : `전체 ${giftOrder.quantity}명 보기`}
                                    </button>
                                )}
                                {isExpanded.recipients && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: '#666', lineHeight: 1.7 }}>
                                        {giftOrder.recipients.map((r) => (
                                            <div key={r.id}>
                                                {r.name} ({r.masked_phone})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="detail-row">
                            <span className="label">상품명</span>
                            <span className="value">{giftOrder.product_name}</span>
                        </div>

                        <div className="detail-row">
                            <span className="label">상품수량</span>
                            <span className="value">
                                {giftOrder.quantity}개
                            </span>
                        </div>

                        <div className="detail-row total">
                            <span className="label">총 결제 금액</span>
                            <span className="value highlight">{giftOrder.total_amount?.toLocaleString()}원</span>
                        </div>

                        <div className="detail-row">
                            <span className="label">구매 일시</span>
                            <span className="value">{formatDateTime(giftOrder.approved_at || giftOrder.created_at)}</span>
                        </div>

                        {isCancelled && giftOrder.cancelled_at && (
                            <div className="detail-row">
                                <span className="label">취소 일시</span>
                                <span className="value" style={{ color: '#DC2626' }}>
                                    {formatDateTime(giftOrder.cancelled_at)}
                                </span>
                            </div>
                        )}

                        <div className="detail-row">
                            <span className="label">결제 정보</span>
                            <span className="value">
                                {giftOrder.payment_method}
                                {giftOrder.tid && (
                                    <a
                                        href={
                                            giftOrder.receipt_url ||
                                            `https://pg.innopay.co.kr/pay/issue/TransIssue.jsp?TID=${giftOrder.tid}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="receipt-btn"
                                        style={{ color: '#1A1A1A', marginLeft: '10px' }}
                                    >
                                        영수증 보기
                                    </a>
                                )}
                            </span>
                        </div>
                    </section>

                    {/* 1시간 이내 주문 취소 제어 영역 */}
                    {!isCancelled && (
                        <section className="order-section" style={{ marginTop: 12 }}>
                            <h2 className="section-title">주문 취소 안내</h2>
                            {canCancelNow ? (
                                <div>
                                    <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 14 }}>
                                        • 답례품은 결제 완료 <strong>1시간 후 ({formatDispatchTime(giftOrder.cancel_deadline_at)} 예정)</strong> 감사장과 함께 자동 발송됩니다.
                                        <br />• 발송 전까지 아래 버튼으로 주문을 즉시 취소하실 수 있습니다.
                                    </p>
                                    <button
                                        type="button"
                                        disabled={cancellingGift}
                                        onClick={handleCancelGiftOrder}
                                        style={{
                                            width: '100%',
                                            height: 42,
                                            borderRadius: 8,
                                            border: '1px solid #E5E7EB',
                                            background: '#FFFFFF',
                                            color: '#6B7280',
                                            fontSize: 14,
                                            fontWeight: 500,
                                            cursor: cancellingGift ? 'wait' : 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {cancellingGift ? '취소 처리 중...' : '주문 취소하기'}
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 12 }}>
                                        • 결제 후 1시간이 경과하여 답례품 및 감사장 발송이 확정되었으므로 취소가 불가합니다.
                                        <br />• 모바일 쿠폰 특성상 발송 완료 후에는 교환·연장·환불이 불가합니다.
                                    </p>
                                    <button
                                        type="button"
                                        disabled
                                        style={{
                                            width: '100%',
                                            height: 48,
                                            borderRadius: 10,
                                            border: '1px solid #E5E7EB',
                                            background: '#F3F4F6',
                                            color: '#9CA3AF',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            cursor: 'not-allowed',
                                        }}
                                    >
                                        주문 완료 (1시간 경과로 취소 불가)
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* 안내사항 아코디언 */}
                    <section className="info-accordion">
                        <div
                            className={`accordion-item ${isExpanded.refund ? 'expanded' : ''}`}
                            onClick={() => setIsExpanded({ ...isExpanded, refund: !isExpanded.refund })}
                        >
                            <div className="accordion-header">
                                <span>발송 및 취소/환불 안내</span>
                                <span className="material-symbols-outlined">
                                    {isExpanded.refund ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                            {isExpanded.refund && (
                                <div className="accordion-content">
                                    <p>• 결제 완료 후 1시간 이내에는 본 주문내역 페이지에서 직접 주문을 취소하실 수 있습니다.</p>
                                    <p>• 결제 후 1시간이 경과하면 받으시는 분께 감사장 문자(LMS)와 모바일 쿠폰(MMS)이 발송되며 이후에는 취소가 불가합니다.</p>
                                    <p>• 모바일 쿠폰의 유효기간은 발송일로부터 30일이며, 기간 만료 후 연장 및 환불은 불가합니다.</p>
                                    <p>
                                        • 기타 문의사항은 고객센터{' '}
                                        <a href="tel:15996567" onClick={(e) => e.stopPropagation()} style={{ color: '#1A1A1A', fontWeight: 600, textDecoration: 'underline' }}>
                                            1599-6567
                                        </a>
                                        로 연락해 주세요.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="order-footer">
                    {giftOrder.bugo_number ? (
                        <Link
                            href={`/view/${giftOrder.bugo_number}/gift`}
                            className="btn-payment"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            추가주문하기
                        </Link>
                    ) : (
                        <Link
                            href="/"
                            className="btn-payment"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            홈으로 돌아가기
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    // ===== 부의금 완료 화면 =====
    if (isCondolence && condolenceOrder) {
        return (
            <div className="order-page">
                <header className="order-header" style={{ justifyContent: 'center' }}>
                    <h1>결제 완료</h1>
                </header>

                <div className="order-body complete-body">
                    <div className="complete-banner">
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #4A7C59, #5a9a6a)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: '0 4px 16px rgba(74, 124, 89, 0.3)',
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <h2>부의금이 전달되었습니다</h2>
                        <p style={{ fontSize: 14, color: '#888', marginTop: 8 }}>따뜻한 마음이 상주님께 전달되었습니다.</p>
                    </div>

                    <section className="order-section">
                        <div className="detail-row">
                            <span className="label">주문번호</span>
                            <span className="value">{condolenceOrder.order_number}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">보내신 분</span>
                            <span className="value">{condolenceOrder.buyer_name}</span>
                        </div>
                        {condolenceOrder.recipient_name && (
                            <div className="detail-row">
                                <span className="label">받으시는 분</span>
                                <span className="value">{condolenceOrder.recipient_name}</span>
                            </div>
                        )}
                        {condolenceOrder.bank_name && (
                            <div className="detail-row">
                                <span className="label">입금계좌</span>
                                <span className="value">{condolenceOrder.bank_name} {condolenceOrder.account_no}</span>
                            </div>
                        )}
                        <div className="detail-row">
                            <span className="label">부의금</span>
                            <span className="value">{condolenceOrder.amount?.toLocaleString()}원</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">수수료</span>
                            <span className="value" style={{ color: '#888' }}>{condolenceOrder.fee?.toLocaleString()}원</span>
                        </div>
                        <div className="detail-row total">
                            <span className="label">결제금액</span>
                            <span className="value highlight">{condolenceOrder.total_amount?.toLocaleString()}원</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">결제일시</span>
                            <span className="value">{formatDateTime(condolenceOrder.created_at)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">결제수단</span>
                            <span className="value">
                                {condolenceOrder.payment_method === 'CARD' ? '신용카드' : condolenceOrder.payment_method === 'EPAY' ? '간편결제' : condolenceOrder.payment_method}
                                {condolenceOrder.tid && (
                                    <a href={`https://pg.innopay.co.kr/pay/issue/TransIssue.jsp?TID=${condolenceOrder.tid}`} target="_blank" rel="noopener noreferrer" className="receipt-btn" style={{ color: '#1A1A1A', marginLeft: '10px' }}>영수증 보기</a>
                                )}
                            </span>
                        </div>
                    </section>

                    <div style={{
                        margin: '20px 16px 0', padding: '16px',
                        background: '#F5F5F5', borderRadius: 8,
                        fontSize: 13, color: '#888', lineHeight: 1.8,
                    }}>
                        <p style={{ fontWeight: 600, color: '#666', marginBottom: 8 }}>안내사항</p>
                        <p>• 부의금은 상주님 계좌로 입금 처리됩니다.</p>
                        <p>• 부의금은 상주님 계좌로 즉시 송금되므로 결제 후 환불이 불가합니다.</p>
                        <p>• 결제 내역은 이 페이지에서 확인하실 수 있습니다.</p>
                    </div>
                </div>

                <div className="order-footer">
                    {condolenceOrder.bugo_number ? (
                        <Link href={`/view/${condolenceOrder.bugo_number}`} className="btn-payment"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            부고 페이지로 돌아가기
                        </Link>
                    ) : (
                        <Link href="/" className="btn-payment"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            홈으로 돌아가기
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    // 결제방법 한글 변환
    const paymentText: Record<string, string> = {
        card: '신용/체크카드',
        easy: '간편결제',
        virtual: '가상계좌',
    };

    if (!order) return null;

    return (
        <div className="order-page">
            <header className="order-header" style={{ justifyContent: 'center' }}>
                <h1>주문완료</h1>
            </header>

            <div className="order-body complete-body">
                {/* 완료 메시지 */}
                <div className="complete-banner">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="#FFD43B" style={{ marginBottom: '20px' }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <h2>주문이 정상적으로 완료<br />되었습니다.</h2>
                </div>

                {/* 상세 안내 */}
                <section className="order-section">
                    <h2 className="section-title">상세 안내</h2>

                    <div className="detail-row">
                        <span className="label">보내시는 분</span>
                        <span className="value">{order.sender_name} / {order.sender_phone}</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">수령자 정보</span>
                        <div className="value">
                            <div>{order.recipient_name}</div>
                            <div className="sub-text">{order.funeral_home} {order.room}</div>
                            {order.address && <div className="sub-text">{order.address}</div>}
                        </div>
                    </div>

                    <div className="detail-row">
                        <span className="label">상품명</span>
                        <span className="value">{order.product_name}</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">리본 문구</span>
                        <div className="value">
                            <div>{order.ribbon_text1 || '-'}</div>
                            <div className="sub-text">{order.ribbon_text2 || '-'}</div>
                        </div>
                    </div>

                    <div className="detail-row">
                        <span className="label">수량</span>
                        <span className="value">1</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">구매 일시</span>
                        <span className="value">{formatDateTime(order.approved_at || order.created_at)}</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">구매 번호</span>
                        <span className="value">{order.order_number}</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">구매 금액</span>
                        <span className="value">{order.product_price?.toLocaleString()}원</span>
                    </div>

                    <div className="detail-row total">
                        <span className="label">총 결제 금액</span>
                        <span className="value highlight">{order.product_price?.toLocaleString()}원</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">결제 정보</span>
                        <span className="value">
                            {paymentText[order.payment_method] || order.payment_method}
                            {order.tid ? (
                                <a href={`https://pg.innopay.co.kr/pay/issue/TransIssue.jsp?TID=${order.tid}`} target="_blank" rel="noopener noreferrer" className="receipt-btn" style={{ color: '#1A1A1A', marginLeft: '10px' }}>영수증 보기</a>
                            ) : null}
                        </span>
                    </div>
                </section>

                {/* 안내사항 아코디언 */}
                <section className="info-accordion">
                    <div
                        className={`accordion-item ${isExpanded.productInfo ? 'expanded' : ''}`}
                        onClick={() => setIsExpanded({ ...isExpanded, productInfo: !isExpanded.productInfo })}
                    >
                        <div className="accordion-header">
                            <span>상품정보제공고시</span>
                            <span className="material-symbols-outlined">
                                {isExpanded.productInfo ? 'expand_less' : 'expand_more'}
                            </span>
                        </div>
                        {isExpanded.productInfo && (
                            <div className="accordion-content">
                                <p>• 품명: 근조 화환</p>
                                <p>• 소재: 생화</p>
                                <p>• 원산지</p>
                                <p style={{ paddingLeft: '12px' }}>- 국산: 장미, 국화, 카네이션, 백합, 튤립, 글라디올러스 등</p>
                                <p style={{ paddingLeft: '12px' }}>- 수입산: 중국, 대만, 베트남, 일본, 콜롬비아, 네덜란드 등</p>
                                <p style={{ paddingLeft: '12px' }}>- 리본 및 부자재: 국산</p>
                                <p>• 크기: 상품별 상이</p>
                                <p>• 제조사: 전국 제휴 화원</p>
                                <p>• 배송: 전국 당일 배송 (4시간 내)</p>
                            </div>
                        )}
                    </div>

                    <div
                        className={`accordion-item ${isExpanded.refund ? 'expanded' : ''}`}
                        onClick={() => setIsExpanded({ ...isExpanded, refund: !isExpanded.refund })}
                    >
                        <div className="accordion-header">
                            <span>교환/환불 안내</span>
                            <span className="material-symbols-outlined">
                                {isExpanded.refund ? 'expand_less' : 'expand_more'}
                            </span>
                        </div>
                        {isExpanded.refund && (
                            <div className="accordion-content">
                                <p style={{ color: '#999', marginBottom: '8px' }}>※ 온라인에서는 교환/환불 접수가 불가하며, 고객센터로 문의해주세요.</p>
                                <p><strong>1) 교환 가능</strong></p>
                                <p>• 배송 중 상품이 파손 또는 훼손된 경우</p>
                                <p>• 주문 내용과 다른 상품이 배송된 경우</p>
                                <p style={{ marginTop: '8px' }}><strong>2) 환불 가능</strong></p>
                                <p>• 결제 후 제작 시작 전 취소 요청 시</p>
                                <p>• 품절 또는 배송 불가 지역인 경우</p>
                                <p style={{ marginTop: '8px' }}><strong>3) 교환/환불 불가</strong></p>
                                <p>• 생화는 한번 잘리면 재사용이 불가하여, 제작 완료 후 단순 변심에 의한 교환/환불이 어렵습니다.</p>
                                <p>• 주문자의 배송정보 오류 또는 수취 거부로 인한 교환/환불은 불가합니다.</p>
                            </div>
                        )}
                    </div>

                    <div
                        className={`accordion-item ${isExpanded.withdrawal ? 'expanded' : ''}`}
                        onClick={() => setIsExpanded({ ...isExpanded, withdrawal: !isExpanded.withdrawal })}
                    >
                        <div className="accordion-header">
                            <span>청약철회 안내</span>
                            <span className="material-symbols-outlined">
                                {isExpanded.withdrawal ? 'expand_less' : 'expand_more'}
                            </span>
                        </div>
                        {isExpanded.withdrawal && (
                            <div className="accordion-content">
                                <p>• 생화 특성상 단순 변심에 의한 청약철회가 제한될 수 있습니다.</p>
                                <p>• 상품 하자 시 교환 또는 환불이 가능합니다.</p>
                                <p>• 화분, 바구니, 포장지 등 부속품은 시즌 및 지역에 따라 이미지와 다를 수 있습니다.</p>
                                <p>• 자세한 사항은 고객센터로 문의해 주세요.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* 하단 버튼 */}
            <div className="order-footer">
                {order.bugo_id ? (
                    <Link
                        href={`/view/${order.bugo_number || order.bugo_id}`}
                        className="btn-payment"
                        style={{
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        부고 페이지로 돌아가기
                    </Link>
                ) : (
                    <Link
                        href="/"
                        className="btn-payment"
                        style={{
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        홈으로 돌아가기
                    </Link>
                )}
            </div>
        </div>
    );
}
