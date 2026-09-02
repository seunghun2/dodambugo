'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { IconUser, IconLock, IconEyeOff, IconEye, IconCheck } from '@tabler/icons-react';
import styles from './login.module.css';

// 휴대폰 번호 포맷 (010-0000-0000)
function formatPhone(val: string): string {
    const digits = val.replace(/[^0-9]/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

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
        // 쿠키 기반 인증 확인 우선 (iOS WebView localStorage 불안정 대응)
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/b2b/auth', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated) {
                        if (data.token) localStorage.setItem('b2b_token', data.token);
                        if (data.user) localStorage.setItem('b2b_user', JSON.stringify(data.user));
                        router.replace('/b2b/dashboard');
                        return;
                    }
                }
            } catch {
                // fallback: localStorage 확인
                const token = localStorage.getItem('b2b_token');
                if (token) {
                    router.replace('/b2b/dashboard');
                    return;
                }
            }
        };
        checkAuth();
    }, [router]);

    const handleLogin = async () => {
        if (!phone.trim()) {
            setError('휴대폰 번호를 입력해 주세요.');
            return;
        }
        if (!password.trim()) {
            setError('비밀번호를 입력해 주세요.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/b2b/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.replace(/[^0-9]/g, ''), password }),
            });
            const data = await res.json();

            if (res.ok && data.token) {
                if (autoLogin) {
                    localStorage.setItem('b2b_token', data.token);
                    localStorage.setItem('b2b_user', JSON.stringify(data.user));
                } else {
                    sessionStorage.setItem('b2b_token', data.token);
                    sessionStorage.setItem('b2b_user', JSON.stringify(data.user));
                }
                router.replace('/b2b/dashboard');
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
                    <img 
                        src="/images/b2b-logo.png" 
                        alt="부고온 로고" 
                        className={styles.logoImage}
                    />
                </div>

                {/* 폼 */}
                <div className={styles.form}>
                    <div className={styles.inputWrap}>
                        <IconUser size={18} stroke={1.5} className={styles.inputIcon} />
                        <input
                            type="tel"
                            className={styles.input}
                            placeholder="휴대폰 번호 입력"
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
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

                    {/* 에러 메시지(좌측) & 자동로그인(우측) 동일선상 배치 */}
                    <div className={styles.subRow}>
                        <div className={styles.errorContainer}>
                            {error && <span className={styles.errorText}>{error}</span>}
                        </div>
                        <label className={styles.autoLogin}>
                            <span
                                className={`${styles.checkbox} ${autoLogin ? styles.checkboxActive : ''}`}
                                onClick={() => setAutoLogin(!autoLogin)}
                            >
                                {autoLogin && <IconCheck size={12} stroke={3} />}
                            </span>
                            <span className={styles.autoLoginText}>자동로그인</span>
                        </label>
                    </div>

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

            {/* 사업자 정보 푸터 영역 (카카오 비즈니스 소명 및 웹 표준 정보 준수) */}
            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div className={styles.footerInfo}>
                        <p>(주)마음부고 대표이사 김미연 | 사업자등록번호: 408-22-68851</p>
                        <p>통신판매업신고: 2026-서울강남-00502 | 주소: 서울특별시 강남구 압구정로 306</p>
                        <p>Copyright © maeumbugo Corp. All rights reserved.</p>
                    </div>
                </div>
            </footer>
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
