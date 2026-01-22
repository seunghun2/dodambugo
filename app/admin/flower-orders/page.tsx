'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface FlowerOrder {
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
    payment_method: string;
    status: string;
    created_at: string;
    bugo?: {
        deceased_name: string;
        bugo_number: string;
    };
}

export default function AdminFlowerOrdersPage() {
    const [orders, setOrders] = useState<FlowerOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<FlowerOrder | null>(null);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/flower-orders');
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const response = await fetch('/api/flower-orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (response.ok) {
                fetchOrders();
                if (selectedOrder?.id === id) {
                    setSelectedOrder({ ...selectedOrder, status: newStatus });
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/\. /g, '.').replace('.', '');
    };

    const formatPrice = (price: number) => {
        return price?.toLocaleString() + '원';
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return '주문접수';
            case 'confirmed': return '주문확인';
            case 'preparing': return '제작중';
            case 'delivering': return '배송중';
            case 'delivered': return '배송완료';
            case 'cancelled': return '취소';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'confirmed': return '#3b82f6';
            case 'preparing': return '#8b5cf6';
            case 'delivering': return '#10b981';
            case 'delivered': return '#6b7280';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const filteredOrders = statusFilter
        ? orders.filter(o => o.status === statusFilter)
        : orders;

    return (
        <div className="admin-pc">
            <AdminSidebar />

            {/* 메인 콘텐츠 */}
            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>화환 주문 관리</h1>
                    <div className="header-actions">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        >
                            <option value="">전체 상태</option>
                            <option value="pending">주문접수</option>
                            <option value="confirmed">주문확인</option>
                            <option value="preparing">제작중</option>
                            <option value="delivering">배송중</option>
                            <option value="delivered">배송완료</option>
                            <option value="cancelled">취소</option>
                        </select>
                        <span className="total-count">총 {filteredOrders.length}건</span>
                        <button onClick={fetchOrders} className="btn-refresh">
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">
                    {/* 주문 목록 */}
                    <div className="inquiry-panel wide">
                        <div className="panel-header">
                            <span>화환 주문 ({filteredOrders.length})</span>
                        </div>

                        {loading ? (
                            <div className="panel-loading">
                                <span className="material-symbols-outlined spinning">progress_activity</span>
                                불러오는 중...
                            </div>
                        ) : (
                            <div className="inquiry-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>주문번호</th>
                                            <th>상품명</th>
                                            <th>금액</th>
                                            <th>보내는분</th>
                                            <th>장례식장</th>
                                            <th>상태</th>
                                            <th>주문일시</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                    주문이 없습니다
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrders.map((order) => (
                                                <tr
                                                    key={order.id}
                                                    className={selectedOrder?.id === order.id ? 'selected' : ''}
                                                    onClick={() => setSelectedOrder(order)}
                                                >
                                                    <td className="order-num">{order.order_number}</td>
                                                    <td>{order.product_name}</td>
                                                    <td className="number-cell">{formatPrice(order.product_price)}</td>
                                                    <td>{order.sender_name}</td>
                                                    <td className="name-cell">{order.funeral_home}</td>
                                                    <td>
                                                        <span
                                                            className="status-badge"
                                                            style={{
                                                                background: getStatusColor(order.status) + '20',
                                                                color: getStatusColor(order.status),
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            {getStatusLabel(order.status)}
                                                        </span>
                                                    </td>
                                                    <td className="date-cell">{formatDate(order.created_at)}</td>
                                                    <td className="arrow-cell">
                                                        <span className="material-symbols-outlined">chevron_right</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 주문 상세 패널 */}
                    <div className="detail-panel">
                        {selectedOrder ? (
                            <>
                                <div className="panel-header">
                                    <span>주문 상세</span>
                                    <button onClick={() => setSelectedOrder(null)} className="btn-close">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="detail-content">
                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>주문번호</label>
                                            <span className="bugo-num">{selectedOrder.order_number}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>상태</label>
                                            <select
                                                value={selectedOrder.status}
                                                onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #e2e8f0',
                                                    background: getStatusColor(selectedOrder.status) + '20',
                                                    color: getStatusColor(selectedOrder.status),
                                                    fontWeight: 600
                                                }}
                                            >
                                                <option value="pending">주문접수</option>
                                                <option value="confirmed">주문확인</option>
                                                <option value="preparing">제작중</option>
                                                <option value="delivering">배송중</option>
                                                <option value="delivered">배송완료</option>
                                                <option value="cancelled">취소</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>상품</label>
                                            <span>{selectedOrder.product_name}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>금액</label>
                                            <span style={{ fontWeight: 700 }}>{formatPrice(selectedOrder.product_price)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>결제방식</label>
                                            <span>{selectedOrder.payment_method === 'card' ? '신용카드' : selectedOrder.payment_method}</span>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>보내는 분</label>
                                            <span>{selectedOrder.sender_name}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>연락처</label>
                                            <span>{selectedOrder.sender_phone}</span>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>받는 분</label>
                                            <span>{selectedOrder.recipient_name}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>장례식장</label>
                                            <span>{selectedOrder.funeral_home} {selectedOrder.room}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>주소</label>
                                            <span>{selectedOrder.address}</span>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <label>리본 문구</label>
                                        <div className="message-box">
                                            <div>{selectedOrder.ribbon_text2}</div>
                                            <div style={{ color: '#64748b', marginTop: '4px' }}>{selectedOrder.ribbon_text1}</div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>주문일시</label>
                                            <span>{formatDate(selectedOrder.created_at)}</span>
                                        </div>
                                    </div>

                                    {selectedOrder.bugo && (
                                        <div className="detail-actions">
                                            <Link
                                                href={`/view/${selectedOrder.bugo.bugo_number}`}
                                                target="_blank"
                                                className="btn-action primary"
                                            >
                                                <span className="material-symbols-outlined">visibility</span>
                                                부고장 보기
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="panel-empty">
                                <span className="material-symbols-outlined">local_florist</span>
                                <p>주문을 선택하세요</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
