'use client';

import React, { useState, useId } from 'react';
import styles from './landing.module.css';

export default function ProfitCalculator() {
    const [funeralCount, setFuneralCount] = useState(3); // 월 장례 건수 (기본 3건)
    const [referralCount, setReferralCount] = useState(2); // 추천 동료 수 (기본 2명)
    const funeralSliderId = useId();
    const referralSliderId = useId();

    // 계산식:
    // 장례 1건당 평균 근조화환 2건 발생 (평균 지도사 수당 55,000원) = 110,000원
    // 추천 동료 1명당 월 3건 화환 발생 가정 = 3 * 3,500원 = 10,500원
    const flowerRewardTotal = funeralCount * 2 * 55000;
    const referralBonusTotal = referralCount * 3 * 3500;
    const grandTotal = flowerRewardTotal + referralBonusTotal;

    return (
        <section id="calculator" className={styles.calculatorSection}>
            <div className={styles.sectionHeader}>
                <span className={styles.sectionTag}>실시간 정산 시뮬레이터</span>
                <h2 className={styles.sectionTitle}>내가 한 달에 가져갈 수 있는 부수입은?</h2>
                <p className={styles.sectionDesc}>
                    복잡한 계산 없이 슬라이더를 움직여 이번 달 예상 정산금을 직접 확인해 보세요.
                </p>
            </div>

            <div className={styles.calculatorContainer}>
                <div className={styles.calcGrid}>
                    <div className={styles.calcInputs}>
                        {/* 슬라이더 1: 장례 진행 건수 */}
                        <div className={styles.sliderBlock}>
                            <div className={styles.sliderHeader}>
                                <label htmlFor={funeralSliderId} className={styles.sliderLabel}>한 달에 진행하는 장례 건수</label>
                                <span className={styles.sliderValue}>{funeralCount}건</span>
                            </div>
                            <input
                                id={funeralSliderId}
                                type="range"
                                min="1"
                                max="15"
                                value={funeralCount}
                                onChange={(e) => setFuneralCount(Number(e.target.value))}
                                className={styles.rangeSlider}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                                <span>1건</span>
                                <span>7건</span>
                                <span>15건</span>
                            </div>
                        </div>

                        {/* 슬라이더 2: 추천한 동료 지도사 수 */}
                        <div className={styles.sliderBlock}>
                            <div className={styles.sliderHeader}>
                                <label htmlFor={referralSliderId} className={styles.sliderLabel}>함께할 동료 지도사 (추천 파트너)</label>
                                <span className={styles.sliderValue}>{referralCount}명</span>
                            </div>
                            <input
                                id={referralSliderId}
                                type="range"
                                min="0"
                                max="10"
                                value={referralCount}
                                onChange={(e) => setReferralCount(Number(e.target.value))}
                                className={styles.rangeSlider}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                                <span>0명</span>
                                <span>5명</span>
                                <span>10명</span>
                            </div>
                        </div>

                        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                            💡 장례 1건당 화환 2건 판매, 동료 1인당 월 3건 화환 판매 시의 보수적인 예상치입니다.
                        </div>
                    </div>

                    {/* 결과 카드 */}
                    <div className={styles.calcResultCard}>
                        <div className={styles.calcResultTitle}>이번 달 예상 수령액</div>
                        <div className={styles.calcResultAmount}>
                            {grandTotal.toLocaleString()}원
                        </div>

                        <div className={styles.calcBreakdown}>
                            <div className={styles.calcBreakdownRow}>
                                <span>화환 판매 수당 (건당 5.5만)</span>
                                <strong>+{flowerRewardTotal.toLocaleString()}원</strong>
                            </div>
                            <div className={styles.calcBreakdownRow}>
                                <span>추천인 평생 연금 (건당 3,500원)</span>
                                <strong style={{ color: '#86efac' }}>+{referralBonusTotal.toLocaleString()}원</strong>
                            </div>
                        </div>

                        <a 
                            href="https://bugoon.maeumbugo.co.kr/b2b/signup" 
                            className={styles.calcActionBtn}
                        >
                            이 수익 지금 바로 내 지갑으로 받기 →
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
