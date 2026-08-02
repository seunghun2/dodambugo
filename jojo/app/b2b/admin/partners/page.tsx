'use client';

import { useState, useEffect } from 'react';
import { 
    IconSearch, 
    IconCheck, 
    IconX, 
    IconBan, 
    IconUserCheck,
    IconRefresh,
    IconDownload,
    IconSend,
    IconId
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
    last_bugo_at?: string | null;
    alarm_all?: boolean;
    alarm_deposit?: boolean;
    alarm_deceased?: boolean;
    alarm_notice?: boolean;
    company_id?: string | null;
    bugo_count?: number;
    total_views?: number;
    flower_sold_count?: number;
    
    // 본인인증 관련 추가 컬럼들
    identity_verified?: boolean;
    identity_name?: string;
    rrn_front?: string;
    rrn_back?: string;
    identity_type?: string;
    id_issue_date?: string | null;
    driver_license_no?: string | null;
    identity_phone?: string;
    id_card_url?: string;
    verification_status?: 'pending' | 'verified' | 'failed' | null;
    auto_payout_enabled?: boolean;
}

const getFullImageUrl = (url?: string) => {
    if (!url) return '';
    return url;
};

export default function PartnersPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // 필터 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // 개별 푸시 모달용 상태
    const [activePushPartner, setActivePushPartner] = useState<Partner | null>(null);
    const [pushTitle, setPushTitle] = useState('');
    const [pushBody, setPushBody] = useState('');
    const [pushLink, setPushLink] = useState('');
    const [sendingPush, setSendingPush] = useState(false);

    // 본인인증(실명/세무용 주민번호) 상세 조회 모달 상태
    const [activeVerifyPartner, setActiveVerifyPartner] = useState<Partner | null>(null);

    // 자동입금 (ON / OFF) 토글 변경 처리
    const handleToggleAutoPayout = async (partnerId: string, currentVal?: boolean) => {
        const newVal = !(currentVal ?? true);
        try {
            const res = await fetch('/api/b2b/admin/partners', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partnerId, auto_payout_enabled: newVal })
            });
            if (res.ok) {
                setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, auto_payout_enabled: newVal } : p));
                if (activeVerifyPartner && activeVerifyPartner.id === partnerId) {
                    setActiveVerifyPartner((prev: Partner | null) => prev ? { ...prev, auto_payout_enabled: newVal } : null);
                }
            } else {
                alert('자동입금 설정 변경에 실패했습니다.');
            }
        } catch {
            alert('설정 변경 중 오류가 발생했습니다.');
        }
    };

    // 개별 푸시 발송 처리
    const handleSendPushSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activePushPartner) return;
        if (!pushTitle.trim() || !pushBody.trim()) {
            alert('제목과 내용을 모두 입력해 주세요.');
            return;
        }

        setSendingPush(true);
        try {
            const token = localStorage.getItem('b2b_token');
            if (!token) {
                alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
                return;
            }

            const res = await fetch('/api/b2b/send-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    partner_id: activePushPartner.id,
                    title: pushTitle,
                    body: pushBody,
                    data: pushLink ? { url: pushLink } : undefined
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`[${activePushPartner.company_name}] 파트너에게 푸시 발송 성공!`);
                setActivePushPartner(null);
                setPushTitle('');
                setPushBody('');
                setPushLink('');
            } else {
                alert(data.error || '푸시 발송 중 오류가 발생했습니다.');
            }
        } catch (err: any) {
            alert(err.message || '네트워크 오류가 발생했습니다.');
        } finally {
            setSendingPush(false);
        }
    };

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

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/b2b/admin/companies');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setCompanies(data.companies);
                }
            }
        } catch (err) {
            console.error('상조회사 로드 실패:', err);
        }
    };

    useEffect(() => {
        fetchPartners();
        fetchCompanies();
    }, [searchQuery, statusFilter]);

    const handleCompanyChange = async (partnerId: string, companyId: string) => {
        try {
            const res = await fetch('/api/b2b/admin/partners', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerId,
                    companyId: companyId || null
                })
            });

            if (!res.ok) {
                throw new Error('소속 상조회사 변경에 실패했습니다.');
            }

            const data = await res.json();
            if (data.success) {
                alert('소속 상조회사가 변경되었습니다.');
                fetchPartners();
            } else {
                alert(data.error || '오류 발생');
            }
        } catch (err: any) {
            alert(err.message || '네트워크 오류');
        }
    };

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

    // 비밀번호 초기화 ('00000000' 기본값 설정)
    const handleResetPassword = async (partnerId: string, companyName: string) => {
        if (!confirm(`[${companyName}] 파트너의 비밀번호를 초기화하시겠습니까?\n초기화 시 비밀번호는 '00000000'(숫자 0 8자리)으로 변경됩니다.`)) {
            return;
        }

        try {
            const res = await fetch('/api/b2b/admin/partners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partnerId }),
            });

            if (!res.ok) {
                throw new Error('비밀번호 초기화에 실패했습니다.');
            }

            const data = await res.json();
            if (data.success) {
                alert(`비밀번호가 성공적으로 초기화되었습니다.\n초기화된 비밀번호: 00000000`);
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

    const getFullImageUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://seunghun2.supabase.co';
        return `${supabaseUrl}/storage/v1/object/public/b2b-id-cards/${url}`;
    };

    const getVerifyBadge = (p: Partner) => {
        if (p.identity_verified) {
            return <span className={`${styles.badge} ${styles.badgeApproved}`} style={{ cursor: 'pointer' }} onClick={() => setActiveVerifyPartner(p)}>인증성공</span>;
        }
        if (p.verification_status === 'failed') {
            return <span className={`${styles.badge} ${styles.badgeRejected}`} style={{ cursor: 'pointer' }} onClick={() => setActiveVerifyPartner(p)}>인증실패</span>;
        }
        return <span className={`${styles.badge} ${styles.badgePending}`} style={{ backgroundColor: '#e2e8f0', color: '#64748b', cursor: 'pointer' }} onClick={() => setActiveVerifyPartner(p)}>미인증</span>;
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

    // CSV/Excel 다운로드 기능 (세무 신고용 실명/주민번호/신분증 이미지 컬럼 대거 연동)
    const handleDownloadExcel = () => {
        if (partners.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = [
            '가입일시', '회사명', '대표자명', '연락처', '은행', '계좌번호', '예금주', 
            '예치금 잔고', '추천인 코드', '가입상태', '부고장 제작 건수', '부고장 누적 열람수', 
            '누적 화환 판매건수', '최근 들어온 일시',
            '본인인증 상태', '인증 실명', '주민등록번호(앞자리)', '주민등록번호(뒷자리)', 
            '인증 수단', '인증 상세 정보(발급일자/면허번호)', '인증용 연락처', '신분증 이미지 주소'
        ];
        
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
            p.status === 'pending' ? '승인대기' : p.status === 'approved' ? '승인완료' : p.status === 'rejected' ? '가입반려' : '계정차단',
            String(p.bugo_count || 0),
            String(p.total_views || 0),
            String(p.flower_sold_count || 0),
            p.last_bugo_at ? formatDate(p.last_bugo_at) : '-',
            p.identity_verified ? '인증성공' : (p.verification_status === 'failed' ? '인증실패' : '미인증'),
            p.identity_name || '-',
            p.rrn_front || '-',
            p.rrn_back || '-',
            p.identity_type || '-',
            p.identity_type === '주민등록증' ? (p.id_issue_date || '-') : (p.driver_license_no || '-'),
            p.identity_phone ? formatPhone(p.identity_phone) : '-',
            p.id_card_url ? getFullImageUrl(p.id_card_url) : '-'
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
        link.setAttribute('download', `b2b_partners_tax_list_${dateStr}.csv`);
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
                        <span>세무용 개인정보 일괄 다운로드</span>
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
                                    <th>회사 / 소속</th>
                                    <th>대표자 정보</th>
                                    <th>본인인증</th>
                                    <th>정산 / 예치금 잔고</th>
                                    <th>추천코드 / 알림</th>
                                    <th>상태</th>
                                    <th>활동 통계</th>
                                    <th>액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {partners.map((partner) => (
                                    <tr key={partner.id}>
                                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                                            {formatDate(partner.created_at)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <span style={{ fontWeight: '600', color: '#0f172a' }}>{partner.company_name}</span>
                                                <select
                                                    value={partner.company_id || ''}
                                                    onChange={(e) => handleCompanyChange(partner.id, e.target.value)}
                                                    className={styles.companySelect}
                                                    style={{
                                                        padding: '4px 6px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #cbd5e1',
                                                        fontSize: '12px',
                                                        color: '#334155',
                                                        outline: 'none',
                                                        backgroundColor: '#ffffff',
                                                        maxWidth: '140px'
                                                    }}
                                                >
                                                    <option value="">소속 없음</option>
                                                    {companies.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontWeight: '500' }}>{partner.owner_name}</span>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>{formatPhone(partner.phone)}</span>
                                            </div>
                                        </td>
                                        <td>{getVerifyBadge(partner)}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
                                                    {formatCurrency(partner.balance)}원
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'normal', maxWidth: '200px' }}>
                                                    {partner.bank_name ? (
                                                        `${partner.bank_name} ${partner.account_no} (${partner.account_holder})`
                                                    ) : (
                                                        <span style={{ color: '#cbd5e1' }}>계좌 미등록</span>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px', color: '#334155' }}>
                                                    {partner.my_referral_code}
                                                </span>
                                                <div className={styles.alarmBadgeContainer}>
                                                    {partner.alarm_all ? (
                                                        <span className={`${styles.alarmMiniBadge} ${styles.alarmBadgeActive}`}>전체</span>
                                                    ) : (
                                                        <>
                                                            <span className={`${styles.alarmMiniBadge} ${partner.alarm_deposit ? styles.alarmBadgeActive : styles.alarmBadgeInactive}`}>정산</span>
                                                            <span className={`${styles.alarmMiniBadge} ${partner.alarm_deceased ? styles.alarmBadgeActive : styles.alarmBadgeInactive}`}>부고</span>
                                                            <span className={`${styles.alarmMiniBadge} ${partner.alarm_notice ? styles.alarmBadgeActive : styles.alarmBadgeInactive}`}>공지</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{getStatusBadge(partner.status)}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', color: '#475569', minWidth: '130px' }}>
                                                <div>개설: <span style={{ fontWeight: '600', color: '#0f172a' }}>{partner.bugo_count || 0}건</span></div>
                                                <div>열람: <span style={{ fontWeight: '600', color: '#0f172a' }}>{(partner.total_views || 0).toLocaleString()}회</span></div>
                                                <div>화환: <span style={{ fontWeight: '600', color: '#0f172a' }}>{partner.flower_sold_count || 0}건</span></div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                    최근: {partner.last_bugo_at ? formatDate(partner.last_bugo_at).split(' ')[0] : '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.btnGroup}>
                                                <button 
                                                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                    style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                                                    onClick={() => setActiveVerifyPartner(partner)}
                                                    title="본인인증 상세 정보 조회"
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <IconId stroke={1.5} size={14} />
                                                        <span>인증 정보</span>
                                                    </div>
                                                </button>
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
                                                <button 
                                                    className={`${styles.actionBtn} ${styles.resetPwBtn}`}
                                                    onClick={() => handleResetPassword(partner.id, partner.company_name)}
                                                    title="비밀번호 초기화"
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <IconRefresh stroke={1.5} size={14} />
                                                        <span>비번 초기화</span>
                                                    </div>
                                                </button>
                                                <button 
                                                    className={`${styles.actionBtn} ${styles.pushBtn}`}
                                                    onClick={() => setActivePushPartner(partner)}
                                                    title="개별 푸시 발송"
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <IconSend stroke={1.5} size={14} />
                                                        <span>푸시 발송</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* 본인인증 상세 정보 조회 모달 */}
            {activeVerifyPartner && (
                <div className={styles.modalOverlay} onClick={() => setActiveVerifyPartner(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>B2B 파트너 본인인증 상세정보</h3>
                            <button className={styles.modalClose} onClick={() => setActiveVerifyPartner(null)}>
                                <IconX size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody} style={{ fontSize: '14px', lineHeight: '1.6', color: '#1e293b' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #f1f3f5', backgroundColor: '#f8fafc', borderRadius: '8px', margin: '4px 0' }}>
                                    <div>
                                        <span style={{ color: '#1e293b', fontWeight: '700', fontSize: '14px' }}>수당 자동입금 설정</span>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                            {(activeVerifyPartner.auto_payout_enabled ?? true) ? 'ON: 파트너 출금 시 즉시 이체됨' : 'OFF: 어드민 승인(보류) 대기됨'}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleAutoPayout(activeVerifyPartner.id, activeVerifyPartner.auto_payout_enabled)}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            fontWeight: 'bold',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            backgroundColor: (activeVerifyPartner.auto_payout_enabled ?? true) ? '#10b981' : '#64748b',
                                            color: '#ffffff',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {(activeVerifyPartner.auto_payout_enabled ?? true) ? '자동입금 ON' : '자동입금 OFF'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
                                    <span style={{ color: '#64748b' }}>회사명</span>
                                    <span style={{ fontWeight: '600' }}>{activeVerifyPartner.company_name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
                                    <span style={{ color: '#64748b' }}>본인인증 상태</span>
                                    <span>
                                        {activeVerifyPartner.identity_verified ? (
                                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>인증완료</span>
                                        ) : (
                                            activeVerifyPartner.verification_status === 'failed' ? (
                                                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>인증실패</span>
                                            ) : (
                                                <span style={{ color: '#64748b', fontWeight: 'bold' }}>미인증</span>
                                            )
                                        )}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
                                    <span style={{ color: '#64748b' }}>인증성명 (실명)</span>
                                    <span style={{ fontWeight: '600' }}>{activeVerifyPartner.identity_name || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
                                    <span style={{ color: '#64748b' }}>주민등록번호</span>
                                    <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                                        {activeVerifyPartner.rrn_front ? `${activeVerifyPartner.rrn_front}-${activeVerifyPartner.rrn_back || '*******'}` : '-'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
                                    <span style={{ color: '#64748b' }}>인증 수단</span>
                                    <span style={{ fontWeight: '600' }}>{activeVerifyPartner.identity_type || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
                                    <span style={{ color: '#64748b' }}>발급일자 / 면허번호</span>
                                    <span style={{ fontWeight: '600' }}>
                                        {activeVerifyPartner.identity_type === '주민등록증' ? (activeVerifyPartner.id_issue_date || '-') : (activeVerifyPartner.driver_license_no || '-')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
                                    <span style={{ color: '#64748b' }}>본인 휴대폰 번호</span>
                                    <span style={{ fontWeight: '600' }}>{activeVerifyPartner.identity_phone ? formatPhone(activeVerifyPartner.identity_phone) : '-'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
                                    <span style={{ color: '#64748b' }}>제출한 신분증 이미지</span>
                                    {activeVerifyPartner.id_card_url ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <a 
                                                href={getFullImageUrl(activeVerifyPartner.id_card_url)} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'underline', fontSize: '13px' }}
                                            >
                                                새창에서 신분증 원본 보기 ↗
                                            </a>
                                            <img 
                                                src={getFullImageUrl(activeVerifyPartner.id_card_url)} 
                                                alt="신분증 원본" 
                                                style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', padding: '4px' }}
                                                onError={(e) => {
                                                    // 로컬 업로드 이미지 호환 렌더링
                                                    const target = e.currentTarget;
                                                    if (activeVerifyPartner.id_card_url) {
                                                        target.src = activeVerifyPartner.id_card_url.startsWith('/') ? activeVerifyPartner.id_card_url : `/${activeVerifyPartner.id_card_url}`;
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <span style={{ color: '#94a3b8' }}>업로드된 신분증 이미지 없음</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 출금 내역 로그 */}
                        <div className={styles.modalBody} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                            <WithdrawalLogs partnerId={activeVerifyPartner.id} />
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.btnSecondary} onClick={() => setActiveVerifyPartner(null)}>
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 개별 푸시 발송 모달 */}
            {activePushPartner && (
                <div className={styles.modalOverlay} onClick={() => setActivePushPartner(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>개별 푸시 알림 발송</h3>
                            <button className={styles.modalClose} onClick={() => setActivePushPartner(null)}>
                                <IconX size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSendPushSubmit} className={styles.modalForm}>
                            <div className={styles.modalBody}>
                                <div style={{ marginBottom: '16px', fontSize: '14px', color: '#475569' }}>
                                    수신처: <strong>{activePushPartner.company_name}</strong> ({activePushPartner.owner_name} 대표님)
                                </div>
                                
                                <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                                    <label htmlFor="push_title">푸시 제목</label>
                                    <input
                                        type="text"
                                        id="push_title"
                                        className={styles.formInput}
                                        placeholder="예: [안내] 예치금 정산 완료 알림"
                                        value={pushTitle}
                                        onChange={(e) => setPushTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                                    <label htmlFor="push_body">푸시 본문 내용</label>
                                    <textarea
                                        id="push_body"
                                        className={styles.formTextarea}
                                        placeholder="예: 오늘자 정산 금액 350,000원이 예치금 잔액에 정상 반영되었습니다."
                                        value={pushBody}
                                        onChange={(e) => setPushBody(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="push_link">이동 경로 URL (선택)</label>
                                    <input
                                        type="text"
                                        id="push_link"
                                        className={styles.formInput}
                                        placeholder="예: /b2b/wallet (미입력 시 홈으로 이동)"
                                        value={pushLink}
                                        onChange={(e) => setPushLink(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button 
                                    type="button" 
                                    className={styles.btnSecondary} 
                                    onClick={() => setActivePushPartner(null)}
                                    disabled={sendingPush}
                                >
                                    취소
                                </button>
                                <button 
                                    type="submit" 
                                    className={styles.btnPrimary}
                                    disabled={sendingPush}
                                >
                                    {sendingPush ? '발송 중...' : '푸시 발송하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// 개별 파트너 출금 내역 로그 컴포넌트
function WithdrawalLogs({ partnerId }: { partnerId: string }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/b2b/admin/withdrawal-logs?partnerId=${partnerId}`);
                const data = await res.json();
                setLogs(data.logs || []);
            } catch {
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [partnerId]);

    const statusLabel = (s: string) => {
        switch (s) {
            case 'approved': return { text: '지급완료', color: '#10b981' };
            case 'pending': return { text: '대기중', color: '#f59e0b' };
            case 'rejected': return { text: '거절', color: '#ef4444' };
            default: return { text: s, color: '#64748b' };
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>출금 내역 불러오는 중...</div>;
    }

    if (logs.length === 0) {
        return <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>출금 내역이 없습니다.</div>;
    }

    return (
        <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>출금 내역 ({logs.length}건)</div>
            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>일시</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>신청금액</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>실수령액</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log: any) => {
                            const st = statusLabel(log.status);
                            const dt = new Date(log.created_at);
                            const dateStr = `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
                            return (
                                <tr key={log.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                    <td style={{ padding: '8px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{dateStr}</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '600', fontFamily: 'monospace' }}>{(log.amount || 0).toLocaleString()}원</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{(log.net_amount || 0).toLocaleString()}원</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                        <span style={{ color: st.color, fontWeight: '700', fontSize: '11px' }}>{st.text}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
