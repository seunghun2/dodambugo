'use client';

import React from 'react';
import styles from './landing.module.css';

export default function PartnerTestimonials() {
    return (
        <section className={styles.storySection}>
            <div className={styles.sectionHeaderCenter}>
                <div className={styles.sectionPretitle}>실사용자 후기</div>
                <h2 className={styles.sectionTitle}>부고온플러스와 함께하는<br />장례지도사들의 이야기</h2>
                <p style={{ fontSize: '16px', color: '#64748b', marginTop: '10px' }}>
                    실제 현장에서 활동하시는 장례지도사님들의 생생한 목소리입니다.
                </p>
            </div>

            <div className={styles.storyGrid}>
                {/* 이야기 1 */}
                <div className={styles.storyCard}>
                    <p className={styles.storyQuote}>
                        "부고온플러스 덕분에 부고장 작성이 <strong>정말 편리해졌어요.</strong> 예전엔 상주들 친족 관계 일일이 물어보고 오타 나서 스트레스였는데, 3분이면 카톡으로 깔끔하게 완성됩니다."
                    </p>
                    <div className={styles.storyAuthor}>
                        <div className={styles.storyAvatar}>김</div>
                        <div>
                            <div className={styles.storyAuthorName}>김*원 지도사님</div>
                            <div className={styles.storyAuthorRole}>경력 11년차 장례지도사 (서울)</div>
                        </div>
                    </div>
                </div>

                {/* 이야기 2 */}
                <div className={styles.storyCard}>
                    <p className={styles.storyQuote}>
                        "화환 배송 완료되자마자 <strong>55,000원이 실시간으로 지갑에</strong> 꽂히는 걸 보고 깜짝 놀랐습니다. 푼돈 취급하던 타사 앱 지우고 부고온플러스로 완전히 정착했습니다."
                    </p>
                    <div className={styles.storyAuthor}>
                        <div className={styles.storyAvatar}>이</div>
                        <div>
                            <div className={styles.storyAuthorName}>이*순 지도사님</div>
                            <div className={styles.storyAuthorRole}>경력 7년차 장례지도사 (경기)</div>
                        </div>
                    </div>
                </div>

                {/* 이야기 3 */}
                <div className={styles.storyCard}>
                    <p className={styles.storyQuote}>
                        "동료 지도사 3명 소개해 줬는데, 제가 당직 아닌 날에도 <strong>추천 보너스 3,500원 알림</strong>이 쏠쏠하게 들어옵니다. 진짜 평생 연금 통장 하나 생긴 것 같아요."
                    </p>
                    <div className={styles.storyAuthor}>
                        <div className={styles.storyAvatar}>장</div>
                        <div>
                            <div className={styles.storyAuthorName}>장*영 팀장님</div>
                            <div className={styles.storyAuthorRole}>경력 9년차 의전팀장 (인천)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 제휴사 네트워크 배너 */}
            <div style={{ maxWidth: '900px', margin: '60px auto 0', padding: '24px', background: '#f8fafc', borderRadius: '16px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '12px' }}>
                    더좋은라이프, 마음부고, 안동상조 등 전국 주요 상조사 및 장례식장 파트너십 제휴
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', opacity: 0.75 }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#334155' }}>THE JOEUN LIFE</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#334155' }}>MAEUMBUGO</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#334155' }}>ANDONG LIFE</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#334155' }}>BUGOON PLUS</span>
                </div>
            </div>
        </section>
    );
}
