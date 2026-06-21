'use client';

import { useState, useEffect } from 'react';
import { 
    IconSearch, 
    IconDownload 
} from '@tabler/icons-react';
import styles from './flowerOrders.module.css';

interface B2BOrder {
    id: string;
    order_number: string;
    product_name: string;
    price: number;
    payment_method: string;
    created_at: string;
    recipient_name: string;
    funeral_home: string;
    room: string;
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
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchTerm);
    };

    // CSV/Excel 다운로드 기능 (UTF-8 BOM 헤더 포함)
    const handleDownloadExcel = () => {
        if (orders.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['주문일시', '주문번호', '개설 파트너사', '고인 성함', '받는 상주', '장례식장', '빈소', '상품명', '결제금액', '결제수단', '파트너 수당', '추천인 보너스'];
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
                                    <th>파트너 수당</th>
                                    <th>추천인 보너스</th>
                                    <th>결제수단</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
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
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
