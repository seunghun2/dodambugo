'use client';

import React from 'react';
import styles from './landing.module.css';

export default function PartnerTestimonials() {
    return (
        <section className={styles.socialProofSection}>
            <div className={styles.sectionHeader}>
                <span className={styles.sectionTag}>현장의 생생한 목소리</span>
                <h2 className={styles.sectionTitle}>전국 장례지도사들이 직접 경험한 변화</h2>
                <p className={styles.sectionDesc}>
                    투명한 실시간 정산과 압도적인 수당으로 현장의 자부심을 되찾아드립니다.
                </p>
            </div>

            <div className={styles.testimonialGrid}>
                {/* 후기 1 */}
                <div className={styles.testimonialCard}>
                    <p className={styles.testimonialText}>
                        "기존에 쓰던 앱은 정산이 언제 되는지 불투명하고 수당도 2만 원 남짓이었는데, 부고온플러스는 화환 배송 완료되자마자 5만 원, 6만 원이 바로 지갑에 꽂히니 차원이 다릅니다."
                    </p>
                    <div className={styles.testimonialAuthor}>
                        <div className={styles.authorAvatar}>김</div>
                        <div className={styles.authorInfo}>
                            <span className={styles.authorName}>김*원 지도사님</span>
                            <span className={styles.authorRole}>경력 11년차 프리랜서 장례지도사 (서울/경기)</span>
                        </div>
                    </div>
                </div>

                {/* 후기 2 */}
                <div className={styles.testimonialCard}>
                    <p className={styles.testimonialText}>
                        "동료 지도사 3명한테 링크 보내서 가입시켰는데, 제가 당직 아닌 날에도 후배들이 화환 팔 때마다 3,500원씩 보너스가 적립됩니다. 진짜 연금 통장 하나 생긴 기분입니다."
                    </p>
                    <div className={styles.testimonialAuthor}>
                        <div className={styles.authorAvatar}>박</div>
                        <div className={styles.authorInfo}>
                            <span className={styles.authorName}>박*수 팀장님</span>
                            <span className={styles.authorRole}>경력 8년차 장례지도사 (인천)</span>
                        </div>
                    </div>
                </div>

                {/* 후기 3 */}
                <div className={styles.testimonialCard}>
                    <p className={styles.testimonialText}>
                        "상조 본사 차원에서 도입했는데, 매월 1일 화환이랑 부의금 정산서가 PDF로 자동 출력되어 전자세금계산서와 딱 떨어지니 경리/회계팀의 정산 마감 스트레스가 사라졌습니다."
                    </p>
                    <div className={styles.testimonialAuthor}>
                        <div className={styles.authorAvatar}>최</div>
                        <div className={styles.authorInfo}>
                            <span className={styles.authorName}>최*호 의전본부장님</span>
                            <span className={styles.authorRole}>제휴 상조회사 총괄 본부장</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 제휴사 배지 영역 */}
            <div style={{ marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '30px' }}>
                <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '16px' }}>
                    더좋은라이프, 마음부고, 안동상조 등 전국 주요 상조사 및 장례식장 파트너십 제휴
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', opacity: 0.7 }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#475569' }}>THE JOEUN LIFE</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#475569' }}>MAEUMBUGO</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#475569' }}>ANDONG LIFE</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#475569' }}>BUGOON PLUS</span>
                </div>
            </div>
        </section>
    );
}
