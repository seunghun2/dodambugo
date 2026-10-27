'use client';

import { useState, useEffect } from 'react';
import { 
    IconChartBar, 
    IconRefresh, 
    IconBrandGoogle, 
    IconCopy, 
    IconCheck, 
    IconCoin, 
    IconTrendingUp, 
    IconTarget,
    IconCurrencyDollar
} from '@tabler/icons-react';
import styles from './marketing.module.css';

interface MonthlyItem {
    month: number;
    monthLabel: string;
    naverCost: number;
    googleCost: number;
    totalCost: number;
    flowerCount: number;
    flowerProfit: number;
    condolenceGross: number;
    condolenceProfit: number;
    totalRevenue: number;
    netProfit: number;
    roas: number;
    bugoCount: number;
    cpa: number;
    totalClicks: number;
}

interface SummaryData {
    bizmoney: number;
    totalMarketingSpend: number;
    totalRevenue: number;
    totalFlowerCount: number;
    totalCondolenceGross: number;
    netProfit: number;
    overallRoas: number;
    totalBugoCreated: number;
    overallCpa: number;
    totalClicks: number;
}

export default function MarketingAdminPage() {
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/marketing/stats?year=2026');
            const data = await res.json();
            if (data.success) {
                setSummary(data.summary);
                setMonthlyData(data.monthlyReport || []);
            }
        } catch (err) {
            console.error('Error fetching marketing stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const googleScriptCode = `/**
 * 마음부고 x Google Ads 자동 광고비 동기화 스크립트
 * 구글 애즈 [도구] > [일괄 작업] > [스크립트]에 붙여넣고 [실행]하세요.
 */
function main() {
  var url = "https://maeumbugo.co.kr/api/marketing/google-ads";
  var query = "SELECT segments.date, campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions " +
              "FROM campaign " +
              "WHERE segments.date DURING LAST_30_DAYS";
  
  var rows = [];
  var report = AdsApp.search(query);
  while (report.hasNext()) {
    var row = report.next();
    rows.push({
      date: row.segments.date,
      campaignName: row.campaign.name,
      cost: Math.round(row.metrics.costMicros / 1000000),
      clicks: parseInt(row.metrics.clicks || 0, 10),
      impressions: parseInt(row.metrics.impressions || 0, 10),
      conversions: parseInt(row.metrics.conversions || 0, 10)
    });
  }
  
  if (rows.length > 0) {
    var options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify({
        secret: "maeumbugo-marketing-sync-2026",
        data: rows
      })
    };
    var response = UrlFetchApp.fetch(url, options);
    Logger.log("동기화 결과: " + response.getContentText());
  }
}`;

    const handleCopyScript = () => {
        navigator.clipboard.writeText(googleScriptCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.container}>
            {/* 상단 헤더 */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        <IconChartBar stroke={2} size={28} color="#0f172a" />
                        마케팅 & 광고비 통합 관리
                    </h1>
                    <p className={styles.subtitle}>
                        네이버 검색광고(실시간 API)와 Google Ads를 연동하여 매출 대비 마케팅 수익성을 분석합니다.
                    </p>
                </div>
                <button 
                    onClick={fetchData} 
                    className={styles.refreshBtn}
                    disabled={loading}
                >
                    <IconRefresh stroke={2} size={16} />
                    {loading ? '동기화 중...' : '실시간 데이터 갱신'}
                </button>
            </div>

            {/* KPI 카드 4열 그리드 */}
            <div className={styles.kpiGrid}>
                {/* 1. 네이버 비즈머니 잔액 */}
                <div className={styles.kpiCard}>
                    <div className={styles.kpiTop}>
                        <span className={styles.kpiLabel}>네이버 비즈머니 잔액</span>
                        <span className={`${styles.kpiBadge} ${styles.badgeNaver}`}>네이버 API 실시간</span>
                    </div>
                    <div className={styles.kpiValue}>
                        {summary ? `${summary.bizmoney.toLocaleString()}원` : '-'}
                    </div>
                    <div className={styles.kpiSub}>
                        일일 권장 예산 약 60,000원 기준 잔여
                    </div>
                </div>

                {/* 2. 2026년 총 마케팅 광고비 */}
                <div className={styles.kpiCard}>
                    <div className={styles.kpiTop}>
                        <span className={styles.kpiLabel}>2026년 총 광고비 지출</span>
                        <span className={`${styles.kpiBadge} ${styles.badgeTotal}`}>네이버 + 구글</span>
                    </div>
                    <div className={styles.kpiValue}>
                        {summary ? `${summary.totalMarketingSpend.toLocaleString()}원` : '-'}
                    </div>
                    <div className={styles.kpiSub}>
                        총 유입 클릭수: {summary?.totalClicks.toLocaleString()}회
                    </div>
                </div>

                {/* 3. 누적 플랫폼 마진 순수익 */}
                <div className={styles.kpiCard}>
                    <div className={styles.kpiTop}>
                        <span className={styles.kpiLabel}>총 플랫폼 순수익</span>
                        <span className={`${styles.kpiBadge} ${styles.badgeProfit}`}>화환 5만 + 부의금 8.6%</span>
                    </div>
                    <div className={styles.kpiValue}>
                        {summary ? `${summary.totalRevenue.toLocaleString()}원` : '-'}
                    </div>
                    <div className={styles.kpiSub}>
                        순마진 (수익-광고비): <strong style={{ color: summary && summary.netProfit >= 0 ? '#16a34a' : '#dc2626' }}>{summary ? `${summary.netProfit.toLocaleString()}원` : '-'}</strong>
                    </div>
                </div>

                {/* 4. 부고장 1건 획득비용 (CPA) & ROAS */}
                <div className={styles.kpiCard}>
                    <div className={styles.kpiTop}>
                        <span className={styles.kpiLabel}>건당 획득비용 (CPA) / ROAS</span>
                        <span className={`${styles.kpiBadge} ${styles.badgeRoas}`}>마케팅 효율</span>
                    </div>
                    <div className={styles.kpiValue}>
                        {summary ? `${summary.overallCpa.toLocaleString()}원` : '-'}
                    </div>
                    <div className={styles.kpiSub}>
                        수익 대비 ROAS: {summary ? `${summary.overallRoas}%` : '-'} (부고 {summary?.totalBugoCreated}건)
                    </div>
                </div>
            </div>

            {/* 월별 마케팅 및 매출 대조 리포트 테이블 */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>2026년 월별 마케팅 비용 및 실 순수익(화환 5만/부의금 8.6%) 대조</h2>
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.statsTable}>
                        <thead>
                            <tr>
                                <th className={styles.alignLeft}>대상월</th>
                                <th>네이버 광고비</th>
                                <th>구글 광고비</th>
                                <th>총 광고비</th>
                                <th>화환 수익 (건당 5만)</th>
                                <th>부의금 수익 (8.6%)</th>
                                <th>총 플랫폼 수익</th>
                                <th>실제 순마진</th>
                                <th>수익 ROAS</th>
                                <th>부고장 생성</th>
                                <th>CPA (건당 단가)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.map((item) => (
                                <tr key={item.month}>
                                    <td className={styles.alignLeft} style={{ fontWeight: 700 }}>
                                        {item.monthLabel}
                                    </td>
                                    <td>{item.naverCost.toLocaleString()}원</td>
                                    <td>{item.googleCost.toLocaleString()}원</td>
                                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                                        {item.totalCost.toLocaleString()}원
                                    </td>
                                    <td>
                                        {item.flowerProfit.toLocaleString()}원
                                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>({item.flowerCount}건)</span>
                                    </td>
                                    <td>
                                        {item.condolenceProfit.toLocaleString()}원
                                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>(결제 {item.condolenceGross.toLocaleString()}원)</span>
                                    </td>
                                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                                        {item.totalRevenue.toLocaleString()}원
                                    </td>
                                    <td className={item.netProfit >= 0 ? styles.positiveProfit : styles.negativeProfit}>
                                        {item.netProfit > 0 ? `+${item.netProfit.toLocaleString()}원` : `${item.netProfit.toLocaleString()}원`}
                                    </td>
                                    <td className={styles.roasHigh}>
                                        {item.roas}%
                                    </td>
                                    <td className={styles.alignCenter}>
                                        {item.bugoCount}건
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {item.cpa > 0 ? `${item.cpa.toLocaleString()}원` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Google Ads 자동 연동 스크립트 가이드 */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconBrandGoogle stroke={2} size={20} color="#ea4335" />
                        Google Ads 매일 자동 동기화 스크립트 (1회 설정)
                    </h2>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.6 }}>
                    구글 애즈 관리자 계정 없이도, 아래 스크립트를 구글 애즈 내 [스크립트]에 등록해 두면 
                    <strong> 매일 자정에 어제 쓴 광고비가 마음부고 어드민으로 100% 자동 전송</strong>됩니다.
                </p>

                <div className={styles.guideSteps}>
                    <div className={styles.guideStepItem}>
                        <span className={styles.stepNumber}>1</span>
                        <span>구글 애즈 접속 ➡️ 좌측 메뉴 <strong>[도구] ➡️ [일괄 작업] ➡️ [스크립트]</strong> 클릭</span>
                    </div>
                    <div className={styles.guideStepItem}>
                        <span className={styles.stepNumber}>2</span>
                        <span>파란색 <strong>[+ 새 스크립트]</strong> 버튼 클릭 후 아래 코드를 전체 복사하여 붙여넣기</span>
                    </div>
                    <div className={styles.guideStepItem}>
                        <span className={styles.stepNumber}>3</span>
                        <span>화면 우측 하단 <strong>[저장] ➡️ 빈도: '매일' 자정(00:00) 실행</strong>으로 설정</span>
                    </div>
                </div>

                <div className={styles.scriptBox}>
                    <div className={styles.scriptHeader}>
                        <span className={styles.scriptTitle}>Google Ads Automation Script</span>
                        <button onClick={handleCopyScript} className={styles.copyBtn}>
                            {copied ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconCheck size={14} /> 복사 완료!</span> : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconCopy size={14} /> 코드 복사하기</span>}
                        </button>
                    </div>
                    <pre className={styles.scriptCode}>{googleScriptCode}</pre>
                </div>
            </div>
        </div>
    );
}
