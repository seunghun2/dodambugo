'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { B2BAdminSidebar } from '@/components/b2b/B2BAdminSidebar';
import { B2BAdminMobileNav } from '@/components/b2b/B2BAdminMobileNav';
import { IconLock } from '@tabler/icons-react';
import styles from './adminLayout.module.css';

export default function B2BAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // 세션 확인
    useEffect(() => {
        setMounted(true);
        const session = sessionStorage.getItem('admin_session');
        if (session === 'authenticated') {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await fetch('/api/admin-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.token) {
                sessionStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_token', data.token);
            }
            sessionStorage.setItem('admin_session', 'authenticated');
            setIsAuthenticated(true);
        } else {
            setError('비밀번호가 틀렸습니다');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin_session');
        setIsAuthenticated(false);
        router.replace('/b2b/admin');
    };

    if (!mounted || loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '14px' }}>
                로딩 중...
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.loginOverlay}>
                <div className={styles.loginCard}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#d4a84b' }}>
                        <IconLock stroke={1.5} size={40} />
                    </div>
                    <h2 className={styles.loginTitle}>B2B 어드민 로그인</h2>
                    <p className={styles.loginSubtitle}>보안 비밀번호를 입력하여 접속해주세요.</p>
                    
                    <form onSubmit={handleLogin}>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>비밀번호</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="관리자 비밀번호 입력"
                                className={styles.loginInput}
                                autoFocus
                            />
                        </div>
                        {error && <p className={styles.errorMsg}>{error}</p>}
                        <button type="submit" className={styles.submitBtn}>
                            로그인
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <B2BAdminSidebar onLogout={handleLogout} />
            <div className={styles.sidebarSpacing}>
                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>
            <B2BAdminMobileNav />
        </div>
    );
}
