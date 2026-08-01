'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import styles from './complete.module.css';

function CompleteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const code = searchParams.get('code') || '';
    const name = (() => {
        try {
            const u = localStorage.getItem('b2b_user');
            return u ? JSON.parse(u).owner_name : '';
        } catch { return ''; }
    })();

    const phone = (() => {
        try {
            const u = localStorage.getItem('b2b_user');
            return u ? JSON.parse(u).phone : '';
        } catch { return ''; }
    })();

    const now = new Date();
    const dateStr = `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 ${String(now.getDate()).padStart(2, '0')}일 ${String(now.getHours()).padStart(2, '0')}시 ${String(now.getMinutes()).padStart(2, '0')}분 ${String(now.getSeconds()).padStart(2, '0')}초`;

    return (
        <div className={styles.page}>
            {/* 헤더 */}
            <header className={styles.header}>
                <button className={styles.headerBtn} onClick={() => router.push('/b2b/login')}>‹</button>
                <span className={styles.headerTitle}>회원가입완료</span>
                <button className={styles.headerBtn} onClick={() => router.push('/b2b/dashboard')}>✕</button>
            </header>

            <div className={styles.inner}>
                {/* 체크 아이콘 */}
                <div className={styles.checkIcon}>
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                        <circle cx="28" cy="28" r="28" fill="#F0FDF4"/>
                        <path d="M17 28L24 35L39 20" stroke="#3A8F47" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>

                {/* 환영 메시지 */}
                <h2 className={styles.welcome}>
                    {name ? <>{name} 님,<br /></> : null}
                    <span className={styles.welcomeBrand}>부고온</span> 환영합니다!
                </h2>
                <p className={styles.desc}>
                    부고온의 다양한 서비스를<br/>이용하실 수 있습니다.
                </p>

                {/* 가입정보 카드 */}
                <div className={styles.infoCard}>
                    <p className={styles.infoLabel}>[가입정보]</p>

                    {phone && (
                        <p className={styles.infoRow}>
                            ID: <strong className={styles.infoValue}>{phone}</strong>
                        </p>
                    )}

                    {code && (
                        <p className={styles.infoRow}>
                            추천코드: <strong className={styles.infoValue}>{code}</strong>
                        </p>
                    )}

                    <p className={styles.infoRow}>
                        가입일: {dateStr}
                    </p>
                </div>

                {/* 시작하기 및 앱 다운로드 버튼 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    <button className={styles.startBtn} onClick={() => router.push('/b2b/dashboard')}>
                        파트너 서비스 시작하기
                    </button>
                    <a
                        href="https://bugoon.maeumbugo.co.kr"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '14px 0',
                            backgroundColor: '#1E293B',
                            color: '#FFFFFF',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: 600,
                            textAlign: 'center',
                            textDecoration: 'none'
                        }}
                    >
                        부고온 파트너 앱 다운로드
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function SignupCompletePage() {
    return (
        <Suspense fallback={<div className={styles.page} />}>
            <CompleteContent />
        </Suspense>
    );
}
