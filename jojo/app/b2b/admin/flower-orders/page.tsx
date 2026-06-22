'use client';

import { useState, useEffect } from 'react';
import { 
    IconSearch, 
    IconDownload, 
    IconRefresh, 
    IconX, 
    IconTruck, 
    IconCheck, 
    IconFileText
} from '@tabler/icons-react';
import styles from './flowerOrders.module.css';
import { supabase } from '@/lib/supabase';

interface B2BOrder {
    id: string;
    order_number: string;
    product_name: string;
    price: number;
    payment_method: string;
    status: string;
    created_at: string;
    recipient_name: string;
    funeral_home: string;
    room: string;
    address: string;
    sender_name: string;
    sender_phone: string;
    ribbon_text1: string;
    ribbon_text2: string;
    deceased_name: string;
    company_name: string;
    owner_name: string;
    reward_amount: number;
    bonus_amount: number;
}

export default function FlowerOrdersPage() {
    const [orders, setOrders] = useState<B2BOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<B2BOrder | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [updating, setUpdating] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [changingProduct, setChangingProduct] = useState(false);
    const [notifyLogs, setNotifyLogs] = useState<{ time: string; message: string; type: 'success' | 'error' }[]>([]);

    const addNotifyLog = (message: string, type: 'success' | 'error' = 'success') => {
        const now = new Date();
        const time = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setNotifyLogs(prev => [{ time, message, type }, ...prev.slice(0, 9)]);
    };

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`/api/b2b/admin/flower-orders?${params.toString()}`);
            if (!res.ok) {
                throw new Error('주문 데이터를 가져오는데 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
                // 선택된 주문도 업데이트
                if (selectedOrder) {
                    const updatedSelected = data.orders.find((o: B2BOrder) => o.id === selectedOrder.id);
                    if (updatedSelected) setSelectedOrder(updatedSelected);
                }
            } else {
                setError(data.error || '에러가 발생했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [searchQuery]);

    useEffect(() => {
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
            const res = await fetch('/api/flower-orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, product_name: productName, product_price: productPrice }),
            });
            if (res.ok) {
                addNotifyLog(`[상품변경] 상품이 "${productName}" (${productPrice.toLocaleString()}원)으로 변경되었습니다.`);
                fetchOrders();
            } else {
                const data = await res.json();
                addNotifyLog(`[상품변경 실패] ${data.error || '에러 발생'}`, 'error');
            }
        } catch (err: any) {
            addNotifyLog(`[상품변경 오류] ${err.message || '네트워크 에러'}`, 'error');
        } finally {
            setChangingProduct(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchTerm);
    };

    // 주문 상태 수정 PATCH API 연동
    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setUpdating(true);
        try {
            const res = await fetch('/api/flower-orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) {
                addNotifyLog(`[상태변경] 주문 상태가 "${getStatusLabel(newStatus)}"로 변경되었습니다.`);
                fetchOrders();
            } else {
                const data = await res.json();
                addNotifyLog(`[상태변경 실패] ${data.error || '에러 발생'}`, 'error');
            }
        } catch (err: any) {
            addNotifyLog(`[상태변경 오류] ${err.message || '네트워크 에러'}`, 'error');
        } finally {
            setUpdating(false);
        }
    };

    // 알림톡 발송 API 연동 (배송중, 배송완료)
    const handleSendDeliveryNotify = async (order: B2BOrder, type: 'delivering' | 'delivered') => {
        const typeKo = type === 'delivering' ? '배송중' : '배송완료';
        if (!confirm(`"${order.sender_name}"님께 ${typeKo} 알림톡을 발송하시겠습니까?`)) {
            return;
        }

        setUpdating(true);
        try {
            const response = await fetch('/api/flower-orders/delivery-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    type: type
                }),
            });
            const result = await response.json();

            if (response.ok) {
                addNotifyLog(`[${typeKo} 알림] ${order.sender_name}님께 알림톡 발송 완료`, 'success');
                // 상태도 업데이트
                await handleUpdateStatus(order.id, type === 'delivering' ? 'delivering' : 'delivered');
            } else {
                addNotifyLog(`[${typeKo} 알림] 발송 실패: ${result.error}`, 'error');
            }
        } catch (err: any) {
            console.error(err);
            addNotifyLog(`[${typeKo} 알림] 발송 오류`, 'error');
        } finally {
            setUpdating(false);
        }
    };

    // 주문 취소 (INNOPAY 취소 + 알림톡 발송)
    const handleCancelOrder = async (order: B2BOrder) => {
        const reason = prompt('취소 사유를 입력해주세요:');
        if (reason === null) return;

        if (!confirm(`정말 "${order.product_name}" 주문을 취소하시겠습니까?\n\n취소 시 결제금액이 환불됩니다.`)) {
            return;
        }

        setUpdating(true);
        try {
            const response = await fetch('/api/flower-orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, cancelReason: reason }),
            });
            const result = await response.json();

            if (response.ok) {
                addNotifyLog(`[주문취소] 주문이 성공적으로 취소 및 환불 처리되었습니다.`);
                alert('주문이 취소되었습니다.');
                fetchOrders();
                setSelectedOrder(null);
            } else {
                addNotifyLog(`[주문취소 실패] ${result.error}`, 'error');
                alert(`취소 실패: ${result.error}`);
            }
        } catch (err: any) {
            console.error(err);
            addNotifyLog(`[주문취소 오류] 처리 중 에러 발생`, 'error');
            alert('취소 처리 중 오류가 발생했습니다.');
        } finally {
            setUpdating(false);
        }
    };

    // CSV/Excel 다운로드 기능 (UTF-8 BOM 헤더 포함)
    const handleDownloadExcel = () => {
        if (orders.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['주문일시', '주문번호', '개설 파트너사', '고인 성함', '받는 상주', '장례식장', '빈소', '상품명', '결제금액', '결제수단', '상태', '파트너 수당', '추천인 보너스'];
        const rows = orders.map(o => [
            formatDate(o.created_at),
            o.order_number,
            o.company_name,
            o.deceased_name,
            o.recipient_name,
            o.funeral_home,
            o.room,
            o.product_name,
            String(o.price),
            o.payment_method,
            getStatusLabel(o.status),
            String(o.reward_amount),
            String(o.bonus_amount)
        ]);

        const csvContent = 
            '\ufeff' + // UTF-8 BOM 추가
            [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', `b2b_flower_orders_list_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (n: number) => new Intl.NumberFormat('ko-KR').format(n);
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return '주문접수';
            case 'completed': return '결제완료';
            case 'confirmed': return '주문확인';
            case 'preparing': return '제작중';
            case 'delivering': return '배송중';
            case 'delivered': return '배송완료';
            case 'cancelled': return '취소';
            default: return status;
        }
    };

    return (
        <div>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>B2B 화환 주문 조회</h1>
                <p className={styles.subtitle}>B2B 파트너(지도사)의 모바일 부고장으로 접수 및 완료된 근조화환 주문 및 정산 목록입니다.</p>
            </div>

            <div className={styles.filterBar}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="상품명, 파트너사, 장례식장, 받는분 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className={styles.searchBtn}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconSearch stroke={1.5} size={16} />
                            <span>검색</span>
                        </div>
                    </button>
                    <button type="button" onClick={fetchOrders} className={styles.searchBtn} style={{ background: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconRefresh stroke={1.5} size={16} />
                            <span>새로고침</span>
                        </div>
                    </button>
                </form>

                <button onClick={handleDownloadExcel} className={styles.excelBtn}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconDownload stroke={1.5} size={16} />
                        <span>엑셀 다운로드</span>
                    </div>
                </button>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <div className={styles.pageContainer}>
                {/* 왼쪽 테이블 영역 */}
                <div className={styles.tableSection}>
                    <div className={styles.tableCard}>
                        <div className={styles.tableWrapper}>
                            {loading ? (
                                <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                                    주문 내역을 불러오는 중...
                                </div>
                            ) : orders.length === 0 ? (
                                <div className={styles.emptyState}>조회할 주문 내역이 없습니다.</div>
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>주문일시</th>
                                            <th>주문번호</th>
                                            <th>개설 파트너사</th>
                                            <th>고인 성함</th>
                                            <th>받는 상주</th>
                                            <th>장례식장 (빈소)</th>
                                            <th>상품명</th>
                                            <th>결제금액</th>
                                            <th>상태</th>
                                            <th>파트너 수당</th>
                                            <th>추천인 보너스</th>
                                            <th>결제수단</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => {
                                            const isSelected = selectedOrder?.id === order.id;
                                            return (
                                                <tr 
                                                    key={order.id} 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className={isSelected ? styles.selectedRow : ''}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                                                        {formatDate(order.created_at)}
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                                                        {order.order_number}
                                                    </td>
                                                    <td style={{ fontWeight: '600' }}>{order.company_name}</td>
                                                    <td>{order.deceased_name}</td>
                                                    <td>{order.recipient_name}</td>
                                                    <td style={{ fontSize: '13px' }}>
                                                        {order.funeral_home} ({order.room})
                                                    </td>
                                                    <td style={{ fontWeight: '500' }}>{order.product_name}</td>
                                                    <td style={{ fontWeight: '600', color: '#0f172a' }}>
                                                        {formatCurrency(order.price)}원
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${styles[`status_${order.status}`]}`}>
                                                            {getStatusLabel(order.status)}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: '600', color: '#16a34a' }}>
                                                        +{formatCurrency(order.reward_amount)}원
                                                    </td>
                                                    <td style={{ fontWeight: '600', color: '#d4a84b' }}>
                                                        +{formatCurrency(order.bonus_amount)}원
                                                    </td>
                                                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                                                        {order.payment_method}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* 오른쪽 상세 패널 영역 */}
                <div className={styles.detailSection}>
                    {selectedOrder ? (
                        <div className={styles.detailCard}>
                            <div className={styles.detailHeader}>
                                <span className={styles.detailTitle}>주문 상세 정보</span>
                                <button className={styles.closeBtn} onClick={() => setSelectedOrder(null)}>
                                    <IconX size={18} stroke={1.5} />
                                </button>
                            </div>

                            <div className={styles.detailGroup}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>주문번호</span>
                                    <span className={styles.detailValue} style={{ fontFamily: 'monospace' }}>
                                        {selectedOrder.order_number}
                                    </span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>주문상태</span>
                                    <select
                                        value={selectedOrder.status}
                                        onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                                        disabled={updating}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="completed">결제완료</option>
                                        <option value="confirmed">주문확인</option>
                                        <option value="preparing">제작중</option>
                                        <option value="delivering">배송중</option>
                                        <option value="delivered">배송완료</option>
                                        <option value="cancelled">취소</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.detailGroup}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>상품명</span>
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
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            outline: 'none',
                                            cursor: selectedOrder.status === 'cancelled' ? 'not-allowed' : 'pointer',
                                            maxWidth: '220px'
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
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>결제금액</span>
                                    <span className={styles.detailValue} style={{ color: '#0f172a', fontWeight: '700' }}>
                                        {formatCurrency(selectedOrder.price)}원
                                    </span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>결제수단</span>
                                    <span className={styles.detailValue}>{selectedOrder.payment_method}</span>
                                </div>
                            </div>

                            <div className={styles.detailGroup}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>주문자명</span>
                                    <span className={styles.detailValue}>{selectedOrder.sender_name}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>연락처</span>
                                    <span className={styles.detailValue}>{selectedOrder.sender_phone}</span>
                                </div>
                            </div>

                            <div className={styles.detailGroup}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>받는 상주</span>
                                    <span className={styles.detailValue}>{selectedOrder.recipient_name}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>장례식장</span>
                                    <span className={styles.detailValue}>
                                        {selectedOrder.funeral_home} ({selectedOrder.room})
                                    </span>
                                </div>
                                <div className={styles.detailRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                    <span className={styles.detailLabel}>배송 주소</span>
                                    <span style={{ fontSize: '13px', color: '#334155', fontWeight: '500', textAlign: 'left' }}>
                                        {selectedOrder.address}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.detailGroup} style={{ borderBottom: 'none' }}>
                                <span className={styles.detailLabel}>리본 문구</span>
                                <div className={styles.ribbonBox}>
                                    <div style={{ fontWeight: '700', color: '#0f172a' }}>
                                        {selectedOrder.ribbon_text2 || '(경조사어 없음)'}
                                    </div>
                                    <div style={{ color: '#475569', marginTop: '4px', fontSize: '12px' }}>
                                        {selectedOrder.ribbon_text1 || '(보내는 이 없음)'}
                                    </div>
                                </div>
                            </div>

                            {/* 액션 버튼 그룹 */}
                            <div className={styles.btnGroup}>
                                <button
                                    onClick={() => handleSendDeliveryNotify(selectedOrder, 'delivering')}
                                    disabled={updating}
                                    className={`${styles.actionBtn} ${styles.btnDelivering}`}
                                >
                                    <IconTruck size={16} stroke={1.5} />
                                    <span>배송중 알림톡 전송</span>
                                </button>
                                <button
                                    onClick={() => handleSendDeliveryNotify(selectedOrder, 'delivered')}
                                    disabled={updating}
                                    className={`${styles.actionBtn} ${styles.btnDelivered}`}
                                >
                                    <IconCheck size={16} stroke={1.5} />
                                    <span>배송완료 알림톡 전송</span>
                                </button>
                                <button
                                    onClick={() => handleCancelOrder(selectedOrder)}
                                    disabled={updating || selectedOrder.status === 'cancelled'}
                                    className={`${styles.actionBtn} ${styles.btnCancel}`}
                                >
                                    <IconX size={16} stroke={1.5} />
                                    <span>{selectedOrder.status === 'cancelled' ? '이미 취소됨' : '주문 취소 및 환불'}</span>
                                </button>
                            </div>

                            {/* 알림톡 발송 로그 */}
                            {notifyLogs.length > 0 && (
                                <div className={styles.logArea}>
                                    {notifyLogs.map((log, idx) => (
                                        <div key={idx} className={`${styles.logItem} ${log.type === 'success' ? styles.logSuccess : styles.logError}`}>
                                            <span style={{ color: '#94a3b8', marginRight: '6px' }}>{log.time}</span>
                                            <span>{log.message}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.emptyDetail}>
                            <IconFileText size={48} stroke={1.2} />
                            <span className={styles.emptyText}>조회할 주문을 테이블에서 선택해 주세요.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
