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
                justifyContent: 'center',
                height: 52,
                borderBottom: '1px solid #E5E8EB',
            }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>가입 완료</span>
            </header>

            <div style={{ padding: '60px 28px 40px', textAlign: 'center' }}>
                {/* 체크 아이콘 */}
                <div style={{ marginBottom: 20 }}>
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                        <circle cx="28" cy="28" r="28" fill="#F0FDF4"/>
                        <path d="M17 28L24 35L39 20" stroke="#3A8F47" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>

                <h2 style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#1A1A1A',
                    lineHeight: 1.4,
                    marginBottom: 8,
                }}>
                    {name ? `${name} 님,` : ''}
                    {name ? <br /> : null}
                    가입이 완료되었습니다
                </h2>
                <p style={{
                    fontSize: 14,
                    color: '#8B95A1',
                    marginBottom: 36,
                    lineHeight: 1.6,
                }}>
                    마음부고 파트너의 다양한 서비스를<br/>이용하실 수 있습니다.
                </p>

                {/* 추천 코드 */}
                {code && (
                    <div style={{
                        border: '1px solid #E5E8EB',
                        borderRadius: 12,
                        padding: '20px 16px',
                        marginBottom: 32,
                    }}>
                        <p style={{ fontSize: 12, color: '#8B95A1', marginBottom: 8 }}>나의 추천 코드</p>
                        <p style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: '#1A1A1A',
                            letterSpacing: '0.05em',
                            marginBottom: 12,
                        }}>{code}</p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(code);
                                alert('추천 코드가 복사되었습니다.');
                            }}
                            style={{
                                padding: '8px 20px',
                                background: '#F2F4F6',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#4E5968',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            복사하기
                        </button>
                    </div>
                )}

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
