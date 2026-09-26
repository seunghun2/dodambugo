'use client';

import React, { useState } from 'react';
import styles from './landing.module.css';

export default function LandingHero() {
    const [phone, setPhone] = useState('');

    const handleQuickStart = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const targetUrl = cleanPhone 
            ? `https://bugoon.maeumbugo.co.kr/b2b/signup?phone=${cleanPhone}`
            : `https://bugoon.maeumbugo.co.kr/b2b/signup`;
        window.location.href = targetUrl;
    };

    return (
        <section className={styles.heroSection}>
            {/* 좌측: 타이포그래피 & 빠른 시작 */}
            <div className={styles.heroLeft}>
                <div className={styles.heroBadge}>
                    <span>대한민국 1등 장례지도사 & 상조사 부고 솔루션</span>
                </div>

                <h1 className={styles.heroTitle}>
                    장례 지도사의 든든한 파트너<br />
                    간편한 <span className={styles.heroTitleHighlight}>수익 창출</span> 솔루션
                </h1>

                <p className={styles.heroSubtitle}>
                    상주부터 장례지도사, 상조회사 본사까지!<br />
                    무거운 앱 설치 없이 <strong>카카오톡 링크 클릭 10초 만에</strong> 시작하세요.<br />
                    부고장 1건만 제작해도 화환 판매 시 <strong>건당 최대 65,000원</strong>이 실시간 적립됩니다.
                </p>

                <div className={styles.heroActionGroup}>
                    <form onSubmit={handleQuickStart} className={styles.heroForm}>
                        <input
                            type="tel"
                            placeholder="휴대폰 번호 입력 (010-0000-0000)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={styles.heroInput}
                        />
                        <button type="submit" className={styles.heroSubmitBtn}>
                            10초 무료 가입하기
                        </button>
                    </form>

                    <div className={styles.heroTrustList}>
                        <div className={styles.heroTrustItem}>
                            <span className={styles.checkIcon}>✓</span>
                            <span>가입비 평생 무료</span>
                        </div>
                        <div className={styles.heroTrustItem}>
                            <span className={styles.checkIcon}>✓</span>
                            <span>실시간 계좌 출금</span>
                        </div>
                        <div className={styles.heroTrustItem}>
                            <span className={styles.checkIcon}>✓</span>
                            <span>상조 본사 정산서 연동</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 우측: 정밀 디바이스 실물 목업 */}
            <div className={styles.heroRight}>
                <div className={styles.mockupContainer}>
                    {/* 정밀 아이폰 15/16 Pro 섀시 */}
                    <div className={styles.deviceChassis}>
                        <div className={styles.deviceScreen}>
                            {/* 다이내믹 아일랜드 */}
                            <div className={styles.dynamicIsland} />

                            {/* 부고장 상단 브랜드 헤더 */}
                            <div className={styles.mockAppHeader}>
                                <div className={styles.mockAppBrand}>BUGOON PLUS</div>
                                <div className={styles.mockAppTitle}>모바일 부고 알림</div>
                            </div>

                            {/* 실제 부고장 콘텐츠 */}
                            <div className={styles.mockAppBody}>
                                <div className={styles.mockDeceasedCard}>
                                    <div className={styles.mockRibbon}>謹 弔</div>
                                    <div className={styles.mockName}>故 홍 길 동 님</div>
                                    <div className={styles.mockAge}>향년 84세 (2026년 09월 26일 별세)</div>

                                    <div className={styles.mockFuneralInfo}>
                                        <div><strong>빈소:</strong> 서울아산병원 장례식장 1호실</div>
                                        <div style={{ marginTop: '2px' }}><strong>발인:</strong> 2026년 09월 28일 (월) 08:30</div>
                                        <div style={{ marginTop: '2px' }}><strong>장지:</strong> 서울추모공원</div>
                                        <div style={{ marginTop: '2px', color: '#15803d' }}><strong>담당:</strong> 김*원 장례지도사</div>
                                    </div>
                                </div>

                                <div className={styles.mockButtonRow}>
                                    <div className={styles.mockWreathBtn}>
                                        화환 보내기
                                    </div>
                                    <div className={styles.mockCondolenceBtn}>
                                        마음 전하기
                                    </div>
                                </div>

                                <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: 'auto' }}>
                                    부고온플러스 정품 모바일 부고장
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 실시간 수당 적립 플로팅 카드 (자연스럽게 겹침) */}
                    <div className={styles.floatingRewardCard}>
                        <div className={styles.floatingRewardIcon}>
                            ₩
                        </div>
                        <div className={styles.floatingRewardText}>
                            <span className={styles.floatingRewardLabel}>화환 주문 배송완료</span>
                            <span className={styles.floatingRewardAmount}>+55,000원 적립</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
