'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    IconUsers, 
    IconCreditCard, 
    IconSettings, 
    IconUserCheck, 
    IconCash,
    IconChevronRight
} from '@tabler/icons-react';
import styles from './adminHome.module.css';

interface Metrics {
    totalPartners: number;
    pendingPartners: number;
    totalDepositBalance: number;
    pendingWithdrawalsCount: number;
    pendingWithdrawalsAmount: number;
}

export default function B2BAdminPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch('/api/b2b/admin/dashboard');
                if (!res.ok) {
                    throw new Error('데이터를 가져오는데 실패했습니다.');
                }
                const data = await res.json();
                if (data.success) {
                    setMetrics(data.metrics);
                } else {
                    setError(data.error || '에러가 발생했습니다.');
                }
            } catch (err: any) {
                setError(err.message || '네트워크 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    const formatCurrency = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#64748b', fontSize: '14px' }}>
                대시보드 데이터를 불러오는 중...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '24px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', fontSize: '14px' }}>
                {error}
            </div>
        );
    }

    return (
        <div>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>B2B 어드민 홈</h1>
                <p className={styles.subtitle}>부고온 B2B 서비스 현황 및 요약 정보입니다.</p>
            </div>

            <div className={styles.grid}>
                {/* 파트너 수 */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>전체 승인 파트너</span>
                        <IconUsers stroke={1.5} size={22} className={styles.cardIcon} />
                    </div>
                    <div>
                        <div className={styles.cardValue}>{metrics?.totalPartners || 0}개사</div>
                        <span className={styles.cardDesc}>정상 활동 중인 B2B 지도사</span>
                    </div>
                </div>

                {/* 가입 대기 파트너 */}
                <div className={`${styles.card} ${metrics && metrics.pendingPartners > 0 ? styles.highlightCard : ''}`}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>가입 승인 대기</span>
                        <IconUserCheck stroke={1.5} size={22} className={metrics && metrics.pendingPartners > 0 ? styles.highlightValue : styles.cardIcon} />
                    </div>
                    <div>
                        <div className={`${styles.cardValue} ${metrics && metrics.pendingPartners > 0 ? styles.highlightValue : ''}`}>
                            {metrics?.pendingPartners || 0}개사
                        </div>
                        <span className={styles.cardDesc}>어드민 승인이 필요한 신규 가입 파트너</span>
                    </div>
                </div>

                {/* 출금 신청 대기 */}
                <div className={`${styles.card} ${metrics && metrics.pendingWithdrawalsCount > 0 ? styles.highlightCard : ''}`}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>출금 신청 대기</span>
                        <IconCreditCard stroke={1.5} size={22} className={metrics && metrics.pendingWithdrawalsCount > 0 ? styles.highlightValue : styles.cardIcon} />
                    </div>
                    <div>
                        <div className={`${styles.cardValue} ${metrics && metrics.pendingWithdrawalsCount > 0 ? styles.highlightValue : ''}`}>
                            {metrics?.pendingWithdrawalsCount || 0}건
                        </div>
                        <span className={styles.cardDesc}>
                            {metrics?.pendingWithdrawalsAmount ? `${formatCurrency(metrics.pendingWithdrawalsAmount)}원` : '0원'} 대기 중
                        </span>
                    </div>
                </div>

                {/* 총 예치금 잔고 */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>누적 총 예치금</span>
                        <IconCash stroke={1.5} size={22} className={styles.cardIcon} />
                    </div>
                    <div>
                        <div className={styles.cardValue}>{formatCurrency(metrics?.totalDepositBalance || 0)}원</div>
                        <span className={styles.cardDesc}>파트너들의 미출금 보유 예치금 합계</span>
                    </div>
                </div>
            </div>

            <section className={styles.quickMenuSection}>
                <h2 className={styles.sectionTitle}>바로가기</h2>
                <div className={styles.menuGrid}>
                    <Link href="/b2b/admin/partners" className={styles.menuLink}>
                        <div className={styles.menuIconWrapper}>
                            <IconUsers stroke={1.5} size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <span className={styles.menuLabel}>파트너 관리</span>
                        </div>
                        <IconChevronRight stroke={1.5} size={18} color="#94a3b8" />
                    </Link>

                    <Link href="/b2b/admin/withdrawals" className={styles.menuLink}>
                        <div className={styles.menuIconWrapper}>
                            <IconCreditCard stroke={1.5} size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <span className={styles.menuLabel}>출금 신청 관리</span>
                        </div>
                        <IconChevronRight stroke={1.5} size={18} color="#94a3b8" />
                    </Link>

                    <Link href="/b2b/admin/settings" className={styles.menuLink}>
                        <div className={styles.menuIconWrapper}>
                            <IconSettings stroke={1.5} size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <span className={styles.menuLabel}>어드민 설정</span>
                        </div>
                        <IconChevronRight stroke={1.5} size={18} color="#94a3b8" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
