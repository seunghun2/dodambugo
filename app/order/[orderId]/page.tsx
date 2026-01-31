'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import './order-detail.css';

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
    status: string;
    payment_method: string;
    created_at: string;
    bugo_id: string;
}

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) {
        return (
            <div className="order-detail-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>주문 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="order-detail-container">
                <div className="error-state">
                    <span className="error-icon">😔</span>
                    <h2>주문을 찾을 수 없습니다</h2>
                    <p>{error}</p>
                    <Link href="/" className="btn-home">홈으로</Link>
                </div>
            </div>
        );
    }

    // 상태 한글 변환
    const statusText: Record<string, string> = {
        'pending': '결제 대기',
        'completed': '결제 완료',
        'cancelled': '취소됨',
        'delivered': '배송 완료',
    };

    // 결제방법 한글 변환
    const paymentText: Record<string, string> = {
        'card': '신용카드',
        'easy': '간편결제',
        'virtual': '가상계좌',
    };

    return (
        <div className="order-detail-container">
            {/* 헤더 */}
            <header className="order-header">
                <h1>주문 상세</h1>
            </header>

            {/* 주문 상태 배너 */}
            <section className="status-banner">
                <div className="status-icon">✓</div>
                <h2>
                    {order.status === 'completed' ? '결제가 완료되었습니다' :
                        order.status === 'delivered' ? '배송이 완료되었습니다' :
                            order.status === 'cancelled' ? '주문이 취소되었습니다' :
                                '결제 대기 중입니다'}
                </h2>
            </section>

            {/* 주문 정보 */}
            <section className="order-section">
                <h3 className="section-title">주문 정보</h3>
                <div className="info-row">
                    <span className="label">주문번호</span>
                    <span className="value">{order.order_number}</span>
                </div>
                <div className="info-row">
                    <span className="label">주문일시</span>
                    <span className="value">
                        {new Date(order.created_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
                <div className="info-row">
                    <span className="label">결제상태</span>
                    <span className={`value status-${order.status}`}>
                        {statusText[order.status] || order.status}
                    </span>
                </div>
                <div className="info-row">
                    <span className="label">결제방법</span>
                    <span className="value">{paymentText[order.payment_method] || order.payment_method}</span>
                </div>
            </section>

            {/* 상품 정보 */}
            <section className="order-section">
                <h3 className="section-title">상품 정보</h3>
                <div className="info-row">
                    <span className="label">상품명</span>
                    <span className="value">{order.product_name}</span>
                </div>
                <div className="info-row total">
                    <span className="label">결제금액</span>
                    <span className="value price">{order.product_price?.toLocaleString()}원</span>
                </div>
            </section>

            {/* 보내시는 분 */}
            <section className="order-section">
                <h3 className="section-title">보내시는 분</h3>
                <div className="info-row">
                    <span className="label">성함</span>
                    <span className="value">{order.sender_name}</span>
                </div>
                <div className="info-row">
                    <span className="label">연락처</span>
                    <span className="value">{order.sender_phone}</span>
                </div>
            </section>

            {/* 배송지 */}
            <section className="order-section">
                <h3 className="section-title">배송 정보</h3>
                <div className="info-row">
                    <span className="label">받는분</span>
                    <span className="value">{order.recipient_name} 상주님</span>
                </div>
                <div className="info-row">
                    <span className="label">장례식장</span>
                    <span className="value">{order.funeral_home}</span>
                </div>
                {order.room && (
                    <div className="info-row">
                        <span className="label">빈소</span>
                        <span className="value">{order.room}</span>
                    </div>
                )}
            </section>

            {/* 하단 버튼 */}
            <div className="order-footer">
                {order.bugo_id && (
                    <Link href={`/view/${order.bugo_id}`} className="btn-bugo">
                        부고 페이지로 돌아가기
                    </Link>
                )}
            </div>
        </div>
    );
}
