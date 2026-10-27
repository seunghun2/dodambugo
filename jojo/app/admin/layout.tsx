'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
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

    // 세션 확인
    useEffect(() => {
        const session = sessionStorage.getItem('admin_session');
        if (session === 'authenticated') {
            setIsAuthenticated(true);
            // /admin 루트로 접근하면 /admin/bugo로 리다이렉트
            if (pathname === '/admin') {
                router.replace('/admin/bugo');
            }
        }
        setLoading(false);
    }, [pathname, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 환경변수로 설정된 비밀번호와 비교
        const res = await fetch('/api/admin-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });

        if (res.ok) {
            sessionStorage.setItem('admin_session', 'authenticated');
            setIsAuthenticated(true);
            router.replace('/admin/bugo');
        } else {
            setError('비밀번호가 틀렸습니다');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                로딩 중...
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#f8f9fa',
            }}>
                <form onSubmit={handleLogin} style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    width: '320px',
                }}>
                    <h2 style={{ marginBottom: '24px', textAlign: 'center', color: '#333' }}>
                        관리자 로그인
                    </h2>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호 입력"
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '16px',
                            boxSizing: 'border-box',
                        }}
                        autoFocus
                    />
                    {error && (
                        <p style={{ color: '#dc3545', marginBottom: '16px', textAlign: 'center' }}>
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#D4A84B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        로그인
                    </button>
                </form>
            </div>
        );
    }

    return <>{children}</>;
}
