'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface GiftOrderRecipient {
    id: string;
    order_id: string;
    name: string | null;
    phone: string;
    source: string;
    coupon_ref: string | null;
    send_status: string;
    sent_at: string | null;
    error: string | null;
}

interface GiftOrder {
    id: string;
    order_number: string;
    bugo_id: string | null;
    bugo_number: string;
    buyer_name: string | null;
    buyer_phone?: string | null;
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    total_amount: number;
    card_id: string;
    message: string;
    status: string;
    is_test: boolean;
    payment_method?: string | null;
    cancelled_at?: string | null;
    cancel_reason?: string | null;
    created_at: string;
    updated_at: string | null;
    recipients: GiftOrderRecipient[];
}

export default function AdminGiftOrdersPage() {
    const [orders, setOrders] = useState<GiftOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<GiftOrder | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchOrders = async (keepId?: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/gift-orders', { cache: 'no-store' });
            const json = await res.json();
            const list: GiftOrder[] = json.orders || [];
            setOrders(list);
            const targetId = keepId || selectedOrder?.id;
            if (targetId) {
                const updated = list.find((o) => o.id === targetId) || null;
                setSelectedOrder(updated);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid':
                return '발송대기 (1시간유예)';
            case 'test_paid':
                return '발송대기 (테스트·1시간유예)';
            case 'sending':
                return '발송중';
            case 'sent':
                return '발송완료';
            case 'partial':
            case 'partially_sent':
                return '일부실패';
            case 'failed':
                return '발송실패';
            case 'cancelled':
                return '주문취소';
            case 'pending':
                return '결제대기';
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
            case 'test_paid':
            case 'sending':
                return '#2563eb';
            case 'sent':
                return '#10b981';
            case 'partial':
            case 'partially_sent':
                return '#f59e0b';
            case 'failed':
                return '#ef4444';
            case 'cancelled':
                return '#6b7280';
            default:
                return '#64748b';
        }
    };

    const getRecipientStatusLabel = (st: string) => {
        switch (st) {
            case 'pending':
                return '대기 (1시간유예)';
            case 'sent':
                return '발송완료';
            case 'failed':
                return '실패/취소';
            case 'cancelled':
                return '취소됨';
            default:
                return st;
        }
    };

    const getSourceLabel = (src: string) => {
        switch (src) {
            case 'condolence':
                return '부의금';
            case 'flower':
                return '화환';
            case 'manual':
                return '직접입력';
            case 'excel':
                return '엑셀';
            case 'contact':
                return '연락처';
            default:
                return src;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date
            .toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            })
            .replace(/\. /g, '.')
            .replace('.', '');
    };

    const formatPhoneDisplay = (p: string) => {
        const d = (p || '').replace(/\D/g, '');
        if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
        if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
        return p;
    };

    const handleDispatchOrder = async (order: GiftOrder) => {
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/gift-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'dispatch', orderId: order.id }),
            });
            const json = await res.json();
            if (!res.ok || !json.ok) {
                alert(json.error || '발송 처리에 실패했습니다.');
            } else {
                await fetchOrders(order.id);
            }
        } catch (e: any) {
            alert(e?.message || '발송 처리 중 오류');
        } finally {
            setProcessing(false);
        }
    };

    const handleDispatchDue = async () => {
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/gift-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'dispatch-due' }),
            });
            const json = await res.json();
            if (!res.ok || !json.ok) {
                alert(json.error || '일괄 발송에 실패했습니다.');
            } else {
                await fetchOrders(selectedOrder?.id);
            }
        } catch (e: any) {
            alert(e?.message || '일괄 발송 중 오류');
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelOrder = async (order: GiftOrder) => {
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/gift-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel', orderId: order.id, reason: '관리자 주문 취소' }),
            });
            const json = await res.json();
            if (!res.ok || !json.ok) {
                alert(json.error || '취소 처리에 실패했습니다.');
            } else {
                await fetchOrders(order.id);
            }
        } catch (e: any) {
            alert(e?.message || '취소 처리 중 오류');
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteOrder = async (order: GiftOrder) => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/admin/gift-orders?id=${encodeURIComponent(order.id)}`, {
                method: 'DELETE',
            });
            const json = await res.json();
            if (!res.ok || !json.ok) {
                alert(json.error || '삭제에 실패했습니다.');
            } else {
                setSelectedOrder(null);
                await fetchOrders();
            }
        } catch (e: any) {
            alert(e?.message || '삭제 중 오류');
        } finally {
            setProcessing(false);
        }
    };

    // 기본 목록에서는 결제창만 띄우고 이탈한 미결제(pending) 건을 제외해 실결제/취소/발송 건만 표시
    const filteredOrders = statusFilter
        ? orders.filter((o) =>
              statusFilter === 'waiting'
                  ? o.status === 'paid' || o.status === 'test_paid'
                  : o.status === statusFilter,
          )
        : orders.filter((o) => o.status !== 'pending');

    return (
        <div className="admin-pc">
            <AdminSidebar />

            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>답례품 주문 관리</h1>
                    <div className="header-actions">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        >
                            <option value="">전체 상태</option>
                            <option value="waiting">발송대기 (1시간 유예)</option>
                            <option value="sent">발송완료</option>
                            <option value="partial">일부실패</option>
                            <option value="failed">발송실패</option>
                            <option value="cancelled">주문취소</option>
                        </select>
                        <span className="total-count">총 {filteredOrders.length}건</span>
                        <button
                            onClick={handleDispatchDue}
                            disabled={processing}
                            className="btn-refresh"
                            style={{ background: '#1e293b', color: '#fff', borderColor: '#1e293b' }}
                        >
                            <span className="material-symbols-outlined">send</span>
                            1시간경과 일괄발송
                        </button>
                        <button onClick={() => fetchOrders()} className="btn-refresh" disabled={processing}>
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                <div className="admin-content-area">
                    {/* 좌측 주문 목록 */}
                    <div className="inquiry-panel wide">
                        <div className="panel-header">
                            <span>답례품 주문 ({filteredOrders.length})</span>
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
                                            <th>부고번호</th>
                                            <th>상품명</th>
                                            <th>수신자</th>
                                            <th>결제금액</th>
                                            <th>발신 상주</th>
                                            <th>상태</th>
                                            <th>주문일시</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                    답례품 주문 내역이 없습니다
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
                                                    <td>#{order.bugo_number}</td>
                                                    <td className="name-cell">{order.product_name}</td>
                                                    <td className="number-cell">{order.quantity}명</td>
                                                    <td className="number-cell">{order.total_amount?.toLocaleString()}원</td>
                                                    <td>{order.buyer_name || '상주'}</td>
                                                    <td>
                                                        <span
                                                            className="status-badge"
                                                            style={{
                                                                background: getStatusColor(order.status) + '20',
                                                                color: getStatusColor(order.status),
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
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

                    {/* 우측 주문 상세 패널 */}
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
                                            <span className="bugo-num">
                                                {selectedOrder.order_number}{' '}
                                                <a
                                                    href={`/order/${selectedOrder.order_number}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: '11px', color: '#2563eb', marginLeft: '6px', textDecoration: 'underline' }}
                                                >
                                                    주문내역 보기 ↗
                                                </a>
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <label>상태</label>
                                            <span
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '4px',
                                                    background: getStatusColor(selectedOrder.status) + '20',
                                                    color: getStatusColor(selectedOrder.status),
                                                    fontWeight: 700,
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {getStatusLabel(selectedOrder.status)}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <label>부고번호</label>
                                            <span>#{selectedOrder.bugo_number}</span>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>답례품 상품</label>
                                            <span style={{ fontWeight: 600 }}>{selectedOrder.product_name}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>단가 × 수량</label>
                                            <span>
                                                {selectedOrder.unit_price?.toLocaleString()}원 × {selectedOrder.quantity}명
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <label>총 결제금액</label>
                                            <span style={{ fontWeight: 700, color: '#2563eb' }}>
                                                {selectedOrder.total_amount?.toLocaleString()}원
                                            </span>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>발신 상주</label>
                                            <span>
                                                {selectedOrder.buyer_name || '상주'}
                                                {selectedOrder.buyer_phone
                                                    ? ` (${formatPhoneDisplay(selectedOrder.buyer_phone)})`
                                                    : ''}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <label>결제수단</label>
                                            <span>{selectedOrder.payment_method || (selectedOrder.is_test ? '테스트결제' : '-')}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>주문일시</label>
                                            <span>{formatDate(selectedOrder.created_at)}</span>
                                        </div>
                                        {selectedOrder.cancelled_at && (
                                            <div className="detail-row">
                                                <label>취소일시</label>
                                                <span style={{ color: '#dc2626', fontWeight: 600 }}>
                                                    {formatDate(selectedOrder.cancelled_at)}
                                                </span>
                                            </div>
                                        )}
                                        {selectedOrder.cancel_reason && (
                                            <div className="detail-row">
                                                <label>취소사유</label>
                                                <span style={{ color: '#dc2626' }}>{selectedOrder.cancel_reason}</span>
                                            </div>
                                        )}
                                        {selectedOrder.updated_at && !selectedOrder.cancelled_at && (
                                            <div className="detail-row">
                                                <label>최근처리</label>
                                                <span>{formatDate(selectedOrder.updated_at)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="detail-section">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                                            감사장 문구 (LMS + 모바일 쿠폰 2건 동시 발송)
                                        </label>
                                        <div
                                            className="message-box"
                                            style={{
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '6px',
                                                padding: '10px 12px',
                                                fontSize: '12px',
                                                lineHeight: 1.5,
                                                whiteSpace: 'pre-wrap',
                                                color: '#334155',
                                            }}
                                        >
                                            {selectedOrder.message}
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '8px' }}>
                                            발송 및 주문 제어
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {(selectedOrder.status === 'paid' ||
                                                selectedOrder.status === 'test_paid' ||
                                                selectedOrder.status === 'partial' ||
                                                selectedOrder.status === 'partially_sent' ||
                                                selectedOrder.status === 'failed') && (
                                                <button
                                                    type="button"
                                                    disabled={processing}
                                                    onClick={() => handleDispatchOrder(selectedOrder)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '9px 12px',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        background: '#2563eb',
                                                        color: '#fff',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    즉시 발송 (병렬)
                                                </button>
                                            )}
                                            {(selectedOrder.status === 'paid' ||
                                                selectedOrder.status === 'test_paid' ||
                                                selectedOrder.status === 'failed') && (
                                                <button
                                                    type="button"
                                                    disabled={processing}
                                                    onClick={() => handleCancelOrder(selectedOrder)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '9px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #fecaca',
                                                        background: '#fef2f2',
                                                        color: '#dc2626',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    발송 전 주문 취소
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                disabled={processing}
                                                onClick={() => handleDeleteOrder(selectedOrder)}
                                                style={{
                                                    padding: '9px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e2e8f0',
                                                    background: '#fff',
                                                    color: '#64748b',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                내역 삭제
                                            </button>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '8px' }}>
                                            수신자 목록 ({selectedOrder.recipients?.length || 0}명)
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {(selectedOrder.recipients || []).map((r) => (
                                                <div
                                                    key={r.id}
                                                    style={{
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '6px',
                                                        padding: '8px 10px',
                                                        background: '#fff',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <strong style={{ color: '#1e293b' }}>{r.name || '이름없음'}</strong>{' '}
                                                            <span style={{ color: '#64748b' }}>({formatPhoneDisplay(r.phone)})</span>{' '}
                                                            <span
                                                                style={{
                                                                    fontSize: '11px',
                                                                    padding: '1px 5px',
                                                                    borderRadius: '3px',
                                                                    background: '#f1f5f9',
                                                                    color: '#475569',
                                                                }}
                                                            >
                                                                {getSourceLabel(r.source)}
                                                            </span>
                                                        </div>
                                                        <span
                                                            style={{
                                                                fontSize: '11px',
                                                                fontWeight: 600,
                                                                color:
                                                                    r.send_status === 'sent'
                                                                        ? '#10b981'
                                                                        : r.send_status === 'failed'
                                                                          ? '#ef4444'
                                                                          : r.send_status === 'cancelled'
                                                                            ? '#6b7280'
                                                                            : '#2563eb',
                                                            }}
                                                        >
                                                            {getRecipientStatusLabel(r.send_status)}
                                                        </span>
                                                    </div>
                                                    {r.coupon_ref && (
                                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                                            쿠폰번호: {r.coupon_ref}
                                                        </div>
                                                    )}
                                                    {r.error && (
                                                        <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                                                            사유: {r.error}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="panel-empty">
                                <span className="material-symbols-outlined">touch_app</span>
                                <p>주문을 선택하면 상세 정보와 수신자 발송 내역이 표시됩니다</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
