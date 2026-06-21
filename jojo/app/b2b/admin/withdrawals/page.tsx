'use client';

import { useState, useEffect } from 'react';
import { 
    IconCheck, 
    IconX, 
    IconCreditCard,
    IconReload,
    IconDownload
} from '@tabler/icons-react';
import styles from './withdrawals.module.css';

interface WithdrawalRequest {
    id: string;
    user_id: string;
    amount: number;
    bank_name: string;
    account_no: string;
    account_holder: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    processed_at?: string;
    company_name: string;
    owner_name: string;
    phone: string;
}

export default function WithdrawalsPage() {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const res = await fetch(`/api/b2b/admin/withdrawals?${params.toString()}`);
            if (!res.ok) {
                throw new Error('출금 신청 데이터를 가져오는데 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                setRequests(data.requests);
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
        fetchRequests();
    }, [statusFilter]);

    // 출금 신청 처리 (승인 또는 반려)
    const handleProcessWithdrawal = async (requestId: string, action: 'approve' | 'reject') => {
        const confirmMsg = 
            action === 'approve' 
                ? '송금을 완료하셨습니까?\n확인 클릭 시 출금이 최종 승인 처리됩니다.' 
                : '출금 신청을 반려하시겠습니까?\n반려 시 파트너의 예치금 잔액이 자동으로 환원됩니다.';

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch('/api/b2b/admin/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '처리 중 에러가 발생했습니다.');
            }

            const data = await res.json();
            if (data.success) {
                alert(action === 'approve' ? '성공적으로 출금 승인 처리되었습니다.' : '출금 신청이 반려되었습니다.');
                fetchRequests();
            } else {
                alert(data.error || '오류가 발생했습니다.');
            }
        } catch (err: any) {
            alert(err.message || '네트워크 오류가 발생했습니다.');
        }
    };

    const getStatusBadge = (status: WithdrawalRequest['status']) => {
        switch (status) {
            case 'pending':
                return <span className={`${styles.badge} ${styles.badgePending}`}>대기중</span>;
            case 'approved':
                return <span className={`${styles.badge} ${styles.badgeApproved}`}>송금완료</span>;
            case 'rejected':
                return <span className={`${styles.badge} ${styles.badgeRejected}`}>반려됨</span>;
            default:
                return null;
        }
    };

    const formatCurrency = (n: number) => new Intl.NumberFormat('ko-KR').format(n);
    
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // CSV/Excel 다운로드 기능 (UTF-8 BOM 헤더 포함)
    const handleDownloadExcel = () => {
        if (requests.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['신청일시', '회사명', '대표자명', '연락처', '신청 금액', '실제 지급액(3.3%공제)', '원천세', '은행', '계좌번호', '예금주', '상태', '처리일시'];
        const rows = requests.map(r => {
            const tax = Math.floor(r.amount * 0.033);
            const netAmount = r.amount - tax;
            return [
                formatDate(r.created_at),
                r.company_name,
                r.owner_name,
                r.phone,
                String(r.amount),
                String(netAmount),
                String(tax),
                r.bank_name,
                r.account_no,
                r.account_holder,
                r.status === 'pending' ? '대기중' : r.status === 'approved' ? '송금완료' : '반려됨',
                r.processed_at ? formatDate(r.processed_at) : '-'
            ];
        });

        const csvContent = 
            '\ufeff' + // UTF-8 BOM 추가
            [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', `b2b_withdrawals_list_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>B2B 출금 신청 관리</h1>
                <p className={styles.subtitle}>파트너들이 요청한 예치금 환급 신청 내역을 조회하고 승인/반려합니다.</p>
            </div>

            <div className={styles.filterBar}>
                <select
                    className={styles.selectInput}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">모든 신청 상태</option>
                    <option value="pending">대기 중</option>
                    <option value="approved">송금 완료 (승인)</option>
                    <option value="rejected">반려됨</option>
                </select>

                <button 
                    onClick={fetchRequests} 
                    className={styles.actionBtn}
                    style={{ marginLeft: 'auto', backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0', borderStyle: 'solid', borderWidth: '1px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconReload stroke={1.5} size={16} />
                        <span>새로고침</span>
                    </div>
                </button>

                <button onClick={handleDownloadExcel} className={styles.excelBtn} style={{ margin: 0 }}>
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
                            출금 신청 내역을 불러오는 중...
                        </div>
                    ) : requests.length === 0 ? (
                        <div className={styles.emptyState}>조회할 출금 신청이 없습니다.</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>신청일시</th>
                                    <th>파트너사 (대표)</th>
                                    <th>신청 금액</th>
                                    <th>실제 지급액 (3.3% 공제)</th>
                                    <th>은행</th>
                                    <th>계좌번호</th>
                                    <th>예금주</th>
                                    <th>상태</th>
                                    <th>처리일시</th>
                                    <th>액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => {
                                    const tax = Math.floor(req.amount * 0.033);
                                    const netAmount = req.amount - tax;
                                    return (
                                        <tr key={req.id}>
                                            <td style={{ fontSize: '13px', color: '#64748b' }}>
                                                {formatDate(req.created_at)}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{req.company_name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{req.owner_name} ({req.phone})</div>
                                            </td>
                                            <td style={{ fontWeight: '600', color: '#0f172a' }}>
                                                {formatCurrency(req.amount)}원
                                            </td>
                                            <td style={{ fontWeight: '600', color: '#16a34a' }}>
                                                {formatCurrency(netAmount)}원
                                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginLeft: '4px' }}>
                                                    (세{formatCurrency(tax)}원)
                                                </span>
                                            </td>
                                            <td>{req.bank_name}</td>
                                            <td style={{ fontFamily: 'monospace' }}>{req.account_no}</td>
                                            <td>{req.account_holder}</td>
                                            <td>{getStatusBadge(req.status)}</td>
                                            <td style={{ fontSize: '13px', color: '#64748b' }}>
                                                {req.processed_at ? formatDate(req.processed_at) : '-'}
                                            </td>
                                            <td>
                                                {req.status === 'pending' && (
                                                    <div className={styles.btnGroup}>
                                                        <button 
                                                            className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                            onClick={() => handleProcessWithdrawal(req.id, 'approve')}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <IconCheck stroke={1.5} size={14} />
                                                                <span>송금완료</span>
                                                            </div>
                                                        </button>
                                                        <button 
                                                            className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                            onClick={() => handleProcessWithdrawal(req.id, 'reject')}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <IconX stroke={1.5} size={14} />
                                                                <span>반려</span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                )}
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
    );
}
