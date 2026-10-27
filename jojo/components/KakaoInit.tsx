'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        Kakao: any;
    }
}

export default function KakaoInit() {
    useEffect(() => {
        const getKakaoKey = () => {
            if (typeof window !== 'undefined') {
                const isB2B = window.location.hostname.includes('bugoon') || window.location.pathname.includes('/b2b');
                if (isB2B) return '40f451664b3863f70a9537714dddd821';
            }
            return '5aa868e69d68e913ed9da7c3def45151';
        };

        const initKakao = () => {
            if (typeof window !== 'undefined' && window.Kakao) {
                const key = getKakaoKey();
                if (window.Kakao.isInitialized()) {
                    try { window.Kakao.cleanup(); } catch (e) {}
                }
                window.Kakao.init(key);
                console.log('Kakao SDK initialized with key:', key);
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

    const getKakaoKey = () => {
        if (typeof window !== 'undefined') {
            const isB2B = window.location.hostname.includes('bugoon') || window.location.pathname.includes('/b2b');
            if (isB2B) return '40f451664b3863f70a9537714dddd821';
        }
        return '5aa868e69d68e913ed9da7c3def45151';
    };

    const targetKey = getKakaoKey();
    if (window.Kakao.isInitialized()) {
        try { window.Kakao.cleanup(); } catch (e) {}
    }
    window.Kakao.init(targetKey);

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
