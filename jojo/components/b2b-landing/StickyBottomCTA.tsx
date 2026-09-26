'use client';

import React from 'react';
import styles from './landing.module.css';

export default function StickyBottomCTA() {
    return (
        <div className={styles.stickyBottomBar}>
            <div className={styles.stickyText}>
                <span className={styles.stickySub}>가입비 0원 평생 무료</span>
                <span className={styles.stickyMain}>화환 수당 건당 최대 6.5만 원</span>
            </div>
            <a 
                href="https://bugoon.maeumbugo.co.kr/b2b/signup" 
                className={styles.stickyBtn}
            >
                10초 가입하기 →
            </a>
        </div>
    );
}
