'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './home.module.css';

export default function B2BHomePage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                // 쿠키 기반 인증 확인 (iOS WebView localStorage 불안정 대응)
                const res = await fetch('/api/b2b/auth', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated) {
                        // 쿠키에서 인증 성공 → localStorage도 복원
                        if (data.token) localStorage.setItem('b2b_token', data.token);
                        if (data.user) localStorage.setItem('b2b_user', JSON.stringify(data.user));
                        router.replace('/b2b/dashboard');
                        return;
                    }
                }
            } catch {
                // API 호출 실패 시 localStorage fallback
                const token = localStorage.getItem('b2b_token');
                if (token) {
                    router.replace('/b2b/dashboard');
                    return;
                }
            }
            router.replace('/b2b/login');
        }, 3000);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className={styles.splashContainer}>
            {/* Panning Background Image */}
            <div className={styles.backgroundImage} />
            
            {/* Dark Overlay for Text Legibility */}
            <div className={styles.overlay} />

            {/* Content Layer */}
            <div className={styles.content}>
                {/* Main Slogan Image (Fade-in) */}
                <div className={styles.middleTextContainer}>
                    <img
                        src="/images/splash/font.png"
                        alt="부고온은 장례지도사와 함께합니다."
                        className={styles.fontImage}
                    />
                </div>
                
                {/* Bottom Logo (Fade-in) */}
                <div className={styles.bottomLogoContainer}>
                    <img
                        src="/images/splash/splashloㅎo.png"
                        alt="부고온"
                        className={styles.bottomLogo}
                    />
                </div>
            </div>
        </div>
    );
}
