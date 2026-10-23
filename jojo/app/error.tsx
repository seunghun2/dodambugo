'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('페이지 오류:', error);
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#fff',
            padding: '40px 20px',
            textAlign: 'center',
        }}>
            <h1 style={{
                fontSize: '48px',
                fontWeight: '700',
                color: '#1a1a1a',
                margin: '0 0 24px 0',
                letterSpacing: '-1px',
            }}>
                500 ERROR
            </h1>

            <p style={{
                fontSize: '14px',
                color: '#888',
                lineHeight: '1.8',
                margin: '0 0 40px 0',
            }}>
                죄송합니다. 오류가 발생했습니다.<br />
                일시적인 문제일 수 있으니,<br />
                잠시 후 다시 시도해주세요.
            </p>

            {/* 깨진 창문 일러스트 SVG */}
            <svg
                width="160"
                height="120"
                viewBox="0 0 160 120"
                fill="none"
                stroke="#999"
                strokeWidth="1"
                style={{ marginBottom: '48px' }}
            >
                {/* 구름 */}
                <ellipse cx="50" cy="25" rx="20" ry="12" />
                <ellipse cx="70" cy="22" rx="15" ry="10" />

                {/* 집 본체 */}
                <rect x="70" y="50" width="60" height="50" />

                {/* 지붕 */}
                <polyline points="65,50 100,25 135,50" />

                {/* 문 */}
                <rect x="90" y="70" width="15" height="30" />

                {/* 깨진 창문 */}
                <rect x="110" y="60" width="12" height="12" />
                <line x1="110" y1="60" x2="122" y2="72" />
                <line x1="122" y1="60" x2="110" y2="72" />

                {/* 느낌표 */}
                <line x1="40" y1="55" x2="40" y2="80" strokeWidth="2" />
                <circle cx="40" cy="88" r="2" fill="#999" />

                {/* 굴뚝 */}
                <rect x="115" y="30" width="10" height="15" />
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        fontSize: '14px',
                        color: '#fff',
                        background: '#1a1a1a',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 32px',
                        cursor: 'pointer',
                    }}
                >
                    다시 시도
                </button>
                <a
                    href="/"
                    style={{
                        fontSize: '14px',
                        color: '#1a1a1a',
                        textDecoration: 'underline',
                        textUnderlineOffset: '4px',
                    }}
                >
                    홈으로
                </a>
            </div>
        </div>
    );
}
