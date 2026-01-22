'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
    payment_type: string; // 개인/법인
    status: string;
    created_at: string;
    settled_at: string | null;
}

export default function AdminCondolenceOrdersPage() {
    const [orders, setOrders] = useState<CondolenceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<CondolenceOrder | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // 필터 상태
    const [filters, setFilters] = useState({
        buyer_name: '',
        recipient_name: '',
        status: '',
    });

    // 통계
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalAmount: 0,
        totalFee: 0,
        totalProfit: 0,
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);

        // 부의금 주문 테이블이 없으면 샘플 데이터 사용 (나중에 실제 테이블로 교체)
        // const { data, error } = await supabase
        //     .from('condolence_orders')
        //     .select('*')
        //     .order('created_at', { ascending: false });

        // 샘플 데이터 (PG 연동 후 실제 데이터로 교체)
        const sampleData: CondolenceOrder[] = [
            {
                id: 1,
                order_number: '18605',
                bugo_number: 'B240122001',
                buyer_name: '김현근',
                buyer_phone: '010-7294-7777',
                recipient_name: '주성기업',
                amount: 500000,
                fee: 43000,
                total_amount: 543000,
                payment_method: '신용카드',
                payment_type: '법인',
                status: 'completed',
                created_at: '2026-01-22T14:32:00',
                settled_at: null,
            },
            {
                id: 2,
                order_number: '18601',
                bugo_number: 'B240122002',
                buyer_name: '이남지',
                buyer_phone: '010-6555-4578',
                recipient_name: '이남지',
                amount: 100000,
                fee: 8600,
                total_amount: 108600,
                payment_method: '신용카드',
                payment_type: '개인',
                status: 'completed',
                created_at: '2026-01-22T13:15:00',
                settled_at: null,
            },
            {
                id: 3,
                order_number: '18598',
                bugo_number: 'B240121015',
                buyer_name: '박서연',
                buyer_phone: '010-2345-6789',
                recipient_name: '박서연',
                amount: 300000,
                fee: 25800,
                total_amount: 325800,
                payment_method: '간편결제',
                payment_type: '개인',
                status: 'settled',
                created_at: '2026-01-21T18:45:00',
                settled_at: '2026-01-22T09:00:00',
            },
            {
                id: 4,
                order_number: '18590',
                bugo_number: 'B240121012',
                buyer_name: '최민수',
                buyer_phone: '010-8765-4321',
                recipient_name: '최민수',
                amount: 50000,
                fee: 4300,
                total_amount: 54300,
                payment_method: '신용카드',
                payment_type: '개인',
                status: 'completed',
                created_at: '2026-01-21T10:22:00',
                settled_at: null,
            },
            {
                id: 5,
                order_number: '18585',
                bugo_number: 'B240120008',
                buyer_name: '정유진',
                buyer_phone: '010-1111-2222',
                recipient_name: '(주)테크솔루션',
                amount: 1000000,
                fee: 86000,
                total_amount: 1086000,
                payment_method: '신용카드',
                payment_type: '법인',
                status: 'settled',
                created_at: '2026-01-20T15:30:00',
                settled_at: '2026-01-21T09:00:00',
            },
        ];

        setOrders(sampleData);
        calculateStats(sampleData);
        setLoading(false);
    };

    const calculateStats = (data: CondolenceOrder[]) => {
        const totalOrders = data.length;
        const totalAmount = data.reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalFee = data.reduce((sum, o) => sum + (o.fee || 0), 0);
        const totalProfit = data.reduce((sum, o) => sum + ((o.total_amount || 0) - (o.amount || 0)), 0);

        setStats({ totalOrders, totalAmount, totalFee, totalProfit });
    };

    const filteredOrders = orders.filter(order => {
        if (filters.buyer_name && !order.buyer_name?.includes(filters.buyer_name)) return false;
        if (filters.recipient_name && !order.recipient_name?.includes(filters.recipient_name)) return false;
        if (filters.status && order.status !== filters.status) return false;
        return true;
    });

    // 페이지네이션
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/\. /g, '-').replace('.', '');
    };

    const formatMoney = (amount: number) => {
        if (!amount) return '0';
        return amount.toLocaleString();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="badge success">결제완료</span>;
            case 'settled':
                return <span className="badge primary">정산완료</span>;
            case 'cancelled':
                return <span className="badge danger">취소</span>;
            case 'refunded':
                return <span className="badge warning">환불</span>;
            default:
                return <span className="badge">{status || '대기'}</span>;
        }
    };

    return (
        <div className="admin-pc">
            <AdminSidebar />

            {/* 메인 콘텐츠 */}
            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>부의금 판매 관리</h1>
                    <div className="header-actions">
                        <span className="total-count">총 {filteredOrders.length}건</span>
                        <button onClick={fetchOrders} className="btn-refresh">
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                {/* 통계 카드 */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-label">총 주문</div>
                        <div className="stat-value">{stats.totalOrders}건</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">총 부의금</div>
                        <div className="stat-value">{formatMoney(stats.totalAmount)}원</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">총 수수료</div>
                        <div className="stat-value">{formatMoney(stats.totalFee)}원</div>
                    </div>
                    <div className="stat-card highlight">
                        <div className="stat-label">총 수익</div>
                        <div className="stat-value">{formatMoney(stats.totalProfit)}원</div>
                    </div>
                </div>

                <div className="admin-content-area">
                    {/* 부의금 주문 목록 테이블 */}
                    <div className="inquiry-panel wide">
                        <div className="panel-header">
                            <span>부의금 주문 목록 ({filteredOrders.length})</span>
                            <button className="btn-export">
                                <span className="material-symbols-outlined">download</span>
                                내보내기
                            </button>
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
                                            <th>결제방식</th>
                                            <th>구분</th>
                                            <th>구매자</th>
                                            <th>연락처</th>
                                            <th>입금자명</th>
                                            <th>부의금액</th>
                                            <th>수수료</th>
                                            <th>결제금액</th>
                                            <th>차익</th>
                                            <th>일시</th>
                                        </tr>
                                        <tr className="filter-row">
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th>
                                                <input
                                                    type="text"
                                                    placeholder="검색"
                                                    value={filters.buyer_name}
                                                    onChange={(e) => setFilters({ ...filters, buyer_name: e.target.value })}
                                                />
                                            </th>
                                            <th></th>
                                            <th>
                                                <input
                                                    type="text"
                                                    placeholder="검색"
                                                    value={filters.recipient_name}
                                                    onChange={(e) => setFilters({ ...filters, recipient_name: e.target.value })}
                                                />
                                            </th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={12} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>payments</span>
                                                        <p>부의금 주문 내역이 없습니다</p>
                                                        <p style={{ fontSize: '13px' }}>PG 연동 후 부의금 결제가 시작되면 이곳에 표시됩니다</p>
                                                    </div>
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
                                                    <td>{order.bugo_number}</td>
                                                    <td>{order.payment_method}</td>
                                                    <td>{order.payment_type || '개인'}</td>
                                                    <td>{order.buyer_name}</td>
                                                    <td>{order.buyer_phone}</td>
                                                    <td>{order.recipient_name}</td>
                                                    <td className="number-cell">{formatMoney(order.amount)}</td>
                                                    <td className="number-cell">{formatMoney(order.fee)}</td>
                                                    <td className="number-cell">{formatMoney(order.total_amount)}</td>
                                                    <td className="number-cell profit">{formatMoney(order.total_amount - order.amount)}</td>
                                                    <td className="date-cell">{formatDate(order.created_at)}</td>
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

                    {/* 상세 패널 */}
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
                                            <span className="bugo-num">#{selectedOrder.order_number}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>부고번호</label>
                                            <span>{selectedOrder.bugo_number}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>구매자</label>
                                            <span>{selectedOrder.buyer_name} ({selectedOrder.buyer_phone})</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>입금자명</label>
                                            <span>{selectedOrder.recipient_name}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>결제방식</label>
                                            <span>{selectedOrder.payment_method}</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>결제일시</label>
                                            <span>{formatDate(selectedOrder.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>부의금액</label>
                                            <span>{formatMoney(selectedOrder.amount)}원</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>수수료 (8.6%)</label>
                                            <span>{formatMoney(selectedOrder.fee)}원</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>총 결제금액</label>
                                            <span className="highlight">{formatMoney(selectedOrder.total_amount)}원</span>
                                        </div>
                                        <div className="detail-row">
                                            <label>차익 (수익)</label>
                                            <span className="profit">{formatMoney(selectedOrder.total_amount - selectedOrder.amount)}원</span>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <label>상태</label>
                                            {getStatusBadge(selectedOrder.status)}
                                        </div>
                                        {selectedOrder.settled_at && (
                                            <div className="detail-row">
                                                <label>정산일시</label>
                                                <span>{formatDate(selectedOrder.settled_at)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="detail-actions">
                                        <Link
                                            href={`/view/${selectedOrder.bugo_number}`}
                                            target="_blank"
                                            className="btn-action primary"
                                        >
                                            <span className="material-symbols-outlined">visibility</span>
                                            부고장 보기
                                        </Link>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="panel-empty">
                                <span className="material-symbols-outlined">touch_app</span>
                                <p>주문을 선택하세요</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style jsx>{`
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                    padding: 0 24px;
                }
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .stat-card.highlight {
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                }
                .stat-label {
                    font-size: 13px;
                    color: #64748b;
                    margin-bottom: 8px;
                }
                .stat-card.highlight .stat-label {
                    color: rgba(255,255,255,0.8);
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1e293b;
                }
                .stat-card.highlight .stat-value {
                    color: white;
                }
                .btn-export {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: #f1f5f9;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    color: #475569;
                    cursor: pointer;
                }
                .btn-export:hover {
                    background: #e2e8f0;
                }
                .order-num {
                    font-family: monospace;
                    font-weight: 600;
                    color: #3b82f6;
                }
                .profit {
                    color: #22c55e !important;
                    font-weight: 600;
                }
                .badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    background: #f1f5f9;
                    color: #475569;
                }
                .badge.success {
                    background: #dcfce7;
                    color: #16a34a;
                }
                .badge.primary {
                    background: #dbeafe;
                    color: #2563eb;
                }
                .badge.danger {
                    background: #fee2e2;
                    color: #dc2626;
                }
                .badge.warning {
                    background: #fef3c7;
                    color: #d97706;
                }
                .highlight {
                    font-weight: 600;
                    color: #1e293b;
                }
            `}</style>
        </div>
    );
}
