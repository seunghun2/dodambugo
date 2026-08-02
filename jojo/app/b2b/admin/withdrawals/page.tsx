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
    partner_type?: 'individual' | 'business';
    withholding_tax?: number;
    local_income_tax?: number;
    vat?: number;
    net_amount?: number;
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

    // 세금 상세 모달 상태
    const [selectedTaxRequest, setSelectedTaxRequest] = useState<WithdrawalRequest | null>(null);

    // 출금 신청 처리 (송금진행 / 송금완료 / 반려)
    const handleProcessWithdrawal = async (requestId: string, action: 'transfer' | 'approve' | 'reject') => {
        let confirmMsg = '';
        if (action === 'transfer') {
            confirmMsg = '즉시 펌뱅킹 송금을 진행하시겠습니까?\n확인 클릭 시 등록 계좌로 실이체 후 승인 처리됩니다.';
        } else if (action === 'approve') {
            confirmMsg = '이미 이체가 완료된 건을 수동 승인하시겠습니까?';
        } else {
            confirmMsg = '출금 신청을 반려하시겠습니까?\n반려 시 파트너의 예치금 잔액이 자동으로 환원됩니다.';
        }

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
                alert(action === 'reject' ? '출금 신청이 반려되었습니다.' : '성공적으로 처리되었습니다.');
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

        const headers = ['신청일시', '회사명', '대표자명', '연락처', '신청 금액', '실제 지급액(3.3%공제)', '원천세', '지방세', '은행', '계좌번호', '예금주', '상태', '처리일시'];
        const rows = requests.map(r => {
            const tax = r.withholding_tax || Math.floor(r.amount * 0.03);
            const localTax = r.local_income_tax || Math.floor(r.amount * 0.003);
            const netAmount = r.net_amount || (r.amount - tax - localTax);
            return [
                formatDate(r.created_at),
                r.company_name,
                r.owner_name,
                r.phone,
                String(r.amount),
                String(netAmount),
                String(tax),
                String(localTax),
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
                                    const isBiz = req.partner_type === 'business';
                                    const withholdingTax = req.withholding_tax ?? Math.floor(req.amount * 0.03);
                                    const localTax = req.local_income_tax ?? Math.floor(req.amount * 0.003);
                                    const vat = req.vat ?? (isBiz ? Math.floor(req.amount * 0.1) : 0);
                                    const totalTax = isBiz ? 0 : (withholdingTax + localTax);
                                    const netAmount = req.net_amount ?? (isBiz ? req.amount + vat : req.amount - totalTax);

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
                                            <td 
                                                style={{ fontWeight: '600', color: '#16a34a', cursor: 'pointer' }}
                                                onClick={() => setSelectedTaxRequest(req)}
                                                title="클릭 시 원천세 상세 계산 팝업"
                                            >
                                                <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                                                    {formatCurrency(netAmount)}원
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginLeft: '4px' }}>
                                                    ({isBiz ? `VAT+${formatCurrency(vat)}` : `세${formatCurrency(totalTax)}`}) 🔍
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
                                                {req.status === 'pending' ? (
                                                    <div className={styles.btnGroup} style={{ flexWrap: 'wrap', gap: '4px' }}>
                                                        <button 
                                                            className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                            style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }}
                                                            onClick={() => handleProcessWithdrawal(req.id, 'transfer')}
                                                            title="즉시 이노페이 펌뱅킹 이체"
                                                        >
                                                            <span>송금진행</span>
                                                        </button>
                                                        <button 
                                                            className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                            style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#ffffff' }}
                                                            onClick={() => handleProcessWithdrawal(req.id, 'approve')}
                                                            title="수동 완료 승인 처리"
                                                        >
                                                            <span>송금완료</span>
                                                        </button>
                                                        <button 
                                                            className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                            onClick={() => handleProcessWithdrawal(req.id, 'reject')}
                                                        >
                                                            <span>반려</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>처리 완료</span>
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

            {/* 원천세 & 정산 세금 세부 팝업 모달 */}
            {selectedTaxRequest && (() => {
                const req = selectedTaxRequest;
                const isBiz = req.partner_type === 'business';
                const withholdingTax = req.withholding_tax ?? Math.floor(req.amount * 0.03);
                const localTax = req.local_income_tax ?? Math.floor(req.amount * 0.003);
                const vat = req.vat ?? (isBiz ? Math.floor(req.amount * 0.1) : 0);
                const totalTax = isBiz ? 0 : (withholdingTax + localTax);
                const netAmount = req.net_amount ?? (isBiz ? req.amount + vat : req.amount - totalTax);

                return (
                    <div 
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 9999,
                            padding: '20px'
                        }}
                        onClick={() => setSelectedTaxRequest(null)}
                    >
                        <div 
                            style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '16px',
                                width: '100%',
                                maxWidth: '440px',
                                padding: '24px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                color: '#1e293b'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f3f5', paddingBottom: '12px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                                    정산 원천세 상세 계산 내역
                                </h3>
                                <button 
                                    onClick={() => setSelectedTaxRequest(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                                >
                                    <IconX size={20} />
                                </button>
                            </div>

                            <div style={{ fontSize: '13px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ color: '#64748b', fontSize: '12px' }}>파트너 정보</div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginTop: '2px' }}>
                                        {req.company_name} ({req.owner_name})
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#475569' }}>
                                        유형: {isBiz ? '사업자 파트너 (세금계산서)' : '개인 파트너 (3.3% 원천징수)'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f3f5', paddingBottom: '6px' }}>
                                    <span style={{ color: '#64748b' }}>신청 정산 금액</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(req.amount)}원</span>
                                </div>

                                {!isBiz ? (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                                            <span>- 사업소득세 (3.0%)</span>
                                            <span>-{formatCurrency(withholdingTax)}원</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                                            <span>- 지방소득세 (0.3%)</span>
                                            <span>-{formatCurrency(localTax)}원</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#dc2626', borderTop: '1px dashed #f1f3f5', paddingTop: '6px' }}>
                                            <span>총 공제 세금 (3.3%)</span>
                                            <span>-{formatCurrency(totalTax)}원</span>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
                                        <span>+ 부가가치세 (10%)</span>
                                        <span>+{formatCurrency(vat)}원</span>
                                    </div>
                                )}

                                <div style={{ backgroundColor: '#ecfdf5', padding: '14px', borderRadius: '10px', border: '1px solid #a7f3d0', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#065f46' }}>실제 계좌 입금액</span>
                                    <span style={{ fontWeight: 800, fontSize: '18px', color: '#047857' }}>
                                        {formatCurrency(netAmount)}원
                                    </span>
                                </div>

                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                    🏦 입금 계좌: <strong>{req.bank_name} {req.account_no} ({req.account_holder})</strong>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedTaxRequest(null)}
                                style={{
                                    width: '100%',
                                    padding: '12px 0',
                                    backgroundColor: '#3b82f6',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    marginTop: '20px'
                                }}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
