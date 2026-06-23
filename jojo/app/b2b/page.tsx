'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './home.module.css';

export default function B2BHomePage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            const token = localStorage.getItem('b2b_token');
            router.replace(token ? '/b2b/dashboard' : '/b2b/login');
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
                        src="/images/splash/logo.png"
                        alt="부고온"
                        className={styles.bottomLogo}
                    />
                </div>
            </div>
        </div>
    );
}
