'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    IconBuilding, 
    IconPrinter, 
    IconDownload, 
    IconCheck, 
    IconArrowLeft, 
    IconChevronLeft, 
    IconChevronRight 
} from '@tabler/icons-react';
import styles from './settlements.module.css';
import './settlements-print.css';

interface MonthlySummary {
    month: string;
    total_amount: number;
    pending_amount: number;
    completed_amount: number;
    count: number;
}

interface SettlementDetail {
    id: string;
    amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    payment_date: string | null;
    created_at: string;
    order?: {
        order_number: string;
        deceased_name: string;
        partner_name: string;
        product_name: string;
        sender_name: string;
    };
}

interface CondolenceSettlementDetail {
    id: string;
    order_number: string;
    amount: number;
    share_amount: number;
    company_rate: number;
    status: 'pending' | 'completed' | 'transferred' | 'cancelled';
    payment_date: string | null;
    created_at: string;
    buyer_name: string;
    deceased_name: string;
    partner_name: string;
}

interface SettleSummary {
    pending_amount: number;
    completed_amount: number;
    total_count: number;
}

interface CompanyInfo {
    id: string;
    name: string;
    business_no?: string;
    owner_name?: string;
    address?: string;
    business_type?: string;
    business_item?: string;
}

function SettlementsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const companyId = searchParams.get('companyId') || '';
    const companyName = searchParams.get('name') || '상조회사';

    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [monthlyList, setMonthlyList] = useState<MonthlySummary[]>([]);
    const [settlements, setSettlements] = useState<SettlementDetail[]>([]);
    const [condolenceSettlements, setCondolenceSettlements] = useState<CondolenceSettlementDetail[]>([]);
    const [selectedYearMonth, setSelectedYearMonth] = useState<string | null>(null);
    const [summary, setSummary] = useState<SettleSummary>({ pending_amount: 0, completed_amount: 0, total_count: 0 });
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);

    // 날짜 및 시간 포맷 함수 (YYYY-MM-DD HH:mm)
    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '지급 대기';
        try {
            const d = new Date(dateStr);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
        } catch {
            return dateStr;
        }
    };

    // 1. 월별 정산 현황 조회
    const fetchMonthlySummary = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/b2b/admin/companies/settlements?companyId=${companyId}`);
            if (!res.ok) throw new Error('정산 내역을 로드하지 못했습니다.');
            const data = await res.json();
            if (data.success) {
                setCompanyInfo(data.company || null);
                setMonthlyList(data.monthlyList || []);
                setSummary(data.summary);
                
                // 만약 월별 내역이 있다면 가장 최근 월을 자동으로 조회
                if (data.monthlyList && data.monthlyList.length > 0) {
                    setSelectedYearMonth(data.monthlyList[0].month);
                } else {
                    const now = new Date();
                    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    setSelectedYearMonth(curMonth);
                }
            }
        } catch (err: any) {
            console.error('월별 정산 목록 조회 오류:', err);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    // 2. 특정 월의 세부 내역 조회 (화환 + 부의금)
    const fetchMonthlyDetail = useCallback(async (yearMonth: string) => {
        if (!companyId || !yearMonth) return;
        setDetailLoading(true);
        setSelectedYearMonth(yearMonth);
        try {
            const res = await fetch(`/api/b2b/admin/companies/settlements?companyId=${companyId}&yearMonth=${yearMonth}`);
            if (!res.ok) throw new Error('세부 정산 내역을 로드하지 못했습니다.');
            const data = await res.json();
            if (data.success) {
                setSettlements(data.settlements || []);
                setCondolenceSettlements(data.condolenceSettlements || []);
                if (data.company) {
                    setCompanyInfo(data.company);
                }
            }
        } catch (err: any) {
            console.error('세부 정산 내역 조회 오류:', err);
        } finally {
            setDetailLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchMonthlySummary();
    }, [fetchMonthlySummary]);

    useEffect(() => {
        if (selectedYearMonth) {
            fetchMonthlyDetail(selectedYearMonth);
        }
    }, [selectedYearMonth, fetchMonthlyDetail]);

    // 월 선택 핸들러
    const handleSelectMonth = (month: string) => {
        fetchMonthlyDetail(month);
    };

    // 3. 특정 월 전체 정산 완료(지급 완료) 처리
    const handleCompleteSettlement = async (yearMonth: string) => {
        const [year, month] = yearMonth.split('-');
        if (!confirm(`[${companyInfo?.name || companyName}]의 ${year}년 ${month}월분 정산을 '정산 완료(지급 완료)' 처리하시겠습니까?\n\n* 실제 대금 지급이 확인된 후 실행해 주세요.`)) {
            return;
        }

        try {
            const res = await fetch('/api/b2b/admin/companies/settlements', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId,
                    yearMonth
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '정산 완료 처리에 실패했습니다.');
            }

            const data = await res.json();
            if (data.success) {
                alert(`[${year}년 ${month}월] 정산서가 성공적으로 마감되었습니다. (정산 건수: ${data.updated_count}건)`);
                // 장부 새로고침
                const summaryRes = await fetch(`/api/b2b/admin/companies/settlements?companyId=${companyId}`);
                const summaryData = await summaryRes.json();
                if (summaryData.success) {
                    setMonthlyList(summaryData.monthlyList || []);
                    setSummary(summaryData.summary);
                }
                fetchMonthlyDetail(yearMonth);
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    // 이전 달 / 다음 달 이동
    const handlePrevMonth = () => {
        if (!selectedYearMonth) return;
        const [year, month] = selectedYearMonth.split('-').map(Number);
        const prevDate = new Date(year, month - 2, 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
        const prevKey = `${prevYear}-${prevMonth}`;
        fetchMonthlyDetail(prevKey);
    };

    const handleNextMonth = () => {
        if (!selectedYearMonth) return;
        const [year, month] = selectedYearMonth.split('-').map(Number);
        const nextDate = new Date(year, month, 1);
        const nextYear = nextDate.getFullYear();
        const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nextKey = `${nextYear}-${nextMonth}`;
        fetchMonthlyDetail(nextKey);
    };

    // 4. 인쇄 (Print) 처리
    const handlePrint = () => {
        window.print();
    };

    // 5. 엑셀 다운로드 (CSV 내보내기)
    const handleDownloadCSV = () => {
        if (!selectedYearMonth) {
            alert('다운로드할 정산월이 선택되지 않았습니다.');
            return;
        }

        const [year, month] = selectedYearMonth.split('-');
        
        // 화환 정산 내역
        const wreathHeaders = ['[화환] 거래일시', '주문번호', '장례지도사명', '고인명(상가)', '화환 상품명', '주문자명', '정산 금액(수당)', '정산 상태'];
        const wreathRows = settlements.map(s => [
            new Date(s.created_at).toLocaleString(),
            s.order?.order_number || '-',
            s.order?.partner_name || '-',
            s.order?.deceased_name || '-',
            s.order?.product_name || '-',
            s.order?.sender_name || '-',
            s.amount,
            s.status === 'completed' ? '정산완료' : s.status === 'cancelled' ? '주문취소' : '정산대기'
        ]);

        // 부의금 정산 내역
        const condolenceHeaders = ['[부의금] 결제일시', '주문번호', '장례지도사명', '고인명(상가)', '부의금액', '조문객(입금자)', '수수료율', '정산 금액(쉐어)', '정산 상태'];
        const condolenceRows = condolenceSettlements.map(c => [
            new Date(c.created_at).toLocaleString(),
            c.order_number || '-',
            c.partner_name || '-',
            c.deceased_name || '-',
            c.amount,
            c.buyer_name || '-',
            `${c.company_rate}%`,
            c.share_amount,
            c.status === 'completed' || c.status === 'transferred' ? '정산완료' : c.status === 'cancelled' ? '취소' : '정산대기'
        ]);

        const combinedHeaders = ['구분', '거래일시', '주문번호', '장례지도사명', '고인명(상가)', '상세내용', '주문/조문객', '정산 금액', '정산 상태'];
        const combinedRows = [
            ...settlements.map(s => [
                '화환',
                new Date(s.created_at).toLocaleString(),
                s.order?.order_number || '-',
                s.order?.partner_name || '-',
                s.order?.deceased_name || '-',
                s.order?.product_name || '-',
                s.order?.sender_name || '-',
                s.amount,
                s.status === 'completed' ? '정산완료' : s.status === 'cancelled' ? '주문취소' : '정산대기'
            ]),
            ...condolenceSettlements.map(c => [
                '부의금',
                new Date(c.created_at).toLocaleString(),
                c.order_number || '-',
                c.partner_name || '-',
                c.deceased_name || '-',
                `부의금 수수료 쉐어 (${c.company_rate}%)`,
                c.buyer_name || '-',
                c.share_amount,
                c.status === 'completed' || c.status === 'transferred' ? '정산완료' : c.status === 'cancelled' ? '취소' : '정산대기'
            ])
        ];

        const csvContent = 
            '\ufeff' + 
            [combinedHeaders.join(','), ...combinedRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.setAttribute('href', url);
        link.setAttribute('download', `정산서_${companyInfo?.name || companyName}_${year}년_${month}월.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '14px', color: '#64748b' }}>
                상조회사 정산서 장부를 불러오는 중...
            </div>
        );
    }

    // 당월 금액 계산
    const flowerPending = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);
    const flowerCompleted = settlements.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0);
    const condolencePending = condolenceSettlements.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.share_amount, 0);
    const condolenceCompleted = condolenceSettlements.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.share_amount, 0);

    const totalPending = flowerPending + condolencePending;
    const totalCompleted = flowerCompleted + condolenceCompleted;
    const grandTotal = totalPending + totalCompleted;
    const isSettled = totalCompleted > 0 && totalPending === 0;
    const latestPaymentDate = settlements[0]?.payment_date || condolenceSettlements[0]?.payment_date;

    return (
        <div className={styles.container}>
            {/* 뒤로가기 및 액션 버튼 (인쇄 시 숨김 처리) */}
            <div className={`${styles.headerArea} no-print`}>
                <button className={styles.backBtn} onClick={() => router.push('/b2b/admin/companies')}>
                    <IconArrowLeft size={16} />
                    <span>상조회사 목록으로</span>
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={styles.actionBtn} onClick={handlePrint}>
                        <IconPrinter size={16} />
                        <span>인쇄하기</span>
                    </button>
                    <button className={styles.actionBtn} onClick={handleDownloadCSV}>
                        <IconDownload size={16} />
                        <span>엑셀 다운로드</span>
                    </button>
                </div>
            </div>

            {/* 정산 요약 리포트 카드 (인쇄 시 숨김 처리) */}
            <div className={`${styles.summaryBox} no-print`}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>미정산 총액</div>
                    <div className={styles.summaryValue} style={{ color: '#0f172a' }}>
                        {(summary.pending_amount || 0).toLocaleString()}원
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>정산 완료 총액</div>
                    <div className={styles.summaryValue} style={{ color: '#334155' }}>
                        {(summary.completed_amount || 0).toLocaleString()}원
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>전체 누적 건수</div>
                    <div className={styles.summaryValue}>
                        {summary.total_count || 0}건
                    </div>
                </div>
            </div>

            {/* 상단 정산 대상월 및 액션 컨트롤 바 (정산서 밖 배치, 인쇄 제외) */}
            {selectedYearMonth && (
                <div className={`${styles.filterBar} no-print`}>
                    <div className={styles.monthNavBox}>
                        <button 
                            type="button" 
                            onClick={handlePrevMonth} 
                            className={styles.monthNavBtn} 
                            title="이전 달 조회"
                        >
                            <IconChevronLeft size={18} />
                        </button>
                        <span className={styles.monthDisplayText}>
                            {selectedYearMonth.split('-')[0]}년 {parseInt(selectedYearMonth.split('-')[1], 10)}월
                        </span>
                        <button 
                            type="button" 
                            onClick={handleNextMonth} 
                            className={styles.monthNavBtn} 
                            title="다음 달 조회"
                        >
                            <IconChevronRight size={18} />
                        </button>
                    </div>

                    {/* 상단 액션 컨트롤 버튼 및 상태 타임스탬프 (정산서 밖 독립 영역) */}
                    <div>
                        {totalPending > 0 ? (
                            <button 
                                className={styles.completeActionBtn}
                                onClick={() => handleCompleteSettlement(selectedYearMonth)}
                            >
                                <IconCheck size={16} />
                                <span>{selectedYearMonth.split('-')[0]}년 {parseInt(selectedYearMonth.split('-')[1], 10)}월 정산 완료 처리 (지급 확정)</span>
                            </button>
                        ) : totalCompleted > 0 ? (
                            <div className={styles.settledBadge}>
                                <IconCheck size={16} />
                                <span>{selectedYearMonth.split('-')[0]}년 {parseInt(selectedYearMonth.split('-')[1], 10)}월 정산 완료 (처리일시: {formatDateTime(latestPaymentDate)})</span>
                            </div>
                        ) : (
                            <div className={styles.emptyBadge}>
                                <span>{selectedYearMonth.split('-')[0]}년 {parseInt(selectedYearMonth.split('-')[1], 10)}월 정산 대상 없음 (0원)</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 📄 실제 일반 회사용 정규 정산서 디자인 (인쇄 출력 시 메인 레이아웃으로 출력) */}
            {selectedYearMonth && (
                <div className={styles.invoiceSheet}>
                    <div className={styles.invoiceHeader}>
                        <div className={styles.invoiceTitleContainer}>
                            <h1 className={styles.invoiceMainTitle}>정 산 서</h1>
                            <div className={styles.invoiceSubText} style={{ marginTop: '8px' }}>
                                귀사와의 거래에 따른 {selectedYearMonth.split('-')[0]}년 {parseInt(selectedYearMonth.split('-')[1], 10)}월분 정산 내역을 아래와 같이 명세하여 송부합니다.
                            </div>
                        </div>
                    </div>

                    {/* 공급자 & 공급받는자 정식 사업자 명세 정보 테이블 (정산서 정석 포맷) */}
                    <div className={styles.businessContainer}>
                        {/* 공급받는자 (상조회사) */}
                        <div className={styles.businessBox}>
                            <div className={styles.businessSideTitle}>■ 공급받는자</div>
                            <table className={styles.businessTable}>
                                <tbody>
                                    <tr>
                                        <td className={styles.businessLabel}>등록번호</td>
                                        <td className={styles.businessValue}>{companyInfo?.business_no || '미등록'}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>상호(법인명)</td>
                                        <td className={styles.businessValue}>{companyInfo?.name || companyName}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>성명(대표자)</td>
                                        <td className={styles.businessValue}>{companyInfo?.owner_name || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>사업장 주소</td>
                                        <td className={styles.businessValue}>{companyInfo?.address || '미등록'}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>업태 / 종목</td>
                                        <td className={styles.businessValue}>
                                            {companyInfo?.business_type || '-'} / {companyInfo?.business_item || '-'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 공급자 (마음부고) */}
                        <div className={styles.businessBox}>
                            <div className={styles.businessSideTitle}>■ 공급자</div>
                            <table className={styles.businessTable}>
                                <tbody>
                                    <tr>
                                        <td className={styles.businessLabel}>등록번호</td>
                                        <td className={styles.businessValue}>408-22-68851</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>상호(법인명)</td>
                                        <td className={styles.businessValue}>마음부고</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>성명(대표자)</td>
                                        <td className={styles.businessValue}>김미연</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>사업장 주소</td>
                                        <td className={styles.businessValue}>서울특별시 강남구 압구정로 306</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>업태 / 종목</td>
                                        <td className={styles.businessValue}>서비스업 / 정보통신업, 모바일 플랫폼</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 정산 정보 간이 요약 */}
                    <div className={styles.invoiceInfoSection}>
                        <table className={styles.infoTable}>
                           <tbody>
                                <tr>
                                    <td className={styles.infoLabel}>정산 상태</td>
                                    <td className={styles.infoValue} style={{ fontWeight: 'bold', color: '#0f172a' }}>
                                        {isSettled ? '정산 완료 (지급완료)' : '정산 대기'}
                                    </td>
                                    <td className={styles.infoLabel}>지급일자</td>
                                    <td className={styles.infoValue}>
                                        {isSettled && latestPaymentDate
                                            ? formatDateTime(latestPaymentDate)
                                            : '지급 대기'}
                                    </td>
                                    <td className={styles.infoLabel}>합계 정산금액</td>
                                    <td className={styles.infoValue} style={{ fontWeight: 'bold' }}>
                                        {grandTotal.toLocaleString()}원
                                    </td>
                                </tr>
                           </tbody>
                        </table>
                    </div>

                    {/* 화환 상세 내역 테이블 */}
                    <div className={styles.invoiceBody}>
                        <h3 className={styles.invoiceTableTitle}>■ 화환 판매 정산 세부 내역 명세</h3>
                        <table className={styles.invoiceTable}>
                            <thead>
                                <tr>
                                    <th>결제 일시</th>
                                    <th>주문 번호</th>
                                    <th>장례지도사명</th>
                                    <th>고인명</th>
                                    <th>화환 상품명 (주문자)</th>
                                    <th style={{ textAlign: 'right' }}>정산 금액</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailLoading ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                            정산 상세 내역을 불러오는 중...
                                        </td>
                                    </tr>
                                ) : settlements.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                            해당 월에 발생한 화환 판매 내역이 없습니다. (0건 / 0원)
                                        </td>
                                    </tr>
                                ) : (
                                    settlements.map((s) => (
                                        <tr key={s.id}>
                                            <td style={{ textAlign: 'center' }}>
                                                {new Date(s.created_at).toLocaleDateString('ko-KR', {
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td style={{ fontFamily: 'monospace', textAlign: 'center' }}>
                                                {s.order?.order_number || '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {s.order?.partner_name || '-'}
                                            </td>
                                            <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                                                {s.order?.deceased_name || '-'}
                                            </td>
                                            <td>
                                                <div>{s.order?.product_name || '-'}</div>
                                                <div style={{ fontSize: '11px', color: '#000000' }}>
                                                    (주문자: {s.order?.sender_name || '-'})
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                {s.amount.toLocaleString()}원
                                            </td>
                                            <td>
                                                {s.status === 'completed' ? '완료' : s.status === 'cancelled' ? '취소' : '대기'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 부의금 상세 내역 테이블 */}
                    <div className={styles.invoiceBody} style={{ marginTop: '24px' }}>
                        <h3 className={styles.invoiceTableTitle}>■ 부의금 정산 세부 내역 명세</h3>
                        <table className={styles.invoiceTable}>
                            <thead>
                                <tr>
                                    <th>결제 일시</th>
                                    <th>주문 번호</th>
                                    <th>장례지도사명</th>
                                    <th>고인명</th>
                                    <th>부의 금액 (조문객)</th>
                                    <th>수수료율 (%)</th>
                                    <th style={{ textAlign: 'right' }}>정산 금액</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailLoading ? (
                                    <tr>
                                        <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                            정산 상세 내역을 불러오는 중...
                                        </td>
                                    </tr>
                                ) : condolenceSettlements.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                            해당 월에 발생한 부의금 정산 내역이 없습니다. (0건 / 0원)
                                        </td>
                                    </tr>
                                ) : (
                                    condolenceSettlements.map((c) => (
                                        <tr key={c.id}>
                                            <td style={{ textAlign: 'center' }}>
                                                {new Date(c.created_at).toLocaleDateString('ko-KR', {
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td style={{ fontFamily: 'monospace', textAlign: 'center' }}>
                                                {c.order_number || '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {c.partner_name || '-'}
                                            </td>
                                            <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                                                {c.deceased_name || '-'}
                                            </td>
                                            <td>
                                                <div>
                                                    <span>{(c.amount || 0).toLocaleString()}원</span>
                                                    <span style={{ fontSize: '11px', color: '#000000', marginLeft: '4px' }}>
                                                        ({c.buyer_name || ''})
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 'bold', color: '#059669' }}>
                                                {c.company_rate}%
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                {c.share_amount.toLocaleString()}원
                                            </td>
                                            <td>
                                                {c.status === 'completed' || c.status === 'transferred' ? '완료' : c.status === 'cancelled' ? '취소' : '대기'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 하단 서명 및 총액 블록 (순수 정산서 문서 서식) */}
                    <div className={styles.invoiceFooter}>
                        <div className={styles.invoiceTotalBlock}>
                            <span>정산 대기 합계 : <strong>{totalPending.toLocaleString()}원</strong></span>
                            <span style={{ marginLeft: '24px' }}>정산 완료 합계 : <strong>{totalCompleted.toLocaleString()}원</strong></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SettlementsPage() {
    return (
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>로딩 중...</div>}>
            <SettlementsContent />
        </Suspense>
    );
}
