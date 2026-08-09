'use client';

import { useEffect, useState, useRef } from 'react';
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

export default function B2BOrderDetailPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<OrderData | null>(null);
    const [condolenceOrder, setCondolenceOrder] = useState<CondolenceOrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isExpanded, setIsExpanded] = useState({
        productInfo: false,
        refund: false,
        withdrawal: false,
    });

    const isCondolence = orderId?.startsWith('CO') || orderId?.startsWith('DO') || orderId?.startsWith('COND_') || orderId?.startsWith('BCOND_');

    useEffect(() => {
        async function fetchOrder() {
            try {
                if (isCondolence) {
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
                            await new Promise(r => setTimeout(r, 1500));
                        }
                    }
                    throw new Error('주문을 찾을 수 없습니다.');
                } else {
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
    }, [orderId, isCondolence]);

    // GA 이벤트 & Google Ads 전환 추적
    const trackedRef = useRef(false);
    useEffect(() => {
        if (trackedRef.current) return;

        if (isCondolence && condolenceOrder) {
            trackedRef.current = true;
            gaEvents.completeCondolence(condolenceOrder.amount || 0);
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'conversion', {
                    'send_to': 'AW-17911391889/lh3xCPb08IYcEJHN6NxC',
                    'value': condolenceOrder.total_amount || 0,
                    'currency': 'KRW'
                });
            }
        } else if (!isCondolence && order) {
            trackedRef.current = true;
            gaEvents.completeFlowerOrder(order.order_number, order.product_price || 0);
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'conversion', {
                    'send_to': 'AW-17911391889/lh3xCPb08IYcEJHN6NxC',
                    'value': order.product_price || 0,
                    'currency': 'KRW'
                });
            }
        }
    }, [isCondolence, condolenceOrder, order]);

    const formatDateTime = (date?: string) => {
        if (!date) return '-';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        return `${year}.${month}.${day} ${hour}:${minute}`;
    };

    if (loading) {
        return (
            <div className="order-page b2b-theme" style={{ maxWidth: '100%', boxShadow: 'none', background: '#FFFFFF' }}>
                <div className="order-loading">주문 정보를 불러오는 중...</div>
            </div>
        );
    }

    if (error || (!order && !condolenceOrder)) {
        return (
            <div className="order-page b2b-theme" style={{ maxWidth: '100%', boxShadow: 'none', background: '#FFFFFF' }}>
                <div className="order-body" style={{ textAlign: 'center', paddingTop: '120px', paddingLeft: '24px', paddingRight: '24px', background: '#FFFFFF', minHeight: '100vh' }}>
                    <span style={{ fontSize: '64px' }}>😔</span>
                    <h2 style={{ marginTop: '24px', fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>주문을 찾을 수 없습니다</h2>
                    <p style={{ color: '#888', marginTop: '10px', fontSize: '14px', lineHeight: '1.5' }}>{error || '주문 정보가 존재하지 않거나 만료되었습니다.'}</p>
                    <Link href="/b2b/dashboard" className="btn-payment" style={{ marginTop: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: '#3A8F47', color: '#FFFFFF', fontWeight: '600', height: '52px', borderRadius: '12px' }}>
                        대시보드로
                    </Link>
                </div>
            </div>
        );
    }

    // ===== 부의금 완료 화면 =====
    if (isCondolence && condolenceOrder) {
        return (
            <div className="order-page b2b-theme" style={{ maxWidth: '100%', boxShadow: 'none', background: '#FFFFFF' }}>
                <header className="order-header" style={{ justifyContent: 'center' }}>
                    <h1>결제 완료</h1>
                </header>

                <div className="order-body complete-body">
                    <div className="complete-banner">
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #4A7C59, #5a9a6a)', // 부고온/마음부고 공통 초록 그라데이션
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

    const paymentText: Record<string, string> = {
        'card': '신용/체크카드',
        'easy': '간편결제',
        'virtual': '가상계좌',
    };

    if (!order) return null;

    // ===== 화환 완료 화면 =====
    return (
        <div className="order-page b2b-theme" style={{ maxWidth: '100%', boxShadow: 'none', background: '#FFFFFF' }}>
            <header className="order-header" style={{ justifyContent: 'center' }}>
                <h1>주문완료</h1>
            </header>

            <div className="order-body complete-body">
                {/* 완료 메시지 */}
                <div className="complete-banner">
                    {/* 부고온 초록색 체크박스 아이콘 적용 (#3A8F47) */}
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="#3A8F47" style={{ marginBottom: '20px' }}>
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
