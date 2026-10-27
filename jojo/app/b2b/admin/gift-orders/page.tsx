'use client';

import { useState, useEffect } from 'react';
import { IconRefresh, IconSend, IconX, IconChevronRight } from '@tabler/icons-react';

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

interface B2BGiftOrder {
    id: string;
    order_number: string;
    bugo_id: string | null;
    bugo_number: string;
    deceased_name?: string;
    company_name?: string;
    owner_name?: string;
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

export default function B2BAdminGiftOrdersPage() {
    const [orders, setOrders] = useState<B2BGiftOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<B2BGiftOrder | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchOrders = async (keepId?: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/b2b/admin/gift-orders', { cache: 'no-store' });
            const json = await res.json();
            const list: B2BGiftOrder[] = json.orders || [];
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

    const handleDispatchOrder = async (order: B2BGiftOrder) => {
        setProcessing(true);
        try {
            const res = await fetch('/api/b2b/admin/gift-orders', {
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
            const res = await fetch('/api/b2b/admin/gift-orders', {
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

    const handleCancelOrder = async (order: B2BGiftOrder) => {
        setProcessing(true);
        try {
            const res = await fetch('/api/b2b/admin/gift-orders', {
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

    const handleDeleteOrder = async (order: B2BGiftOrder) => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/b2b/admin/gift-orders?id=${encodeURIComponent(order.id)}`, {
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

    const filteredOrders = statusFilter
        ? orders.filter((o) =>
              statusFilter === 'waiting'
                  ? o.status === 'paid' || o.status === 'test_paid'
                  : o.status === statusFilter,
          )
        : orders.filter((o) => o.status !== 'pending');

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>B2B 답례품 주문 관리</h1>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>부고온 B2B 부고에서 발생한 답례품 주문 및 모바일 쿠폰 발송 내역입니다.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
                    >
                        <option value="">전체 상태</option>
                        <option value="waiting">발송대기 (1시간 유예)</option>
                        <option value="sent">발송완료</option>
                        <option value="partial">일부실패</option>
                        <option value="failed">발송실패</option>
                        <option value="cancelled">주문취소</option>
                    </select>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>총 {filteredOrders.length}건</span>
                    <button
                        type="button"
                        onClick={handleDispatchDue}
                        disabled={processing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#1e293b',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        <IconSend size={15} />
                        1시간경과 일괄발송
                    </button>
                    <button
                        type="button"
                        onClick={() => fetchOrders()}
                        disabled={processing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#fff',
                            color: '#334155',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        <IconRefresh size={15} />
                        새로고침
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 400px' : '1fr', gap: '20px', alignItems: 'start' }}>
                {/* 좌측 주문 목록 */}
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
                        B2B 답례품 주문 ({filteredOrders.length})
                    </div>

                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                            불러오는 중...
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                        <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>주문번호</th>
                                        <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>부고번호</th>
                                        <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>파트너(지도사)</th>
                                        <th style={{ padding: '12px 14px' }}>상품명</th>
                                        <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>수신자</th>
                                        <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>결제금액</th>
                                        <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>발신 상주</th>
                                        <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>상태</th>
                                        <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>주문일시</th>
                                        <th style={{ padding: '12px 10px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                                                B2B 답례품 주문 내역이 없습니다
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <tr
                                                key={order.id}
                                                onClick={() => setSelectedOrder(order)}
                                                style={{
                                                    borderBottom: '1px solid #f1f5f9',
                                                    backgroundColor: selectedOrder?.id === order.id ? '#eff6ff' : '#fff',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                    {order.order_number}
                                                </td>
                                                <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                                                    #{order.bugo_number}
                                                    {order.deceased_name && order.deceased_name !== '-' ? (
                                                        <span style={{ color: '#64748b', marginLeft: '4px' }}>({order.deceased_name})</span>
                                                    ) : null}
                                                </td>
                                                <td style={{ padding: '14px', whiteSpace: 'nowrap', color: '#334155' }}>
                                                    {order.company_name || '개인'} · {order.owner_name || '-'}
                                                </td>
                                                <td style={{ padding: '14px', color: '#0f172a' }}>{order.product_name}</td>
                                                <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>{order.quantity}명</td>
                                                <td style={{ padding: '14px', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                                    {order.total_amount?.toLocaleString()}원
                                                </td>
                                                <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>{order.buyer_name || '상주'}</td>
                                                <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                                                    <span
                                                        style={{
                                                            background: getStatusColor(order.status) + '20',
                                                            color: getStatusColor(order.status),
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px', whiteSpace: 'nowrap', color: '#64748b' }}>
                                                    {formatDate(order.created_at)}
                                                </td>
                                                <td style={{ padding: '14px 10px', color: '#94a3b8' }}>
                                                    <IconChevronRight size={16} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 우측 상세 패널 */}
                {selectedOrder && (
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>주문 상세</span>
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}
                            >
                                <IconX size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>주문번호</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {selectedOrder.order_number}{' '}
                                        <a
                                            href={`https://bugoon.maeumbugo.co.kr/order/${selectedOrder.order_number}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontSize: '11px', color: '#2563eb', marginLeft: '6px', textDecoration: 'underline' }}
                                        >
                                            주문내역 보기 ↗
                                        </a>
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>상태</span>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>부고번호 / 파트너</span>
                                    <span>
                                        #{selectedOrder.bugo_number} ({selectedOrder.company_name || '개인'} · {selectedOrder.owner_name || '-'})
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                    <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>답례품 상품</span>
                                    <span style={{ fontWeight: 600, textAlign: 'right' }}>{selectedOrder.product_name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>단가 × 수량</span>
                                    <span>
                                        {selectedOrder.unit_price?.toLocaleString()}원 × {selectedOrder.quantity}명
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>총 결제금액</span>
                                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{selectedOrder.total_amount?.toLocaleString()}원</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>발신 상주</span>
                                    <span>
                                        {selectedOrder.buyer_name || '상주'}
                                        {selectedOrder.buyer_phone ? ` (${formatPhoneDisplay(selectedOrder.buyer_phone)})` : ''}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>결제수단</span>
                                    <span>{selectedOrder.payment_method || (selectedOrder.is_test ? '테스트' : '신용카드')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>주문일시</span>
                                    <span>{formatDate(selectedOrder.created_at)}</span>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                                    감사장 문구
                                </label>
                                <div
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

                            <div>
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

                            <div>
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
                    </div>
                )}
            </div>
        </div>
    );
}
