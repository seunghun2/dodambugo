'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { IconPrinter, IconDownload, IconArrowLeft, IconCheck } from '@tabler/icons-react';
import styles from './settlements.module.css';
import './settlements-print.css';

interface SettlementDetail {
    id: string;
    order_id: string;
    amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    payment_date: string | null;
    created_at: string;
    updated_at?: string;
    order: {
        order_number: string;
        product_name: string;
        sender_name: string;
        deceased_name: string;
        partner_name: string;
        partner_company: string;
        bugo_id: string;
    } | null;
}

interface CondolenceSettlementDetail {
    id: number;
    order_number: string;
    buyer_name: string;
    recipient_name: string;
    amount: number;
    fee: number;
    company_rate: number;
    share_amount: number;
    partner_name: string;
    deceased_name: string;
    status: string;
    created_at: string;
}

interface SettleSummary {
    pending_amount: number;
    completed_amount: number;
    total_count: number;
}

interface MonthlySummary {
    month: string;
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

    // 날짜 포맷 함수 (YYYY년 MM월 DD일)
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '정산 대기';
        try {
            const d = new Date(dateStr);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}년 ${mm}월 ${dd}일`;
        } catch {
            return dateStr;
        }
    };

    // 1. 월별 정산 현황 조회
    const fetchMonthlySummary = async () => {
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
                    fetchMonthlyDetail(data.monthlyList[0].month);
                }
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. 특정 월의 상세 정산서 조회
    const fetchMonthlyDetail = async (yearMonth: string) => {
        setDetailLoading(true);
        setSelectedYearMonth(yearMonth);
        try {
            const res = await fetch(`/api/b2b/admin/companies/settlements?companyId=${companyId}&yearMonth=${yearMonth}`);
            if (!res.ok) throw new Error('상세 정산서를 로드하지 못했습니다.');
            const data = await res.json();
            if (data.success) {
                setSettlements(data.settlements || []);
                setCondolenceSettlements(data.condolenceSettlements || []);
                if (data.company) {
                    setCompanyInfo(data.company);
                }
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setDetailLoading(false);
        }
    };

    // 3. 월 단위 정산 완료 처리
    const handleCompleteSettlement = async (yearMonth: string) => {
        const [year, month] = yearMonth.split('-');
        if (!confirm(`[${year}년 ${month}월] 정산서를 완료(송금 완료) 마감 처리하시겠습니까?\n실제 회사 통장으로 계좌 이체를 처리한 후 확인해주셔야 합니다.`)) {
            return;
        }

        try {
            const res = await fetch('/api/b2b/admin/companies/settlements', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, yearMonth })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '정산 처리에 실패했습니다.');
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

    // 4. 인쇄 (Print) 처리
    const handlePrint = () => {
        window.print();
    };

    // 5. 엑셀 다운로드 (CSV 내보내기)
    const handleDownloadCSV = () => {
        if (!selectedYearMonth || (settlements.length === 0 && condolenceSettlements.length === 0)) {
            alert('다운로드할 정산 내역이 없습니다.');
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
            s.status === 'pending' ? '정산대기' : '정산완료'
        ]);

        // 부의금 정산 내역
        const condolenceHeaders = ['[부의금] 거래일시', '주문번호', '장례지도사명', '고인명(상가)', '보낸분', '부의금액', '수수료', '상조쉐어(%)', '정산 금액', '정산 상태'];
        const condolenceRows = condolenceSettlements.map(c => [
            new Date(c.created_at).toLocaleString(),
            c.order_number || '-',
            c.partner_name || '-',
            c.deceased_name || '-',
            c.buyer_name || '-',
            c.amount,
            c.fee,
            `${c.company_rate}%`,
            c.share_amount,
            c.status === 'pending' ? '정산대기' : '정산완료'
        ]);

        const allLines = [
            wreathHeaders.join(','),
            ...wreathRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')),
            '', // 빈 줄 구분
            condolenceHeaders.join(','),
            ...condolenceRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ];

        const csvContent = '\ufeff' + allLines.join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `정산서_${companyName}_${year}년_${month}월.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchMonthlySummary();
    }, [companyId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '14px', color: '#64748b' }}>
                상조회사 정산서 장부를 불러오는 중...
            </div>
        );
    }

    const currentMonthData = monthlyList.find(m => m.month === selectedYearMonth);
    const hasPending = currentMonthData ? currentMonthData.pending_amount > 0 : false;

    return (
        <div className={styles.container}>
            {/* 뒤로가기 및 타이틀 (인쇄 시 숨김 처리) */}
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
                    <button className={styles.actionBtn} onClick={handleDownloadCSV} disabled={settlements.length === 0}>
                        <IconDownload size={16} />
                        <span>엑셀 다운로드</span>
                    </button>
                </div>
            </div>

            {/* 정산 요약 리포트 카드 (인쇄 시 숨김 처리) */}
            <div className={`${styles.summaryBox} no-print`}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>미정산 총액</div>
                    <div className={styles.summaryValue} style={{ color: '#000000' }}>
                        {(summary.pending_amount || 0).toLocaleString()}원
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>정산 완료 총액</div>
                    <div className={styles.summaryValue} style={{ color: '#000000' }}>
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

            {/* 월별 요약 장부 목록 (인쇄 시 숨김 처리) */}
            <div className={`${styles.section} no-print`} style={{ marginBottom: '24px' }}>
                <h3 className={styles.sectionTitle}>월별 정산 장부 목록</h3>
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>정산월</th>
                                <th>정산 대기 금액</th>
                                <th>정산 완료 금액</th>
                                <th>건수</th>
                                <th>상태</th>
                                <th>조회</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                                        기록된 정산 내역이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                monthlyList.map((m) => {
                                    const [year, month] = m.month.split('-');
                                    const isSelected = selectedYearMonth === m.month;
                                    return (
                                        <tr key={m.month} className={isSelected ? styles.selectedRow : ''}>
                                            <td style={{ fontWeight: '600' }}>{year}년 {month}월</td>
                                            <td style={{ color: '#000000' }}>
                                                {m.pending_amount.toLocaleString()}원
                                            </td>
                                            <td style={{ color: '#000000' }}>
                                                {m.completed_amount.toLocaleString()}원
                                            </td>
                                            <td>{m.total_count}건</td>
                                            <td>
                                                {m.pending_amount > 0 ? (
                                                    <span className={`${styles.badge} ${styles.badgePending}`}>정산 대기</span>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeCompleted}`}>정산 완료</span>
                                                )}
                                            </td>
                                            <td>
                                                <button 
                                                    className={styles.viewDetailBtn} 
                                                    onClick={() => fetchMonthlyDetail(m.month)}
                                                >
                                                    정산서 확인
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 📄 실제 일반 회사용 정규 정산서 디자인 (인쇄 출력 시 메인 레이아웃으로 출력) */}
            {selectedYearMonth && (
                <div className={styles.invoiceSheet}>
                    <div className={styles.invoiceHeader}>
                        <div className={styles.invoiceTitleContainer}>
                            <h1 className={styles.invoiceMainTitle}>정 산 서</h1>
                            <div className={styles.invoiceSubText}>
                                귀사와의 거래에 따른 정산 내역을 아래와 같이 명세하여 송부합니다.
                            </div>
                        </div>
                    </div>

                    {/* 공급자 & 공급받는자 정식 사업자 명세 정보 테이블 (정산서 정석 포맷) */}
                    <div className={styles.businessSection}>
                        <div className={styles.businessCard}>
                            <div className={styles.businessTitle}>■ 공급받는자</div>
                            <table className={styles.businessTable}>
                                <tbody>
                                    <tr>
                                        <td className={styles.businessLabel}>등록 번호</td>
                                        <td className={styles.businessValue}>{companyInfo?.business_no || '미등록'}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>상호 (법인명)</td>
                                        <td className={styles.businessValue}>{companyInfo?.name || companyName}</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>성명 (대표자)</td>
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
                        <div className={styles.businessCard}>
                            <div className={styles.businessTitle}>■ 공급자</div>
                            <table className={styles.businessTable}>
                                <tbody>
                                    <tr>
                                        <td className={styles.businessLabel}>등록 번호</td>
                                        <td className={styles.businessValue}>408-22-68851</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>상호 (법인명)</td>
                                        <td className={styles.businessValue}>마음부고</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.businessLabel}>성명 (대표자)</td>
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
                    {(() => {
                        const flowerPending = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);
                        const flowerCompleted = settlements.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0);
                        const condolencePending = condolenceSettlements.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.share_amount, 0);
                        const condolenceCompleted = condolenceSettlements.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.share_amount, 0);

                        const totalPending = flowerPending + condolencePending;
                        const totalCompleted = flowerCompleted + condolenceCompleted;
                        const grandTotal = totalPending + totalCompleted;

                        return (
                            <div className={styles.invoiceInfoSection}>
                                <table className={styles.infoTable}>
                                   <tbody>
                                        <tr>
                                            <td className={styles.infoLabel}>정산 상태</td>
                                            <td className={styles.infoValue}>
                                                {totalPending > 0 ? '정산 대기 (미지급)' : '정산 완료 (지급완료)'}
                                            </td>
                                            <td className={styles.infoLabel}>지급일자</td>
                                            <td className={styles.infoValue}>
                                                {totalPending > 0 ? '지급 대기' : formatDate(settlements[0]?.payment_date)}
                                            </td>
                                            <td className={styles.infoLabel}>합계 정산금액</td>
                                            <td className={styles.infoValue} style={{ fontWeight: 'bold' }}>
                                                {grandTotal.toLocaleString()}원
                                            </td>
                                        </tr>
                                   </tbody>
                                </table>
                            </div>
                        );
                    })()}

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
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#000000' }}>
                                            상세 정산 내역을 조회하는 중...
                                        </td>
                                    </tr>
                                ) : settlements.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ height: '36px' }}></td>
                                    </tr>
                                ) : (
                                    settlements.map((s) => (
                                        <tr key={s.id}>
                                             <td style={{ fontSize: '11px' }}>
                                                 <div>{new Date(s.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                                                 {s.status === 'cancelled' && (
                                                     <div style={{ fontSize: '10px', color: '#333333', marginTop: '2px', fontWeight: '500' }}>
                                                         취소: {new Date(s.updated_at || s.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                     </div>
                                                 )}
                                             </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                                                {s.order?.order_number || '-'}
                                            </td>
                                            <td style={{ fontWeight: '500' }}>
                                                {s.order?.partner_name || '-'}
                                            </td>
                                            <td style={{ fontWeight: '600' }}>
                                                {s.order?.deceased_name || '미등록'}
                                            </td>
                                            <td>
                                                <div>
                                                    <span>{s.order?.product_name || '-'}</span>
                                                    <span style={{ fontSize: '11px', color: '#000000', marginLeft: '4px' }}>
                                                        ({s.order?.sender_name || ''})
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                {s.amount.toLocaleString()}원
                                            </td>
                                            <td>
                                                {s.status === 'pending' ? '대기' : s.status === 'cancelled' ? '취소' : '완료'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 부의금 정산 세부 내역 명세 (테이블 무조건 상시 노출, 내역 없을 시 텍스트 문구 없이 깔끔한 빈 줄만 표시) */}
                    <div className={styles.invoiceBody} style={{ marginTop: '28px' }}>
                        <h3 className={styles.invoiceTableTitle}>■ 부의금 정산 세부 내역 명세</h3>
                        <table className={styles.invoiceTable}>
                            <thead>
                                <tr>
                                    <th>결제 일시</th>
                                    <th>주문 번호</th>
                                    <th>장례지도사명</th>
                                    <th>고인명</th>
                                    <th>부의금액 (조문객)</th>
                                    <th>수수료율 (%)</th>
                                    <th style={{ textAlign: 'right' }}>정산 금액</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailLoading ? (
                                    <tr>
                                        <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#000000' }}>
                                            상세 정산 내역을 조회하는 중...
                                        </td>
                                    </tr>
                                ) : condolenceSettlements.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ height: '36px' }}></td>
                                    </tr>
                                ) : (
                                    condolenceSettlements.map((c) => (
                                        <tr key={c.id}>
                                            <td style={{ fontSize: '11px' }}>
                                                <div>{new Date(c.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}>
                                                {c.order_number}
                                            </td>
                                            <td style={{ fontWeight: '500' }}>
                                                {c.partner_name}
                                            </td>
                                            <td style={{ fontWeight: '600' }}>
                                                {c.deceased_name}
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

                    {/* 하단 서명란 및 정산 처리 버튼 */}
                    {(() => {
                        const flowerPending = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);
                        const flowerCompleted = settlements.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0);
                        const condolencePending = condolenceSettlements.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.share_amount, 0);
                        const condolenceCompleted = condolenceSettlements.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.share_amount, 0);

                        const totalPending = flowerPending + condolencePending;
                        const totalCompleted = flowerCompleted + condolenceCompleted;

                        return (
                            <div className={styles.invoiceFooter}>
                                <div className={styles.invoiceTotalBlock}>
                                    <span>정산 대기 합계 : <strong>{totalPending.toLocaleString()}원</strong></span>
                                    <span style={{ marginLeft: '24px' }}>정산 완료 합계 : <strong>{totalCompleted.toLocaleString()}원</strong></span>
                                </div>

                                {/* 대금 정산 확인/완료 버튼 (인쇄 시에는 보이지 않음) */}
                                {totalPending > 0 && (
                                    <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                                        <button 
                                            className={styles.completeBtn}
                                            onClick={() => handleCompleteSettlement(selectedYearMonth)}
                                        >
                                            <IconCheck size={18} style={{ marginRight: '6px' }} />
                                            <span>{selectedYearMonth.split('-')[0]}년 {selectedYearMonth.split('-')[1]}월 정산 완료 처리</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
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
