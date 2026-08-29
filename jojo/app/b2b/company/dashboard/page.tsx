'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IconPrinter, IconDownload, IconLogout, IconBuilding, IconListCheck, IconChevronLeft, IconChevronRight, IconUsers } from '@tabler/icons-react';
import styles from './dashboard.module.css';
import './dashboard-print.css';

interface User {
    id: string;
    phone: string;
    company_name: string;
    owner_name: string;
    company_id: string;
}

export default function CompanyDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 정산 데이터 상태
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [settleSummary, setSettleSummary] = useState<any>({ pending_amount: 0, completed_amount: 0, total_count: 0 });
    const [settleMonthlyList, setSettleMonthlyList] = useState<any[]>([]);
    const [settleDetails, setSettleDetails] = useState<any[]>([]);
    const [condolenceDetails, setCondolenceDetails] = useState<any[]>([]);
    const [settleSelectedMonth, setSettleSelectedMonth] = useState<string | null>(null);
    const [settleLoading, setSettleLoading] = useState(false);
    const [settleDetailLoading, setSettleDetailLoading] = useState(false);

    // 인증 검증 및 유저 로드
    useEffect(() => {
        const token = localStorage.getItem('b2b_token');
        const userStr = localStorage.getItem('b2b_user');
        if (!token || !userStr) {
            router.push('/b2b/company/login');
            return;
        }

        try {
            const parsed = JSON.parse(userStr);
            if (!parsed.company_id) {
                alert('본사 관리자 계정이 아닙니다.');
                localStorage.removeItem('b2b_token');
                localStorage.removeItem('b2b_user');
                router.push('/b2b/company/login');
                return;
            }
            setUser(parsed);
            setLoading(false);
        } catch {
            router.push('/b2b/company/login');
        }
    }, [router]);

    // 세부 정산서 로드
    const fetchSettleMonthlyDetail = useCallback(async (yearMonth: string, companyId: string) => {
        setSettleDetailLoading(true);
        setSettleSelectedMonth(yearMonth);
        try {
            const token = localStorage.getItem('b2b_token');
            const res = await fetch(`/api/b2b/admin/companies/settlements?companyId=${companyId}&yearMonth=${yearMonth}`, {
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSettleDetails(data.settlements || []);
                    setCondolenceDetails(data.condolenceSettlements || []);
                    if (data.company) {
                        setCompanyInfo(data.company);
                    }
                }
            }
        } catch (err) {
            console.error('세부 내역 로드 에러:', err);
        } finally {
            setSettleDetailLoading(false);
        }
    }, []);

    // 월별 장부 목록 로드
    const fetchSettleMonthlyList = useCallback(async (companyId: string) => {
        setSettleLoading(true);
        try {
            const token = localStorage.getItem('b2b_token');
            const res = await fetch(`/api/b2b/admin/companies/settlements?companyId=${companyId}`, {
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSettleSummary(data.summary);
                    setSettleMonthlyList(data.monthlyList || []);
                    if (data.company) {
                        setCompanyInfo(data.company);
                    }
                    if (data.monthlyList && data.monthlyList.length > 0) {
                        fetchSettleMonthlyDetail(data.monthlyList[0].month, companyId);
                    } else {
                        const now = new Date();
                        const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                        setSettleSelectedMonth(curMonth);
                    }
                }
            }
        } catch (err) {
            console.error('월별 장부 로드 에러:', err);
        } finally {
            setSettleLoading(false);
        }
    }, [fetchSettleMonthlyDetail]);

    // 유저 정보 세팅 완료 시 정산 데이터 바인딩
    useEffect(() => {
        if (user?.company_id) {
            fetchSettleMonthlyList(user.company_id);
        }
    }, [user, fetchSettleMonthlyList]);

    // 이전 달 / 다음 달 이동
    const handlePrevMonth = () => {
        if (!settleSelectedMonth || !user?.company_id) return;
        const [year, month] = settleSelectedMonth.split('-').map(Number);
        const prevDate = new Date(year, month - 2, 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
        const prevKey = `${prevYear}-${prevMonth}`;
        fetchSettleMonthlyDetail(prevKey, user.company_id);
    };

    const handleNextMonth = () => {
        if (!settleSelectedMonth || !user?.company_id) return;
        const [year, month] = settleSelectedMonth.split('-').map(Number);
        const nextDate = new Date(year, month, 1);
        const nextYear = nextDate.getFullYear();
        const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nextKey = `${nextYear}-${nextMonth}`;
        fetchSettleMonthlyDetail(nextKey, user.company_id);
    };

    // 로그아웃
    const handleLogout = () => {
        localStorage.removeItem('b2b_token');
        localStorage.removeItem('b2b_user');
        router.push('/b2b/company/login');
    };

    // 인쇄
    const handlePrint = () => {
        window.print();
    };

    // 엑셀 다운로드 (CSV: 화환 + 부의금 통합)
    const handleDownloadCSV = () => {
        if (!settleSelectedMonth || !user) {
            alert('다운로드할 정산월이 선택되지 않았습니다.');
            return;
        }

        const [year, month] = settleSelectedMonth.split('-');
        const headers = ['구분', '거래일시', '주문번호', '장례지도사명', '고인명(상가)', '상품/내역', '주문/조문객', '정산 금액', '정산 상태'];
        
        const flowerRows = settleDetails.map(s => [
            '화환',
            new Date(s.created_at).toLocaleString(),
            s.order?.order_number || '-',
            s.order?.partner_name || '-',
            s.order?.deceased_name || '-',
            s.order?.product_name || '-',
            s.order?.sender_name || '-',
            s.amount,
            s.status === 'pending' ? '정산대기' : s.status === 'cancelled' ? '주문취소' : '정산완료'
        ]);

        const condolenceRows = condolenceDetails.map(c => [
            '부의금',
            new Date(c.created_at).toLocaleString(),
            c.order_number || '-',
            c.partner_name || '-',
            c.deceased_name || '-',
            `부의금 수수료 쉐어 (${c.company_rate}%)`,
            c.buyer_name || '-',
            c.share_amount,
            c.status === 'pending' ? '정산대기' : '정산완료'
        ]);

        const allRows = [...flowerRows, ...condolenceRows];

        const csvContent = 
            '\ufeff' + 
            [headers.join(','), ...allRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.setAttribute('href', url);
        link.setAttribute('download', `본사정산서_${user.company_name}_${year}년_${month}월.csv`);
        link.style.visibility = 'hidden';
        
        const flowerPending = settleDetails.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);
        const flowerCompleted = settleDetails.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0);
        const condolencePending = condolenceDetails.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.share_amount, 0);
        const condolenceCompleted = condolenceDetails.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.share_amount, 0);
        const totalPending = flowerPending + condolencePending;
        const totalCompleted = flowerCompleted + condolenceCompleted;
        const totalAmount = totalPending + totalCompleted;
        const hasPending = totalPending > 0;
        const latestPaymentDate = settleDetails[0]?.payment_date || condolenceDetails[0]?.payment_date;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#64748b' }}>
                인증 정보 확인 중...
            </div>
        );
    }

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const flowerPending = settleDetails.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);
    const flowerCompleted = settleDetails.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0);
    const condolencePending = condolenceDetails.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.share_amount, 0);
    const condolenceCompleted = condolenceDetails.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.share_amount, 0);
    const totalPending = flowerPending + condolencePending;
    const totalCompleted = flowerCompleted + condolenceCompleted;
    const totalAmount = totalPending + totalCompleted;
    const isSettled = totalCompleted > 0 && totalPending === 0;
    const latestPaymentDate = settleDetails[0]?.payment_date || condolenceDetails[0]?.payment_date;

    return (
        <div className={styles.appContainer}>
            {/* 좌측 사이드바 */}
            <aside className={`${styles.sidebar} no-print`}>
                <div className={styles.sidebarBrand}>
                    <IconBuilding size={24} className={styles.brandIcon} />
                    <div>
                        <h2 className={styles.sidebarTitle}>{user.company_name}</h2>
                        <span className={styles.sidebarSubtitle}>상조본사 관리자</span>
                    </div>
                </div>

                <nav className={styles.sidebarNav}>
                    <div className={`${styles.navItem} ${styles.navItemActive}`}>
                        <IconListCheck size={20} />
                        <span>정산서 조회</span>
                    </div>
                    <div 
                        className={styles.navItem} 
                        onClick={() => alert(`[${user.company_name}] 소속 지도사(팀원) 계정 발급 및 관리는 본사 관리자 승인 절차에 따라 진행됩니다.\n계정 발급 및 추가 문의는 마스터 관리자에게 문의해 주세요.`)}
                        style={{ cursor: 'pointer' }}
                    >
                        <IconUsers size={20} />
                        <span>소속 지도사(팀원) 관리</span>
                    </div>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.owner_name}님</span>
                        <span className={styles.userPhone}>{user.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</span>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <IconLogout size={18} />
                        <span>로그아웃</span>
                    </button>
                </div>
            </aside>

            {/* 본문 콘텐츠 */}
            <main className={styles.mainContent}>
                {/* 상단 액션 바 (인쇄 제외) */}
                <div className={`${styles.actionBar} no-print`}>
                    <div>
                        <h1 className={styles.pageTitle}>본사 정산 명세 조회</h1>
                        <p className={styles.pageSubtitle}>귀사 소속 파트너를 통한 화환 및 부의금 거래 정산 내역을 통합 조회하고 관리합니다.</p>
                    </div>
                    <div className={styles.actionButtons}>
                        <button onClick={handlePrint} className={styles.printBtn}>
                            <IconPrinter size={18} />
                            <span>정산서 인쇄</span>
                        </button>
                        <button onClick={handleDownloadCSV} className={styles.downloadBtn}>
                            <IconDownload size={18} />
                            <span>엑셀 내보내기</span>
                        </button>
                    </div>
                </div>

                {/* 1. 정산 및 세금계산서 발행 안내 배너 (인쇄 제외) */}
                <div className={`${styles.noticeBanner} no-print`}>
                    <div className={styles.noticeTitle}>정산 및 세금계산서 발행 안내</div>
                    <ul className={styles.noticeList}>
                        <li>당월(1일 ~ 말일)에 발생한 정산 내역은 <strong>익월 10일 이전</strong>까지 확인 후 당사로 세금계산서를 발행해 주시기 바랍니다.</li>
                        <li>전자세금계산서 발행 확인 후 <strong>익월 15일 이내</strong>에 등록된 지정 계좌로 정산 대금이 지급됩니다.</li>
                    </ul>
                </div>

                {/* 2. KPI 요약 위젯 카드 (인쇄 제외) */}
                <div className={`${styles.statsGrid} no-print`}>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>미지급 정산 대금</span>
                        <div className={styles.statValueRow}>
                            <span className={`${styles.statValue} ${styles.pendingColor}`}>{settleSummary.pending_amount.toLocaleString()}</span>
                            <span className={styles.statUnit}>원</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>지급 완료 대금</span>
                        <div className={styles.statValueRow}>
                            <span className={`${styles.statValue} ${styles.completedColor}`}>{settleSummary.completed_amount.toLocaleString()}</span>
                            <span className={styles.statUnit}>원</span>
                        </div>
                    </div>
                </div>

                {/* 3. 상단 정산 대상월 필터 바 (인쇄 제외) */}
                <div className={`${styles.filterBar} no-print`}>
                    <div className={styles.filterGroup}>
                        <span className={styles.filterLabel}>정산 대상월 :</span>
                        <div className={styles.monthNavBox}>
                            <button 
                                type="button" 
                                onClick={handlePrevMonth} 
                                className={styles.monthNavBtn} 
                                title="이전 달 조회"
                            >
                                <IconChevronLeft size={16} />
                            </button>
                            <span className={styles.monthDisplayText}>
                                {settleSelectedMonth ? `${settleSelectedMonth.split('-')[0]}년 ${parseInt(settleSelectedMonth.split('-')[1], 10)}월` : '-'}
                            </span>
                            <button 
                                type="button" 
                                onClick={handleNextMonth} 
                                className={styles.monthNavBtn} 
                                title="다음 달 조회"
                            >
                                <IconChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.filterGroup}>
                        <button
                            type="button"
                            className={`${styles.quickBtn} ${settleSelectedMonth === currentMonthKey ? styles.quickBtnActive : ''}`}
                            onClick={() => fetchSettleMonthlyDetail(currentMonthKey, user.company_id)}
                        >
                            이번 달
                        </button>
                        <button
                            type="button"
                            className={`${styles.quickBtn} ${settleSelectedMonth === prevMonthKey ? styles.quickBtnActive : ''}`}
                            onClick={() => fetchSettleMonthlyDetail(prevMonthKey, user.company_id)}
                        >
                            지난 달
                        </button>
                    </div>
                </div>

                {/* 정산 장부 및 세부 내역 영역 (풀와이드 단일 레이아웃) */}
                <div className={styles.contentLayout}>
                    <div className={styles.sheetCard}>
                        {settleSelectedMonth ? (
                            <div className={styles.invoiceSheet}>
                                {/* 명세 타이틀 (순수 고유 정산서 문서 양식) */}
                                <div className={styles.invoiceTitleBlock}>
                                    <h2 className={styles.invoiceMainTitle}>정 산 서</h2>
                                    <span className={styles.invoiceSubTitle}>
                                        정산 대상월 : {settleSelectedMonth.split('-')[0]}년 {settleSelectedMonth.split('-')[1]}월분
                                    </span>
                                </div>

                                    {/* 공급자 & 공급받는자 영수 명세 */}
                                    <div className={styles.partiesBlock}>
                                        <div className={styles.partyBox}>
                                            <span className={styles.partyLabel}>■ 공급받는자</span>
                                            <table className={styles.miniTable}>
                                                <tbody>
                                                    <tr>
                                                        <td className={styles.miniTh}>등록번호</td>
                                                        <td className={styles.miniTd}>{companyInfo?.business_no || '미등록'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className={styles.miniTh}>상호(법인명)</td>
                                                        <td className={styles.miniTd}>{companyInfo?.name || user.company_name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className={styles.miniTh}>성명(대표자)</td>
                                                        <td className={styles.miniTd}>{companyInfo?.owner_name || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className={styles.miniTh}>사업장 주소</td>
                                                        <td className={styles.miniTd}>{companyInfo?.address || '미등록'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className={styles.miniTh}>업태 / 종목</td>
                                                        <td className={styles.miniTd}>
                                                            {companyInfo?.business_type || '-'} / {companyInfo?.business_item || '-'}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className={styles.partyBox}>
                                            <span className={styles.partyLabel}>■ 공급자</span>
                                            <table className={styles.miniTable}>
                                                <tbody>
                                                    <tr>
                                                        <td className={styles.miniTh}>등록번호</td>
                                                        <td className={styles.miniTd}>408-22-68851</td>
                                                    </tr>
                                                    <tr>
                                                        <td className={styles.miniTh}>상호(법인명)</td>
                                                        <td className={styles.miniTd}>마음부고</td>
                                                    </tr>
                                                    <tr>
                                                        <td className={styles.miniTh}>성명(대표자)</td>
                                                        <td className={styles.miniTd}>김미연</td>
                                                    </tr>
                                                    <tr>
                                                        <td className={styles.miniTh}>사업장 주소</td>
                                                        <td className={styles.miniTd}>서울특별시 강남구 압구정로 306</td>
                                                    </tr>
                                                    <tr>
                                                        <td className={styles.miniTh}>업태 / 종목</td>
                                                        <td className={styles.miniTd}>서비스업 / 정보통신업, 모바일 플랫폼</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 간이 정산 거래 명세 조건표 */}
                                    <table className={styles.summaryTable}>
                                        <tbody>
                                            <tr>
                                                <td className={styles.summaryTh}>정산 상태</td>
                                                <td className={styles.summaryTd} style={{ fontWeight: 'bold', color: '#0f172a' }}>
                                                    {isSettled ? '정산 완료 (지급완료)' : '정산 대기'}
                                                </td>
                                                <td className={styles.summaryTh}>지급일자</td>
                                                <td className={styles.summaryTd}>
                                                    {isSettled && latestPaymentDate ? new Date(latestPaymentDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '지급 대기'}
                                                </td>
                                                <td className={styles.summaryTh}>합계 금액</td>
                                                <td className={styles.summaryTd} style={{ fontWeight: 'bold' }}>{totalAmount.toLocaleString()}원</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* 1. 화환 세부 판매 거래 목록 */}
                                    <div style={{ marginTop: '24px' }}>
                                        <span className={styles.partyLabel}>■ 화환 판매 정산 세부 내역 명세</span>
                                        <div className={styles.detailTableWrapper}>
                                            <table className={styles.detailTable}>
                                                <thead>
                                                    <tr>
                                                        <th>결제 일시</th>
                                                        <th>주문 번호</th>
                                                        <th>장례지도사</th>
                                                        <th>고인명(상가)</th>
                                                        <th>화환 상품명 (주문자)</th>
                                                        <th style={{ textAlign: 'right' }}>정산 금액</th>
                                                        <th style={{ textAlign: 'center' }}>상태</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {settleDetailLoading ? (
                                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>상세 내역을 불러오는 중...</td></tr>
                                                    ) : settleDetails.length === 0 ? (
                                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>해당 월에 발생한 화환 판매 내역이 없습니다.</td></tr>
                                                    ) : (
                                                        settleDetails.map(s => (
                                                            <tr key={s.id}>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    {new Date(s.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                </td>
                                                                <td style={{ fontFamily: 'monospace', textAlign: 'center' }}>{s.order?.order_number || '-'}</td>
                                                                <td style={{ textAlign: 'center' }}>{s.order?.partner_name || '-'}</td>
                                                                <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{s.order?.deceased_name || '-'}</td>
                                                                <td>{s.order?.product_name} <span style={{ fontSize: '11px', color: '#000000', marginLeft: '4px' }}>({s.order?.sender_name})</span></td>
                                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{s.amount.toLocaleString()}원</td>
                                                                <td style={{ textAlign: 'center' }}>{s.status === 'pending' ? '대기' : s.status === 'cancelled' ? '취소' : '완료'}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 2. 부의금 세부 정산 내역 목록 */}
                                    <div style={{ marginTop: '28px' }}>
                                        <span className={styles.partyLabel}>■ 부의금 정산 세부 내역 명세</span>
                                        <div className={styles.detailTableWrapper}>
                                            <table className={styles.detailTable}>
                                                <thead>
                                                    <tr>
                                                        <th>결제 일시</th>
                                                        <th>주문 번호</th>
                                                        <th>장례지도사</th>
                                                        <th>고인명(상가)</th>
                                                        <th>부의금액 (조문객)</th>
                                                        <th style={{ textAlign: 'center' }}>수수료율</th>
                                                        <th style={{ textAlign: 'right' }}>정산 금액</th>
                                                        <th style={{ textAlign: 'center' }}>상태</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {settleDetailLoading ? (
                                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>상세 내역을 불러오는 중...</td></tr>
                                                    ) : condolenceDetails.length === 0 ? (
                                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>해당 월에 발생한 부의금 정산 내역이 없습니다.</td></tr>
                                                    ) : (
                                                        condolenceDetails.map(c => (
                                                            <tr key={c.id}>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    {new Date(c.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                </td>
                                                                <td style={{ fontFamily: 'monospace', textAlign: 'center' }}>{c.order_number || '-'}</td>
                                                                <td style={{ textAlign: 'center' }}>{c.partner_name || '-'}</td>
                                                                <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{c.deceased_name || '-'}</td>
                                                                <td>{(c.amount || 0).toLocaleString()}원 <span style={{ fontSize: '11px', color: '#000000', marginLeft: '4px' }}>({c.buyer_name || '-'})</span></td>
                                                                <td style={{ textAlign: 'center' }}>{c.company_rate}%</td>
                                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(c.share_amount || 0).toLocaleString()}원</td>
                                                                <td style={{ textAlign: 'center' }}>{c.status === 'pending' ? '대기' : '완료'}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.emptyDetail}>
                                조회할 정산월을 선택해 주세요.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
