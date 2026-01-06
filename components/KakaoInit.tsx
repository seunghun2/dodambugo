'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        Kakao: any;
    }
}

export default function KakaoInit() {
    useEffect(() => {
        // 카카오 SDK 초기화
        const initKakao = () => {
            if (typeof window !== 'undefined' && window.Kakao) {
                if (!window.Kakao.isInitialized()) {
                    window.Kakao.init('5aa868e69d68e913ed9da7c3def45151');
                    console.log('Kakao SDK initialized');
                }
            }
        };

        // SDK 로드 대기
        if (window.Kakao) {
            initKakao();
        } else {
            const checkKakao = setInterval(() => {
                if (window.Kakao) {
                    initKakao();
                    clearInterval(checkKakao);
                }
            }, 100);

            // 5초 후 타임아웃
            setTimeout(() => clearInterval(checkKakao), 5000);
        }
    }, []);

    return null;
}

// 카카오톡 공유 함수
export function shareKakao(options: {
    title: string;
    description: string;
    imageUrl?: string;
    buttonText?: string;
}) {
    if (typeof window === 'undefined' || !window.Kakao) {
        console.error('Kakao SDK not loaded');
        return false;
    }

    if (!window.Kakao.isInitialized()) {
        window.Kakao.init('5aa868e69d68e913ed9da7c3def45151');
    }

    const url = window.location.href;

    window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: options.title,
            description: options.description,
            imageUrl: options.imageUrl || 'https://maeumbugo.co.kr/og-bugo-v3.png',
            link: {
                mobileWebUrl: url,
                webUrl: url,
            },
        },
        buttons: [
            {
                title: options.buttonText || '부고 보기',
                link: {
                    mobileWebUrl: url,
                    webUrl: url,
                },
            },
        ],
    });

    return true;
}
