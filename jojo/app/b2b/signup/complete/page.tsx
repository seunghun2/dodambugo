'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

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

    const now = new Date();
    const dateStr = `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 ${String(now.getDate()).padStart(2, '0')}일 ${String(now.getHours()).padStart(2, '0')}시 ${String(now.getMinutes()).padStart(2, '0')}분 ${String(now.getSeconds()).padStart(2, '0')}초`;

    const phone = (() => {
        try {
            const u = localStorage.getItem('b2b_user');
            return u ? JSON.parse(u).phone : '';
        } catch { return ''; }
    })();

    return (
        <div style={{
            minHeight: '100dvh',
            background: '#fff',
            maxWidth: 480,
            margin: '0 auto',
        }}>
            {/* 헤더 */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 52,
                padding: '0 16px',
                borderBottom: '1px solid #E5E8EB',
            }}>
                <button
                    onClick={() => router.push('/b2b/login')}
                    style={{
                        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none', fontSize: 18, color: '#1A1A1A', cursor: 'pointer',
                    }}
                >‹</button>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>회원가입완료</span>
                <button
                    onClick={() => router.push('/b2b/dashboard')}
                    style={{
                        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none', fontSize: 18, color: '#1A1A1A', cursor: 'pointer',
                    }}
                >✕</button>
            </header>

            <div style={{ padding: '60px 28px 40px', textAlign: 'center' }}>
                {/* 환영 메시지 */}
                <h2 style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#1A1A1A',
                    lineHeight: 1.5,
                    marginBottom: 16,
                }}>
                    {name ? <>{name} 님,<br /></> : null}
                    <span style={{ fontWeight: 800 }}>마음부고</span> 환영합니다!
                </h2>
                <p style={{
                    fontSize: 14,
                    color: '#8B95A1',
                    marginBottom: 40,
                    lineHeight: 1.6,
                }}>
                    마음부고의 다양한 서비스를<br/>이용하실 수 있습니다.
                </p>

                {/* 가입정보 카드 */}
                <div style={{
                    border: '1px solid #E5E8EB',
                    borderRadius: 12,
                    padding: '24px 20px',
                    marginBottom: 40,
                    textAlign: 'center',
                }}>
                    <p style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#1A1A1A',
                        marginBottom: 16,
                    }}>[가입정보]</p>

                    {phone && (
                        <p style={{ fontSize: 14, color: '#4E5968', marginBottom: 6 }}>
                            ID: <strong>{phone}</strong>
                        </p>
                    )}

                    {code && (
                        <p style={{ fontSize: 14, color: '#4E5968', marginBottom: 6 }}>
                            추천코드: <strong>{code}</strong>
                        </p>
                    )}

                    <p style={{ fontSize: 14, color: '#4E5968' }}>
                        가입일: {dateStr}
                    </p>
                </div>

                {/* 시작하기 */}
                <button
                    onClick={() => router.push('/b2b/dashboard')}
                    style={{
                        width: '100%',
                        height: 52,
                        background: '#3A8F47',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    시작하기
                </button>
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
