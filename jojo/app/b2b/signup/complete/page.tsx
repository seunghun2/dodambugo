'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import styles from '../signup.module.css';

function CompleteContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code') || '';
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareKakao = () => {
        if (typeof window !== 'undefined' && (window as any).Kakao) {
            const kakao = (window as any).Kakao;
            if (!kakao.isInitialized()) return;
            kakao.Share.sendDefault({
                objectType: 'text',
                text: `마음부고 파트너에 가입하시고 화환 판매 수익을 받아 보세요.\n\n추천 코드: ${code}`,
                link: {
                    mobileWebUrl: `${window.location.origin}/b2b/signup?ref=${code}`,
                    webUrl: `${window.location.origin}/b2b/signup?ref=${code}`,
                },
            });
        }
    };

    return (
        <div className={styles.container}>
            <div style={{ padding: '60px 20px 40px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#191F28', marginBottom: '8px' }}>
                    가입이 완료되었습니다.
                </h2>
                <p style={{ fontSize: '14px', color: '#8B95A1', marginBottom: '36px', lineHeight: '1.5' }}>
                    부고장을 작성하시고 화환 판매 수익을<br />확인하실 수 있습니다.
                </p>

                {/* 추천 코드 */}
                <div style={{
                    background: '#F9FAFB',
                    borderRadius: '14px',
                    padding: '20px',
                    marginBottom: '12px',
                }}>
                    <p style={{ fontSize: '12px', color: '#8B95A1', marginBottom: '6px' }}>
                        나의 추천 코드
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px', fontWeight: '700', color: '#191F28', letterSpacing: '2px' }}>
                            {code}
                        </span>
                        <button
                            onClick={copyCode}
                            style={{
                                height: '30px',
                                padding: '0 12px',
                                background: '#fff',
                                border: '1px solid #E5E8EB',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#4E5968',
                                cursor: 'pointer',
                            }}
                        >
                            {copied ? '복사 완료' : '복사'}
                        </button>
                    </div>
                </div>

                <p style={{ fontSize: '12px', color: '#8B95A1', marginBottom: '28px', lineHeight: '1.5' }}>
                    다른 파트너에게 이 코드를 공유하시면<br />추천 수당을 받으실 수 있습니다.
                </p>

                {/* 카카오 공유 */}
                <button
                    onClick={shareKakao}
                    style={{
                        width: '100%',
                        height: '48px',
                        background: '#FEE500',
                        color: '#191919',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginBottom: '10px',
                        fontFamily: 'inherit',
                    }}
                >
                    카카오톡으로 공유하기
                </button>

                {/* 시작 */}
                <a
                    href="/b2b/dashboard"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '48px',
                        background: '#333D4B',
                        color: '#fff',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                    }}
                >
                    시작하기
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
