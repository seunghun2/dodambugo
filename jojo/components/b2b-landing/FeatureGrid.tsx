'use client';

import React from 'react';
import styles from './landing.module.css';

export default function FeatureGrid() {
    return (
        <section id="features" className={styles.stepSection}>
            <div className={styles.sectionHeaderCenter}>
                <div className={styles.sectionPretitle}>장례 업무의 모든 것</div>
                <h2 className={styles.sectionTitle}>부고온플러스와 함께 시작해요</h2>
                <p style={{ fontSize: '16px', color: '#64748b', marginTop: '10px' }}>
                    초보자도 3분 만에 부고장을 완성하고, 판매된 화환 수당은 실시간으로 출금할 수 있습니다.
                </p>
            </div>

            <div className={styles.stepCardGrid}>
                {/* 카드 1 */}
                <div className={styles.stepCard}>
                    <div>
                        <div className={styles.stepIconBadge}>📱</div>
                        <h3 className={styles.stepCardTitle}>모바일 부고장을<br />빠르게 제작하세요</h3>
                        <p className={styles.stepCardDesc}>
                            고인과 상주의 정보만 입력하면 예법에 맞는 호칭과 정갈한 서식이 3분 만에 자동으로 완성됩니다. 카카오톡으로 상주에게 바로 전달하세요.
                        </p>
                    </div>
                    <div style={{ marginTop: '24px', fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                        ✓ 30여 개 친족 예법 자동 완성
                    </div>
                </div>

                {/* 카드 2 */}
                <div className={styles.stepCard}>
                    <div>
                        <div className={styles.stepIconBadge}>⚡</div>
                        <h3 className={styles.stepCardTitle}>실시간 계좌로<br />바로 정산 받아요</h3>
                        <p className={styles.stepCardDesc}>
                            부고장에 주문된 화환 배송이 끝나면 기본 5만 원, 최대 65,000원이 지갑에 즉시 적립됩니다. 24시간 언제든 내 통장으로 출금하세요.
                        </p>
                    </div>
                    <div style={{ marginTop: '24px', fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                        ✓ 3.3% 원천징수 합법 정산
                    </div>
                </div>

                {/* 카드 3 */}
                <div className={styles.stepCard}>
                    <div>
                        <div className={styles.stepIconBadge}>🤝</div>
                        <h3 className={styles.stepCardTitle}>추천인 평생 보너스<br />연금 혜택까지!</h3>
                        <p className={styles.stepCardDesc}>
                            함께 일하는 동료 지도사에게 부고온을 추천하면, 그 동료가 화환을 판매할 때마다 건당 3,500원의 보너스가 평생 내 지갑으로 적립됩니다.
                        </p>
                    </div>
                    <div style={{ marginTop: '24px', fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                        ✓ 건당 3,500원 무제한 보너스
                    </div>
                </div>
            </div>
        </section>
    );
}
