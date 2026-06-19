'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { IconUser, IconLock, IconEyeOff, IconEye, IconCheck } from '@tabler/icons-react';
import styles from './login.module.css';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [autoLogin, setAutoLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('b2b_token');
        if (token) router.push('/b2b/dashboard');
    }, [router]);

    const handleLogin = async () => {
        if (!phone || !password) {
            setError('휴대폰 번호와 비밀번호를 입력해 주세요.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/b2b/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (autoLogin) {
                    localStorage.setItem('b2b_token', data.token);
                    localStorage.setItem('b2b_user', JSON.stringify(data.user));
                } else {
                    sessionStorage.setItem('b2b_token', data.token);
                    sessionStorage.setItem('b2b_user', JSON.stringify(data.user));
                }
                router.push('/b2b/dashboard');
            } else {
                setError(data.error || '로그인에 실패했습니다.');
            }
        } catch {
            setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
        setLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleLogin();
    };

    const refCode = searchParams.get('ref') || '';

    return (
        <div className={styles.page}>
            {/* 헤더 */}
            <header className={styles.header}>
                <span className={styles.headerTitle}>로그인</span>
            </header>
            <div className={styles.divider} />

            <div className={styles.inner}>
                {/* 로고 */}
                <div className={styles.logoSection}>
                    <div className={styles.logoMark}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <path d="M14 3C14 3 7 7 7 14C7 18 9 22 14 26C19 22 21 18 21 14C21 7 14 3 14 3Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <h1 className={styles.logoText}>마음부고 파트너</h1>
                </div>

                {/* 에러 */}
                {error && <p className={styles.error}>{error}</p>}

                {/* 폼 */}
                <div className={styles.form}>
                    <div className={styles.inputWrap}>
                        <IconUser size={18} stroke={1.5} className={styles.inputIcon} />
                        <input
                            type="tel"
                            className={styles.input}
                            placeholder="휴대폰 번호 입력"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="tel"
                        />
                    </div>
                    <div className={styles.inputWrap}>
                        <IconLock size={18} stroke={1.5} className={styles.inputIcon} />
                        <input
                            type={showPw ? 'text' : 'password'}
                            className={styles.input}
                            placeholder="비밀번호 입력"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className={styles.eyeBtn}
                            onClick={() => setShowPw(!showPw)}
                        >
                            {showPw ? <IconEye size={18} stroke={1.5} /> : <IconEyeOff size={18} stroke={1.5} />}
                        </button>
                    </div>

                    {/* 자동로그인 */}
                    <label className={styles.autoLogin}>
                        <span
                            className={`${styles.checkbox} ${autoLogin ? styles.checkboxActive : ''}`}
                            onClick={() => setAutoLogin(!autoLogin)}
                        >
                            {autoLogin && <IconCheck size={12} stroke={3} />}
                        </span>
                        <span className={styles.autoLoginText}>자동로그인</span>
                    </label>

                    <button
                        className={styles.loginBtn}
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </div>

                {/* 하단 링크 */}
                <div className={styles.bottom}>
                    <span className={styles.bottomLink} onClick={() => router.push('/b2b/login/forgot')}>비밀번호 찾기</span>
                    <span className={styles.bottomDivider}>|</span>
                    <span className={styles.bottomLink} onClick={() => router.push(`/b2b/signup${refCode ? `?ref=${refCode}` : ''}`)}>회원가입</span>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#fff' }} />}>
            <LoginContent />
        </Suspense>
    );
}
