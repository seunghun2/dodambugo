'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    IconRefresh, 
    IconDownload, 
    IconEye, 
    IconX, 
    IconCash,
    IconSearch,
    IconLoader2
} from '@tabler/icons-react';
import styles from './condolenceOrders.module.css';

interface CondolenceOrder {
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
    payment_type: string;
    status: string;
    created_at: string;
    settled_at: string | null;
    company_name: string;
    owner_name: string;
}

export default function B2BCondolenceOrdersPage() {
    const [orders, setOrders] = useState<CondolenceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<CondolenceOrder | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // 예치금 잔액 (B2C API 재사용)
    const [depositBalance, setDepositBalance] = useState<{
        remainAmt: string;
        totDptAmt: string;
        totWdrAmt: string;
        loading: boolean;
    }>({ remainAmt: '-', totDptAmt: '-', totWdrAmt: '-', loading: true });

    // 필터 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // 통계
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalAmount: 0,
        totalFee: 0,
        totalProfit: 0,
    });

    useEffect(() => {
        fetchOrders();
        fetchDepositBalance();
    }, [searchQuery]);

    const fetchDepositBalance = async () => {
        setDepositBalance(prev => ({ ...prev, loading: true }));
        try {
            const res = await fetch('/api/condolence/transfer/balance');
            const data = await res.json();
            if (data.success) {
                setDepositBalance({
                    remainAmt: Number(data.data.remainAmt).toLocaleString(),
                    totDptAmt: Number(data.data.totDptAmt).toLocaleString(),
                    totWdrAmt: Number(data.data.totWdrAmt).toLocaleString(),
                    loading: false,
                });
            } else {
                setDepositBalance(prev => ({ ...prev, loading: false }));
            }
        } catch (e) {
            setDepositBalance(prev => ({ ...prev, loading: false }));
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/b2b/admin/condolence-orders');
            if (!res.ok) {
                throw new Error('조의금 주문 데이터를 가져오는데 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
                calculateStats(data.orders);
            } else {
                setError(data.error || '에러가 발생했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: CondolenceOrder[]) => {
        const totalOrders = data.length;
        const totalAmount = data.reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalFee = data.reduce((sum, o) => sum + (o.fee || 0), 0);
        const totalProfit = data.reduce((sum, o) => sum + ((o.total_amount || 0) - (o.amount || 0)), 0);

        setStats({ totalOrders, totalAmount, totalFee, totalProfit });
    };

    // 필터링 적용
    const filteredOrders = orders.filter(order => {
        // 검색어 필터 (구매자명, 입금자명, 파트너사명)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchBuyer = order.buyer_name?.toLowerCase().includes(query);
            const matchRecipient = order.recipient_name?.toLowerCase().includes(query);
            const matchCompany = order.company_name?.toLowerCase().includes(query);
            const matchBugo = order.bugo_number?.toLowerCase().includes(query);
            if (!matchBuyer && !matchRecipient && !matchCompany && !matchBugo) return false;
        }

        // 상태 필터
        if (statusFilter !== 'all') {
            if (order.status !== statusFilter) return false;
        }

        return true;
    });

    // 페이지네이션
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchTerm);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('ko-KR').format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className={`${styles.badge} ${styles.badgeSuccess}`}>결제완료</span>;
            case 'settled':
            case 'transferred':
                return <span className={`${styles.badge} ${styles.badgePrimary}`}>정산이체완료</span>;
            case 'cancelled':
                return <span className={`${styles.badge} ${styles.badgeDanger}`}>취소</span>;
            case 'refunded':
                return <span className={`${styles.badge} ${styles.badgeWarning}`}>환불</span>;
            default:
                return <span className={styles.badge}>{status || '대기'}</span>;
        }
    };

    // CSV 다운로드 (한글 깨짐 방지 UTF-8 BOM 추가)
    const handleDownloadExcel = () => {
        if (filteredOrders.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['주문일시', '주문번호', '부고번호', '파트너사', '대표자', '결제방식', '구매자명', '구매자연락처', '입금자명', '부의금액', '수수료', '총결제금액', '수익(차익)', '상태'];
        const rows = filteredOrders.map(o => [
            formatDate(o.created_at),
            o.order_number,
            o.bugo_number,
            o.company_name,
            o.owner_name,
            o.payment_method,
            o.buyer_name,
            o.buyer_phone,
            o.recipient_name,
            String(o.amount),
            String(o.fee),
            String(o.total_amount),
            String(o.total_amount - o.amount),
            o.status === 'completed' ? '결제완료' : o.status === 'transferred' || o.status === 'settled' ? '이체완료' : o.status === 'cancelled' ? '취소' : '기타'
        ]);

        const csvContent = 
            '\ufeff' + 
            [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', `b2b_condolence_orders_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>B2B 부의금 판매 관리</h1>
                <p className={styles.subtitle}>B2B 파트너(지도사)의 모바일 부고장을 통해 송금된 조의금 내역을 관리합니다.</p>
            </div>

            {/* 통계 카드 */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>총 주문 건수</div>
                    <div className={styles.statValue}>{stats.totalOrders}건</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>누적 부의금 총액</div>
                    <div className={styles.statValue}>{formatMoney(stats.totalAmount)}원</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>플랫폼 수수료</div>
                    <div className={styles.statValue}>{formatMoney(stats.totalFee)}원</div>
                </div>
                <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
                    <div className={styles.statLabel}>누적 총 수익</div>
                    <div className={styles.statValue}>{formatMoney(stats.totalProfit)}원</div>
                </div>
                <div className={`${styles.statCard} ${styles.statCardDeposit}`}>
                    <div className={styles.statLabel}>
                        이노페이 예치금 잔액
                        <button onClick={fetchDepositBalance} className={styles.btnDepositRefresh} title="새로고침">
                            <IconRefresh stroke={1.5} size={14} className={depositBalance.loading ? 'spinning' : ''} />
                        </button>
                    </div>
                    <div className={styles.statValue}>
                        {depositBalance.loading ? '...' : `${depositBalance.remainAmt}원`}
                    </div>
                    {!depositBalance.loading && (
                        <div className={styles.depositDetail}>
                            입금 {depositBalance.totDptAmt}원 / 출금 {depositBalance.totWdrAmt}원
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.filterBar}>
                <form onSubmit={handleSearchSubmit} className={styles.filterGroup}>
                    <input
                        type="text"
                        className={styles.filterInput}
                        placeholder="구매자, 입금자, 파트너사, 부고번호 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <select
                        className={styles.filterInput}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">모든 결제 상태</option>
                        <option value="completed">결제 완료</option>
                        <option value="transferred">이체 완료</option>
                        <option value="cancelled">취소됨</option>
                        <option value="refunded">환불됨</option>
                    </select>

                    <button type="submit" className={styles.btnRefresh} style={{ background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconSearch stroke={1.5} size={16} />
                            <span>검색</span>
                        </div>
                    </button>
                </form>

                <button onClick={fetchOrders} className={styles.btnRefresh}>
                    <IconRefresh stroke={1.5} size={16} />
                    <span>새로고침</span>
                </button>

                <button onClick={handleDownloadExcel} className={styles.btnExport}>
                    <IconDownload stroke={1.5} size={16} />
                    <span>엑셀 다운로드</span>
                </button>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <div className={styles.contentArea}>
                {/* 리스트 테이블 */}
                <div className={styles.tableCard}>
                    <div className={styles.tableWrapper}>
                        {loading ? (
                            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                                <IconLoader2 stroke={1.5} size={24} className="spinning" style={{ margin: '0 auto 8px' }} />
                                <span>주문 목록을 불러오는 중...</span>
                            </div>
                        ) : paginatedOrders.length === 0 ? (
                            <div className={styles.emptyState}>조회할 조의금 주문 내역이 없습니다.</div>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>주문번호</th>
                                        <th>부고번호</th>
                                        <th>파트너사</th>
                                        <th>결제방식</th>
                                        <th>구매자</th>
                                        <th>연락처</th>
                                        <th>입금자명</th>
                                        <th>부의금액</th>
                                        <th>수수료</th>
                                        <th>결제금액</th>
                                        <th>일시</th>
                                        <th>상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedOrders.map((order) => (
                                        <tr 
                                            key={order.id}
                                            className={selectedOrder?.id === order.id ? styles.selectedRow : ''}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <td className={styles.orderNum}>{order.order_number}</td>
                                            <td>{order.bugo_number}</td>
                                            <td style={{ fontWeight: '600' }}>{order.company_name}</td>
                                            <td>{order.payment_method}</td>
                                            <td>{order.buyer_name}</td>
                                            <td>{order.buyer_phone}</td>
                                            <td>{order.recipient_name}</td>
                                            <td className={styles.numberCell}>{formatMoney(order.amount)}원</td>
                                            <td className={styles.numberCell}>{formatMoney(order.fee)}원</td>
                                            <td className={styles.numberCell} style={{ fontWeight: '600' }}>{formatMoney(order.total_amount)}원</td>
                                            <td className={styles.dateCell}>{formatDate(order.created_at)}</td>
                                            <td>{getStatusBadge(order.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={styles.pageBtn}
                            >
                                이전
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={styles.pageBtn}
                            >
                                다음
                            </button>
                            <span className={styles.pageInfo}>
                                총 {filteredOrders.length}건
                            </span>
                        </div>
                    )}
                </div>

                {/* 상세 우측 패널 */}
                <div className={styles.detailPanel}>
                    {selectedOrder ? (
                        <>
                            <div className={styles.panelHeader}>
                                <span>주문 상세 정보</span>
                                <button onClick={() => setSelectedOrder(null)} className={styles.btnClose}>
                                    <IconX stroke={1.5} size={18} />
                                </button>
                            </div>
                            <div className={styles.detailContent}>
                                <div className={styles.detailSection}>
                                    <div className={styles.detailRow}>
                                        <label>주문번호</label>
                                        <span className={styles.orderNum}>#{selectedOrder.order_number}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>부고번호</label>
                                        <span>{selectedOrder.bugo_number}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>담당 파트너사</label>
                                        <span>{selectedOrder.company_name} ({selectedOrder.owner_name})</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>구매자 (조문객)</label>
                                        <span>{selectedOrder.buyer_name} ({selectedOrder.buyer_phone})</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>입금자명 (적요)</label>
                                        <span>{selectedOrder.recipient_name}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>결제방식</label>
                                        <span>{selectedOrder.payment_method} ({selectedOrder.payment_type || '개인'})</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>결제일시</label>
                                        <span>{formatDate(selectedOrder.created_at)}</span>
                                    </div>
                                </div>

                                <div className={styles.detailSection}>
                                    <div className={styles.detailRow}>
                                        <label>순수 부의금액</label>
                                        <span>{formatMoney(selectedOrder.amount)}원</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>수수료 (카드/플랫폼)</label>
                                        <span>{formatMoney(selectedOrder.fee)}원</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>총 결제금액</label>
                                        <span className={styles.highlight}>{formatMoney(selectedOrder.total_amount)}원</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <label>플랫폼 차익</label>
                                        <span className={styles.profit}>{formatMoney(selectedOrder.total_amount - selectedOrder.amount)}원</span>
                                    </div>
                                </div>

                                <div className={styles.detailSection}>
                                    <div className={styles.detailRow}>
                                        <label>결제 상태</label>
                                        {getStatusBadge(selectedOrder.status)}
                                    </div>
                                    {selectedOrder.settled_at && (
                                        <div className={styles.detailRow}>
                                            <label>상주계좌 송금일시</label>
                                            <span>{formatDate(selectedOrder.settled_at)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.detailActions}>
                                    <Link
                                        href={`/b2b/view/${selectedOrder.bugo_number}`}
                                        target="_blank"
                                        className={styles.btnActionPrimary}
                                    >
                                        <IconEye stroke={1.5} size={16} />
                                        <span>모바일 부고장 보기</span>
                                    </Link>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.panelEmpty}>
                            <IconCash stroke={1.5} size={48} style={{ color: '#cbd5e1' }} />
                            <p className={styles.panelEmptyText}>주문 행을 선택하시면<br />상세 내역이 여기에 표시됩니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
