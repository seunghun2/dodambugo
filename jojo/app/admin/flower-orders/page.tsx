'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/lib/supabase';

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
    const [cancelling, setCancelling] = useState(false);
    const [sendingDelivery, setSendingDelivery] = useState(false);
    const [notifyLogs, setNotifyLogs] = useState<{ time: string; message: string; type: 'success' | 'error' }[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [products, setProducts] = useState<any[]>([]);
    const [changingProduct, setChangingProduct] = useState(false);
    const itemsPerPage = 50;

    // 로그 추가 함수
    const addNotifyLog = (message: string, type: 'success' | 'error' = 'success') => {
        const now = new Date();
        const time = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setNotifyLogs(prev => [{ time, message, type }, ...prev.slice(0, 9)]); // 최근 10개만 유지
    };

    // 배송중 알림톡 발송
    const sendDeliveringNotify = async (order: FlowerOrder) => {
        if (!confirm(`"${order.sender_name}"님께 배송중 알림톡을 발송하시겠습니까?`)) {
            return;
        }

        setSendingDelivery(true);
        try {
            const response = await fetch('/api/flower-orders/delivery-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    type: 'delivering'
                }),
            });
            const result = await response.json();

            if (response.ok) {
                addNotifyLog(`[배송중] ${order.sender_name}님께 알림톡 발송 완료`, 'success');
                // 상태도 업데이트
                await updateStatus(order.id, 'delivering');
                fetchOrders();
            } else {
                addNotifyLog(`[배송중] 발송 실패: ${result.error}`, 'error');
            }
        } catch (err) {
            console.error(err);
            addNotifyLog(`[배송중] 발송 오류`, 'error');
        }
        setSendingDelivery(false);
    };

    // 배송완료 알림톡 발송
    const sendDeliveredNotify = async (order: FlowerOrder) => {
        if (!confirm(`"${order.sender_name}"님께 배송완료 알림톡을 발송하시겠습니까?`)) {
            return;
        }

        setSendingDelivery(true);
        try {
            const response = await fetch('/api/flower-orders/delivery-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    type: 'delivered'
                }),
            });
            const result = await response.json();

            if (response.ok) {
                addNotifyLog(`[배송완료] ${order.sender_name}님께 알림톡 발송 완료`, 'success');
                // 상태도 업데이트
                await updateStatus(order.id, 'delivered');
                fetchOrders();
            } else {
                addNotifyLog(`[배송완료] 발송 실패: ${result.error}`, 'error');
            }
        } catch (err) {
            console.error(err);
            addNotifyLog(`[배송완료] 발송 오류`, 'error');
        }
        setSendingDelivery(false);
    };

    useEffect(() => {
        fetchOrders();
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('flower_products')
            .select('id, name, price, discount_price, category, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        if (!error && data) {
            setProducts(data);
        }
    };

    // 상품 변경 함수
    const updateProduct = async (orderId: string, productName: string, productPrice: number) => {
        setChangingProduct(true);
        try {
            const response = await fetch('/api/flower-orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, product_name: productName, product_price: productPrice }),
            });
            if (response.ok) {
                addNotifyLog(`상품 변경: ${productName} (${productPrice.toLocaleString()}원)`, 'success');
                fetchOrders();
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, product_name: productName, product_price: productPrice });
                }
            } else {
                addNotifyLog('상품 변경 실패', 'error');
            }
        } catch (err) {
            console.error(err);
            addNotifyLog('상품 변경 오류', 'error');
        }
        setChangingProduct(false);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

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

    // 주문 취소 (INNOPAY + DB + 알림)
    const cancelOrder = async (order: FlowerOrder) => {
        const reason = prompt('취소 사유를 입력해주세요:');
        if (reason === null) return; // 취소 버튼

        if (!confirm(`정말 "${order.product_name}" 주문을 취소하시겠습니까?\n\n취소 시 결제금액이 환불됩니다.`)) {
            return;
        }

        setCancelling(true);
        try {
            const response = await fetch('/api/flower-orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, cancelReason: reason }),
            });
            const result = await response.json();

            if (response.ok) {
                alert('주문이 취소되었습니다.');
                fetchOrders();
                setSelectedOrder(null);
            } else {
                alert(`취소 실패: ${result.error}`);
            }
        } catch (err) {
            console.error(err);
            alert('취소 처리 중 오류가 발생했습니다.');
        }
        setCancelling(false);
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

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
                                        {paginatedOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                    주문이 없습니다
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedOrders.map((order) => (
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
                                {/* 페이지네이션 */}
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="page-btn"
                                        >
                                            ←
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="page-btn"
                                        >
                                            →
                                        </button>
                                        <span className="page-info">
                                            총 {filteredOrders.length}개
                                        </span>
                                    </div>
                                )}
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
                                            <select
                                                value={selectedOrder.product_name}
                                                onChange={(e) => {
                                                    const selected = products.find(p => p.name === e.target.value);
                                                    if (selected && selected.name !== selectedOrder.product_name) {
                                                        if (confirm(`상품을 "${selected.name}"(${selected.price.toLocaleString()}원)으로 변경하시겠습니까?\n\n※ 변경 후 알림톡 발송 시 변경된 상품명으로 발송됩니다.`)) {
                                                            updateProduct(selectedOrder.id, selected.name, selected.price);
                                                        }
                                                    }
                                                }}
                                                disabled={changingProduct || selectedOrder.status === 'cancelled'}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #cbd5e1',
                                                    background: '#1e293b',
                                                    color: '#f1f5f9',
                                                    fontWeight: 500,
                                                    fontSize: '14px',
                                                    cursor: selectedOrder.status === 'cancelled' ? 'not-allowed' : 'pointer',
                                                    maxWidth: '200px',
                                                    outline: 'none'
                                                }}
                                            >
                                                {!products.find(p => p.name === selectedOrder.product_name) && (
                                                    <option value={selectedOrder.product_name}>{selectedOrder.product_name}</option>
                                                )}
                                                {products.map(p => (
                                                    <option key={p.id} value={p.name}>
                                                        {p.name} ({p.price.toLocaleString()}원)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="detail-row">
                                            <label>금액</label>
                                            <span style={{ fontWeight: 700 }}>{formatPrice(selectedOrder.product_price)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>결제방식</label>
                                            <span>{
                                                selectedOrder.payment_method === 'card' ? '신용카드' :
                                                    selectedOrder.payment_method === 'easy' ? '간편결제' :
                                                        selectedOrder.payment_method === 'virtual' ? '가상계좌' :
                                                            selectedOrder.payment_method === 'bank' ? '계좌이체' :
                                                                selectedOrder.payment_method || '미정'
                                            }</span>
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

                                    <div className="detail-actions">
                                        {selectedOrder.bugo && (
                                            <Link
                                                href={`/view/${selectedOrder.bugo.bugo_number}`}
                                                target="_blank"
                                                className="btn-action primary"
                                            >
                                                <span className="material-symbols-outlined">visibility</span>
                                                부고장 보기
                                            </Link>
                                        )}
                                        {/* 알림톡 버튼 섹션 */}
                                        <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '16px' }}>
                                            <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>알림톡 발송</div>

                                            {/* 첫번째 줄: 배송중 / 배송완료 */}
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                <button
                                                    onClick={() => sendDeliveringNotify(selectedOrder)}
                                                    disabled={sendingDelivery}
                                                    style={{
                                                        flex: 1,
                                                        background: '#dbeafe',
                                                        color: '#2563eb',
                                                        border: 'none',
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        cursor: sendingDelivery ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        fontWeight: 600,
                                                        fontSize: '13px',
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>local_shipping</span>
                                                    배송중 알림
                                                </button>
                                                <button
                                                    onClick={() => sendDeliveredNotify(selectedOrder)}
                                                    disabled={sendingDelivery}
                                                    style={{
                                                        flex: 1,
                                                        background: '#dcfce7',
                                                        color: '#16a34a',
                                                        border: 'none',
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        cursor: sendingDelivery ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        fontWeight: 600,
                                                        fontSize: '13px',
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                                                    배송완료
                                                </button>
                                            </div>

                                            {/* 두번째 줄: 주문취소 */}
                                            <button
                                                onClick={() => cancelOrder(selectedOrder)}
                                                disabled={cancelling || selectedOrder.status === 'cancelled'}
                                                style={{
                                                    width: '100%',
                                                    background: selectedOrder.status === 'cancelled' ? '#555' : '#fee2e2',
                                                    color: selectedOrder.status === 'cancelled' ? '#888' : '#dc2626',
                                                    border: 'none',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    cursor: (cancelling || selectedOrder.status === 'cancelled') ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    fontWeight: 600,
                                                    fontSize: '13px',
                                                }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
                                                {cancelling ? '취소 중...' : selectedOrder.status === 'cancelled' ? '취소됨' : '주문 취소'}
                                            </button>
                                        </div>

                                        {/* 알림톡 발송 로그 */}
                                        {notifyLogs.length > 0 && (
                                            <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '16px' }}>
                                                <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>발송 로그</div>
                                                <div style={{
                                                    background: '#1a1a1a',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    maxHeight: '150px',
                                                    overflowY: 'auto',
                                                    fontSize: '12px',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    {notifyLogs.map((log, idx) => (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                color: log.type === 'success' ? '#22c55e' : '#ef4444',
                                                                marginBottom: idx < notifyLogs.length - 1 ? '6px' : 0
                                                            }}
                                                        >
                                                            <span style={{ color: '#888' }}>{log.time}</span> {log.message}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
