'use client';

import React from 'react';
import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingFooter() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <div className={styles.footerTop}>
                    <div className={styles.footerLogo}>
                        부고온<span style={{ color: '#4ade80' }}>플러스</span>
                    </div>
                    <div className={styles.footerLinks}>
                        <Link href="/b2b/terms" className={styles.footerLink}>이용약관</Link>
                        <Link href="/b2b/privacy" className={styles.footerLink}>개인정보처리방침</Link>
                        <a href="https://bugoon.maeumbugo.co.kr/b2b/login" className={styles.footerLink}>파트너 로그인</a>
                    </div>
                </div>

                <div>
                    <p style={{ margin: '4px 0' }}>
                        주식회사 마음부고 | 대표이사: 백승훈 | 사업자등록번호: 829-86-03310
                    </p>
                    <p style={{ margin: '4px 0' }}>
                        통신판매업 신고번호: 2024-서울강남-03102 | 고객센터: 1533-3592 (평일 09:00 ~ 18:00)
                    </p>
                    <p style={{ margin: '4px 0', color: '#475569' }}>
                        부고온플러스는 대한민국 장례지도사 및 상조회사를 위한 B2B 전용 모바일 부고·정산 솔루션입니다.
                    </p>
                    <p style={{ margin: '12px 0 0', color: '#475569', fontSize: '12px' }}>
                        © 2026 MAEUMBUGO Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
