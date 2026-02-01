'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
    tid: string;
}

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isExpanded, setIsExpanded] = useState({
        productInfo: false,
        refund: false,
        withdrawal: false,
    });

    useEffect(() => {
        async function fetchOrder() {
            try {
                const res = await fetch(`/api/flower-orders/${orderId}`);
                if (!res.ok) {
                    throw new Error('주문을 찾을 수 없습니다.');
                }
                const data = await res.json();
                setOrder(data);
            } catch (err: any) {
                setError(err.message || '주문 정보를 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        }

        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    // 날짜 포맷 함수
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
            <div className="order-page">
                <div className="order-loading">주문 정보를 불러오는 중...</div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="order-page">
                <div className="order-body" style={{ textAlign: 'center', paddingTop: '100px' }}>
                    <span style={{ fontSize: '64px' }}>😔</span>
                    <h2 style={{ marginTop: '20px' }}>주문을 찾을 수 없습니다</h2>
                    <p style={{ color: '#888', marginTop: '10px' }}>{error}</p>
                    <Link href="/" className="btn-payment" style={{ marginTop: '30px', display: 'inline-block', textDecoration: 'none' }}>
                        홈으로
                    </Link>
                </div>
            </div>
        );
    }

    // 결제방법 한글 변환
    const paymentText: Record<string, string> = {
        'card': '신용/체크카드',
        'easy': '간편결제',
        'virtual': '가상계좌',
    };

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
                        href={`/view/${order.bugo_id}`}
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
