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
        }, 1600);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className={styles.page}>
            <div className={styles.center}>
                <div className={styles.mark}>
                    <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                        <path d="M14 3C14 3 7 7 7 14C7 18 9 22 14 26C19 22 21 18 21 14C21 7 14 3 14 3Z" fill="currentColor"/>
                    </svg>
                </div>
                <p className={styles.name}>부고온 파트너</p>
            </div>
        </div>
    );
}
