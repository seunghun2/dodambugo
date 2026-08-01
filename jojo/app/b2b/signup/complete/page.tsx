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

                {/* 메인 초록색 버튼: 홈으로 (대시보드로) 이동 */}
                <button
                    type="button"
                    className={styles.startBtn}
                    onClick={() => router.push('/b2b/dashboard')}
                >
                    부고온 시작하기 (홈으로)
                </button>

                {/* 부고장 바로 만들기 서브 버튼 */}
                <button
                    type="button"
                    style={{
                        width: '100%',
                        height: '48px',
                        background: '#F1F5F9',
                        color: '#334155',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '10px'
                    }}
                    onClick={() => router.push('/b2b/create')}
                >
                    모바일 부고장 작성하기
                </button>

                {/* 앱 미설치 유저용 다운로드 하단 안내 */}
                <p style={{ marginTop: '24px', fontSize: '13px', color: '#64748B' }}>
                    아직 부고온 앱이 없으신가요?{' '}
                    <button
                        type="button"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--b2b-accent)',
                            fontWeight: 700,
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '13px'
                        }}
                        onClick={() => {
                            const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
                            const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
                            if (isIOS) {
                                window.location.href = 'https://apps.apple.com/kr/app/%EB%B6%80%EA%B3%A0%EC%98%A8%ED%94%8C%EB%9F%AC%EC%8A%A4/id6786073225';
                            } else {
                                alert('안드로이드(Android) 파트너 앱은 구글 플레이스토어 정식 출시 준비 중입니다.\n현재는 모바일 웹 브라우저에서 동일하게 모든 기능을 편리하게 이용하실 수 있습니다!');
                            }
                        }}
                    >
                        앱 다운로드하기
                    </button>
                </p>
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
