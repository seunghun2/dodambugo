'use client';

import React, { useState } from 'react';
import styles from './landing.module.css';

interface DualAudienceSectionProps {
    onOpenInquiry: () => void;
}

export default function DualAudienceSection({ onOpenInquiry }: DualAudienceSectionProps) {
    const [activeTab, setActiveTab] = useState<'individual' | 'corporate'>('individual');

    return (
        <section id="dual-benefits" className={styles.dualSection}>
            <div className={styles.dualContainer}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTag} style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#86efac' }}>
                        맞춤형 파트너십
                    </span>
                    <h2 className={styles.sectionTitle} style={{ color: '#ffffff' }}>
                        현장 지도사부터 상조 본사까지,<br />
                        모두를 만족시키는 독보적 혜택
                    </h2>
                    <p className={styles.sectionDesc} style={{ color: '#94a3b8' }}>
                        개인 프리랜서 활동도, 소속 상조회사 단체 도입도 부고온플러스 하나로 완벽하게 해결됩니다.
                    </p>
                </div>

                {/* 탭 전환 버튼 */}
                <div className={styles.tabSwitcher}>
                    <button
                        onClick={() => setActiveTab('individual')}
                        className={`${styles.tabBtn} ${activeTab === 'individual' ? styles.tabBtnActive : ''}`}
                    >
                        👤 장례지도사 (개인 파트너)
                    </button>
                    <button
                        onClick={() => setActiveTab('corporate')}
                        className={`${styles.tabBtn} ${activeTab === 'corporate' ? styles.tabBtnActive : ''}`}
                    >
                        🏢 장례식장 · 상조회사 (법인 본사)
                    </button>
                </div>

                {/* 탭 내용 */}
                {activeTab === 'individual' ? (
                    <div className={styles.tabContentGrid}>
                        <div className={styles.benefitCard}>
                            <div className={styles.benefitIcon}>💰</div>
                            <h3 className={styles.benefitTitle}>건당 최대 65,000원 적립</h3>
                            <p className={styles.benefitDesc}>
                                부고장에 화환 주문이 들어오면 기본 5만 원, VIP 화환 6.5만 원이 주문 완료 즉시 지도사님의 지갑에 투명하게 꽂힙니다.
                            </p>
                        </div>

                        <div className={styles.benefitCard}>
                            <div className={styles.benefitIcon}>⚡</div>
                            <h3 className={styles.benefitTitle}>24시간 언제든 실시간 출금</h3>
                            <p className={styles.benefitDesc}>
                                월말까지 기다릴 필요 없습니다. 모바일에서 [출금 신청] 터치 1번이면 3.3% 원천징수 공제 후 지도사님 통장으로 바로 입금됩니다.
                            </p>
                        </div>

                        <div className={styles.benefitCard}>
                            <div className={styles.benefitIcon}>🤝</div>
                            <h3 className={styles.benefitTitle}>동료 추천 건당 3,500원 연금</h3>
                            <p className={styles.benefitDesc}>
                                내가 추천한 동료 지도사가 화환을 팔 때마다 건당 3,500원의 보너스가 평생 내 지갑으로 무제한 자동 적립됩니다.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={styles.tabContentGrid}>
                        <div className={styles.benefitCard}>
                            <div className={styles.benefitIcon}>📊</div>
                            <h3 className={styles.benefitTitle}>본사 전용 관리자 어드민 제공</h3>
                            <p className={styles.benefitDesc}>
                                소속 장례지도사들의 부고장 개설 현황, 화환 판매 현황, 부의금 결제 내역을 실시간 대시보드에서 한눈에 통제할 수 있습니다.
                            </p>
                        </div>

                        <div className={styles.benefitCard}>
                            <div className={styles.benefitIcon}>📑</div>
                            <h3 className={styles.benefitTitle}>월간 정산서 & 세금계산서 연동</h3>
                            <p className={styles.benefitDesc}>
                                매월 1일 화환/부의금/답례품 정산서가 자동 집계되어 PDF로 출력됩니다. 본사 발행 세금계산서 기준으로 깔끔하게 정산 송금됩니다.
                            </p>
                        </div>

                        <div className={styles.benefitCard}>
                            <div className={styles.benefitIcon}>💎</div>
                            <h3 className={styles.benefitTitle}>부의금 3.3% & 답례품 4% 쉐어</h3>
                            <p className={styles.benefitDesc}>
                                화환 본사 수수료 외에도 소속 지도사 부고장에서 결제된 온라인 부의금의 3.3%, 모바일 답례품 결제의 최대 4%가 본사 수익으로 귀속됩니다.
                            </p>
                        </div>
                    </div>
                )}

                {/* 탭 하단 액션 */}
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    {activeTab === 'individual' ? (
                        <a 
                            href="https://bugoon.maeumbugo.co.kr/b2b/signup" 
                            className={styles.heroCtaBtn}
                            style={{ display: 'inline-flex' }}
                        >
                            장례지도사 파트너 무료 등록하기 →
                        </a>
                    ) : (
                        <button 
                            onClick={onOpenInquiry}
                            className={styles.heroCtaBtn}
                            style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #fde047, #f59e0b)', color: '#0f172a' }}
                        >
                            상조사 / 장례식장 제휴 문의하기 →
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
