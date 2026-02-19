'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { gaEvents } from '@/components/GoogleAnalytics';
import '../[productId]/order.css';

export default function OrderCompletePage() {
    const params = useParams();
    const router = useRouter();
    const bugoId = params.id as string;

    const [orderData, setOrderData] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [isExpanded, setIsExpanded] = useState({
        productInfo: false,
        refund: false,
        withdrawal: false,
    });

    useEffect(() => {
        async function fetchOrderData() {
            // sessionStorage에서 주문 정보 가져오기 (order_bugoId_productId 형식)
            const storedPayment = sessionStorage.getItem(`payment_${bugoId}`);

            // order 키 찾기
            let orderKey = '';
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith(`order_${bugoId}_`)) {
                    orderKey = key;
                    break;
                }
            }

            const storedOrder = orderKey ? sessionStorage.getItem(orderKey) : null;

            // 날짜 포맷 함수
            const formatDateTime = (date?: string) => {
                const d = date ? new Date(date) : new Date();
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hour = String(d.getHours()).padStart(2, '0');
                const minute = String(d.getMinutes()).padStart(2, '0');
                return `${year}.${month}.${day} ${hour}:${minute}`;
            };

            // DB에서 최신 주문 정보 가져오기
            try {
                const response = await fetch(`/api/flower-orders?bugo_id=${bugoId}&limit=1`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.orders && result.orders.length > 0) {
                        const latestOrder = result.orders[0];
                        setOrderData({
                            senderName: latestOrder.sender_name,
                            senderPhone: latestOrder.sender_phone,
                            productName: latestOrder.product_name,
                            productPrice: latestOrder.amount,
                            recipientName: latestOrder.recipient_name,
                            funeralHome: latestOrder.funeral_home,
                            room: latestOrder.room || '',
                            address: latestOrder.address || '',
                            ribbonText: latestOrder.ribbon_text,
                            ribbonText1: latestOrder.ribbon_text,
                            ribbonText2: latestOrder.ribbon_from,
                            orderNumber: latestOrder.order_number || `MG${latestOrder.id}`,
                            orderDate: formatDateTime(latestOrder.approved_at || latestOrder.created_at),
                            receiptUrl: latestOrder.receipt_url,
                        });
                        gaEvents.completeFlowerOrder(latestOrder.order_number || `MG${latestOrder.id}`, latestOrder.amount || 0);
                        return;
                    }
                }
            } catch (error) {
                console.error('주문 정보 조회 실패:', error);
            }

            // sessionStorage 데이터 사용 (폴백)
            if (storedOrder && storedPayment) {
                const order = JSON.parse(storedOrder);
                const payment = JSON.parse(storedPayment);

                setOrderData({
                    ...order,
                    senderName: payment.senderName,
                    senderPhone: payment.senderPhone,
                    receiptUrl: payment.receiptUrl,
                    orderNumber: payment.orderNumber || `MG${Date.now()}`,
                    orderDate: formatDateTime(),
                });
            } else {
                // 데모용 기본 데이터
                setOrderData({
                    senderName: '테스트',
                    senderPhone: '010-1234-5678',
                    productName: '근조 3단 화환',
                    productPrice: 150000,
                    recipientName: '홍길동',
                    funeralHome: '서울대학교병원장례식장',
                    room: '1호실',
                    address: '서울시 강남구 테헤란로',
                    ribbonText: '삼가 고인의 명복을 빕니다',
                    orderNumber: `MG${Date.now()}`,
                    orderDate: formatDateTime(),
                });
            }
        }

        fetchOrderData();
    }, [bugoId]);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!orderData) {
        return (
            <div className="order-page">
                <div className="order-loading">주문 정보를 불러오는 중...</div>
            </div>
        );
    }

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
                        <span className="value">{orderData.senderName} / {orderData.senderPhone}</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">수령자 정보</span>
                        <div className="value">
                            <div>{orderData.recipientName}</div>
                            <div className="sub-text">{orderData.funeralHome} {orderData.room}</div>
                            <div className="sub-text">{orderData.address}</div>
                        </div>
                    </div>

                    <div className="detail-row">
                        <span className="label">상품명</span>
                        <span className="value">{orderData.productName}</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">리본 문구</span>
                        <div className="value">
                            <div>{orderData.ribbonText2 || '-'}</div>
                            <div className="sub-text">{orderData.ribbonText1 || orderData.ribbonText || '-'}</div>
                        </div>
                    </div>

                    <div className="detail-row">
                        <span className="label">수량</span>
                        <span className="value">1</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">구매 일시</span>
                        <span className="value">{orderData.orderDate}</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">구매 번호</span>
                        <span className="value">{orderData.orderNumber}</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">구매 금액</span>
                        <span className="value">{orderData.productPrice?.toLocaleString()}원</span>
                    </div>

                    <div className="detail-row total">
                        <span className="label">총 결제 금액</span>
                        <span className="value highlight">{orderData.productPrice?.toLocaleString()}원</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">결제 정보</span>
                        <span className="value">
                            신용/체크카드
                            {orderData.receiptUrl ? (
                                <a href={orderData.receiptUrl} target="_blank" rel="noopener noreferrer" className="receipt-btn" style={{ color: '#1A1A1A' }}>영수증 보기</a>
                            ) : (
                                <button className="receipt-btn" disabled style={{ opacity: 0.5, color: '#AAAAAA' }}>영수증 보기</button>
                            )}
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
                <Link
                    href={`/view/${bugoId}`}
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
            </div>
        </div>
    );
}
