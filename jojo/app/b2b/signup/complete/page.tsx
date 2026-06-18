'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from '../signup.module.css';

function CompleteContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code') || '';
    const name = (() => {
        try {
            const u = localStorage.getItem('b2b_user');
            return u ? JSON.parse(u).owner_name : '';
        } catch { return ''; }
    })();

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>
                <span style={{ width: 36 }} />
                <span className={styles.headerTitle}>회원가입완료</span>
                <span style={{ width: 36 }} />
            </div>

            <div style={{ padding: '80px 28px 40px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#191F28', lineHeight: '1.4', marginBottom: '16px' }}>
                    {name ? `${name} 님,` : ''}<br />
                    <span style={{ color: '#333D4B' }}>마음부고 파트너</span> 환영합니다!
                </h2>
                <p style={{ fontSize: '14px', color: '#8B95A1', marginBottom: '36px', lineHeight: '1.5' }}>
                    마음부고 파트너의 다양한 서비스를<br />이용하실 수 있습니다.
                </p>

                {/* 가입 정보 카드 */}
                <div style={{
                    border: '1px solid #E5E8EB',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '40px',
                    textAlign: 'center',
                }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#333D4B', marginBottom: '10px' }}>
                        [가입정보]
                    </p>
                    {code && (
                        <p style={{ fontSize: '14px', color: '#4E5968', marginBottom: '4px' }}>
                            추천 코드: <strong>{code}</strong>
                        </p>
                    )}
                    <p style={{ fontSize: '12px', color: '#8B95A1' }}>
                        가입일: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </p>
                </div>

                {/* 로그인하기 */}
                <a
                    href="/b2b/dashboard"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '52px',
                        background: '#333D4B',
                        color: '#fff',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                    }}
                >
                    로그인하기
                </a>
            </div>
        </div>
    );
}

export default function SignupCompletePage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#fff' }} />}>
            <CompleteContent />
        </Suspense>
    );
}
