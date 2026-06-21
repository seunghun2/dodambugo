'use client';

import { useState, useEffect } from 'react';
import { 
    IconSearch, 
    IconCheck, 
    IconX, 
    IconBan, 
    IconUserCheck,
    IconRefresh,
    IconDownload
} from '@tabler/icons-react';
import styles from './partners.module.css';

interface Partner {
    id: string;
    phone: string;
    company_name: string;
    owner_name: string;
    bank_name?: string;
    account_no?: string;
    account_holder?: string;
    my_referral_code: string;
    status: 'pending' | 'approved' | 'rejected' | 'blocked';
    created_at: string;
    balance: number;
}

export default function PartnersPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // 필터 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPartners = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const res = await fetch(`/api/b2b/admin/partners?${params.toString()}`);
            if (!res.ok) {
                throw new Error('파트너 데이터를 가져오는데 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                setPartners(data.partners);
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
        fetchPartners();
    }, [searchQuery, statusFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchTerm);
    };

    // 파트너 상태 업데이트
    const updatePartnerStatus = async (partnerId: string, newStatus: string) => {
        const confirmMsg = 
            newStatus === 'approved' ? '가입을 승인하시겠습니까?' :
            newStatus === 'rejected' ? '가입을 반려하시겠습니까?' :
            newStatus === 'blocked' ? '계정을 일시 정지/차단하시겠습니까?' : '계정 차단을 해제하시겠습니까?';

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch('/api/b2b/admin/partners', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partnerId, status: newStatus === 'unblocked' ? 'approved' : newStatus }),
            });

            if (!res.ok) {
                throw new Error('상태 변경에 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                alert('정상적으로 처리되었습니다.');
                fetchPartners();
            } else {
                alert(data.error || '오류가 발생했습니다.');
            }
        } catch (err: any) {
            alert(err.message || '네트워크 오류가 발생했습니다.');
        }
    };

    const getStatusBadge = (status: Partner['status']) => {
        switch (status) {
            case 'pending':
                return <span className={`${styles.badge} ${styles.badgePending}`}>승인대기</span>;
            case 'approved':
                return <span className={`${styles.badge} ${styles.badgeApproved}`}>승인완료</span>;
            case 'rejected':
                return <span className={`${styles.badge} ${styles.badgeRejected}`}>가입반려</span>;
            case 'blocked':
                return <span className={`${styles.badge} ${styles.badgeBlocked}`}>계정차단</span>;
            default:
                return null;
        }
    };

    const formatCurrency = (n: number) => new Intl.NumberFormat('ko-KR').format(n);
    const formatPhone = (p: string) => {
        const clean = p.replace(/[^0-9]/g, '');
        if (clean.length === 11) {
            return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
        }
        return p;
    };
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // CSV/Excel 다운로드 기능 (UTF-8 BOM 헤더 포함)
    const handleDownloadExcel = () => {
        if (partners.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['가입일시', '회사명', '대표자명', '연락처', '은행', '계좌번호', '예금주', '예치금 잔고', '나의 추천인 코드', '가입상태'];
        const rows = partners.map(p => [
            formatDate(p.created_at),
            p.company_name,
            p.owner_name,
            formatPhone(p.phone),
            p.bank_name || '미등록',
            p.account_no || '미등록',
            p.account_holder || '미등록',
            String(p.balance),
            p.my_referral_code,
            p.status === 'pending' ? '승인대기' : p.status === 'approved' ? '승인완료' : p.status === 'rejected' ? '가입반려' : '계정차단'
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
        link.setAttribute('download', `b2b_partners_list_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>B2B 파트너 관리</h1>
                <p className={styles.subtitle}>B2B 파트너(지도사)의 가입 승인 및 계정 활성화 상태를 관리합니다.</p>
            </div>

            <div className={styles.filterBar}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="회사명, 대표자명, 연락처 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <select
                        className={styles.selectInput}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">모든 가입 상태</option>
                        <option value="pending">승인 대기</option>
                        <option value="approved">승인 완료</option>
                        <option value="rejected">가입 반려</option>
                        <option value="blocked">계정 차단</option>
                    </select>

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
                            파트너 목록을 불러오는 중...
                        </div>
                    ) : partners.length === 0 ? (
                        <div className={styles.emptyState}>조회할 파트너가 없습니다.</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>가입일시</th>
                                    <th>회사명</th>
                                    <th>대표자</th>
                                    <th>연락처</th>
                                    <th>정산 계좌 정보</th>
                                    <th>예치금 잔고</th>
                                    <th>추천인 코드</th>
                                    <th>상태</th>
                                    <th>액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {partners.map((partner) => (
                                    <tr key={partner.id}>
                                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                                            {formatDate(partner.created_at)}
                                        </td>
                                        <td style={{ fontWeight: '600' }}>{partner.company_name}</td>
                                        <td>{partner.owner_name}</td>
                                        <td>{formatPhone(partner.phone)}</td>
                                        <td style={{ fontSize: '13px', color: '#475569' }}>
                                            {partner.bank_name ? (
                                                `${partner.bank_name} ${partner.account_no} (${partner.account_holder})`
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>미등록</span>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#0f172a' }}>
                                            {formatCurrency(partner.balance)}원
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                            {partner.my_referral_code}
                                        </td>
                                        <td>{getStatusBadge(partner.status)}</td>
                                        <td>
                                            <div className={styles.btnGroup}>
                                                {partner.status === 'pending' && (
                                                    <>
                                                        <button 
                                                            className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                            onClick={() => updatePartnerStatus(partner.id, 'approved')}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <IconCheck stroke={1.5} size={14} />
                                                                <span>승인</span>
                                                            </div>
                                                        </button>
                                                        <button 
                                                            className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                            onClick={() => updatePartnerStatus(partner.id, 'rejected')}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <IconX stroke={1.5} size={14} />
                                                                <span>반려</span>
                                                            </div>
                                                        </button>
                                                    </>
                                                )}
                                                {partner.status === 'approved' && (
                                                    <button 
                                                        className={`${styles.actionBtn} ${styles.blockBtn}`}
                                                        onClick={() => updatePartnerStatus(partner.id, 'blocked')}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <IconBan stroke={1.5} size={14} />
                                                            <span>차단</span>
                                                        </div>
                                                    </button>
                                                )}
                                                {partner.status === 'blocked' && (
                                                    <button 
                                                        className={`${styles.actionBtn} ${styles.unblockBtn}`}
                                                        onClick={() => updatePartnerStatus(partner.id, 'unblocked')}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <IconUserCheck stroke={1.5} size={14} />
                                                            <span>차단 해제</span>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
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
