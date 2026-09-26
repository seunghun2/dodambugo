'use client';

import React from 'react';
import Link from 'next/link';
import styles from './landing.module.css';

interface LandingHeaderProps {
    onOpenInquiry: () => void;
}

export default function LandingHeader({ onOpenInquiry }: LandingHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.headerInner}>
                <Link href="/" className={styles.logoArea}>
                    <div className={styles.logoBadge}>+</div>
                    <div className={styles.logoText}>
                        부고온<span className={styles.logoHighlight}>플러스</span>
                        <span className={styles.logoSub}>B2B</span>
                    </div>
                </Link>

                <nav className={styles.navLinks}>
                    <a href="#features" className={styles.navLink}>주요 기능</a>
                    <a href="#calculator" className={styles.navLink}>수익 계산기</a>
                    <a href="#comparison" className={styles.navLink}>타사 비교</a>
                    <button 
                        onClick={onOpenInquiry}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        className={styles.navLink}
                    >
                        기업 제휴 문의
                    </button>
                </nav>

                <div className={styles.headerActions}>
                    <a 
                        href="https://bugoon.maeumbugo.co.kr/b2b/login" 
                        className={styles.loginBtn}
                    >
                        PC버전 로그인
                    </a>
                    <a 
                        href="https://bugoon.maeumbugo.co.kr/b2b/signup" 
                        className={styles.startBtn}
                    >
                        파트너 무료 가입
                    </a>
                </div>
            </div>
        </header>
    );
}
