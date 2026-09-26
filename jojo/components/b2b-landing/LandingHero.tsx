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
            <div className={styles.heroGlow} />

            <div className={styles.heroBadge}>
                <span>✨</span>
                <span>대한민국 1등 장례지도사 & 상조사 부고 솔루션</span>
            </div>

            <h1 className={styles.heroTitle}>
                부고장 하나 보냈을 뿐인데,<br />
                <span className={styles.goldGradientText}>화환 1건당 최대 65,000원</span> 적립
            </h1>

            <p className={styles.heroSubtitle}>
                무겁고 귀찮은 앱 설치 없이 <strong>카톡 링크 클릭 10초 만에</strong> 시작하세요.<br />
                장례지도사 개인부터 대형 상조회사까지, 투명한 실시간 정산을 보장합니다.
            </p>

            <form onSubmit={handleQuickStart} className={styles.quickSignupBox}>
                <div className={styles.inputGroup}>
                    <input
                        type="tel"
                        placeholder="휴대폰 번호 입력 (010-0000-0000)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={styles.phoneInput}
                    />
                    <button type="submit" className={styles.heroCtaBtn}>
                        10초 만에 무료 시작하기 →
                    </button>
                </div>
            </form>

            <div className={styles.heroSubInfo}>
                <div className={styles.heroSubInfoItem}>
                    <span>✓</span> <span>가입비 / 월 이용료 0원</span>
                </div>
                <div className={styles.heroSubInfoItem}>
                    <span>✓</span> <span>3.3% 원천징수 실시간 출금</span>
                </div>
                <div className={styles.heroSubInfoItem}>
                    <span>✓</span> <span>상조 본사 정산서 자동 발행</span>
                </div>
            </div>

            {/* 3D 모바일 목업 쇼케이스 */}
            <div className={styles.mockupShowcase}>
                <div className={styles.phoneFrame}>
                    <div className={styles.phoneInner}>
                        <div className={styles.phoneHeader}>
                            <div className={styles.phoneHeaderText}>부고온플러스 실시간 알림</div>
                            <div className={styles.phoneHeaderTitle}>화환 판매 및 수당 적립 완료</div>
                        </div>

                        <div className={styles.phoneBody}>
                            {/* 모의 알림 카드 1 */}
                            <div className={styles.mockOrderCard}>
                                <div className={styles.mockOrderIcon}>💐</div>
                                <div className={styles.mockOrderDetails}>
                                    <div className={styles.mockOrderName}>고급 근조 3단 화환 배송완료</div>
                                    <div className={styles.mockOrderReward}>+55,000원 적립</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>서울성모병원 장례식장 1호실</div>
                                </div>
                            </div>

                            {/* 모의 알림 카드 2 */}
                            <div className={styles.mockOrderCard}>
                                <div className={styles.mockOrderIcon}>🤝</div>
                                <div className={styles.mockOrderDetails}>
                                    <div className={styles.mockOrderName}>추천 파트너 판매 보너스</div>
                                    <div className={styles.mockOrderReward} style={{ color: '#0284c7' }}>+3,500원 적립</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>김*원 지도사님의 화환 주문</div>
                                </div>
                            </div>

                            {/* 모의 알림 카드 3 */}
                            <div className={styles.mockOrderCard}>
                                <div className={styles.mockOrderIcon}>🏦</div>
                                <div className={styles.mockOrderDetails}>
                                    <div className={styles.mockOrderName}>지갑 출금 신청 즉시 처리</div>
                                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155', marginTop: '2px' }}>
                                        350,000원 송금완료
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>국민은행 487102******</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
