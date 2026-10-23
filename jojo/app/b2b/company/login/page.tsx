'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconUser, IconLock, IconEyeOff, IconEye } from '@tabler/icons-react';
import styles from './login.module.css';

function formatPhone(val: string): string {
    const digits = val.replace(/[^0-9]/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function CompanyLoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // 이미 본사 로그인 세션이 유효하다면 대시보드로 이동
        const token = localStorage.getItem('b2b_token');
        const userStr = localStorage.getItem('b2b_user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.company_id) {
                    router.push('/b2b/company/dashboard');
                }
            } catch {
                localStorage.removeItem('b2b_token');
                localStorage.removeItem('b2b_user');
            }
        }
    }, [router]);

    const handleLogin = async () => {
        if (!phone || !password) {
            setError('휴대폰 번호와 비밀번호를 입력해 주세요.');
            return;
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
            setError('올바른 휴대폰 번호 형식이 아닙니다.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/b2b/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone, password }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // ⚠️ 핵심: 상조회사 소속 계정(company_id 보유)인지 최종 검증
                if (!data.user?.company_id) {
                    setError('상조회사 본사용 권한 계정이 아닙니다. 일반 파트너 앱을 이용해 주세요.');
                    setLoading(false);
                    return;
                }

                localStorage.setItem('b2b_token', data.token);
                localStorage.setItem('b2b_user', JSON.stringify(data.user));
                router.push('/b2b/company/dashboard');
            } else {
                setError(data.error || '로그인에 실패했습니다. 번호나 비밀번호를 확인하세요.');
            }
        } catch {
            setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
        setLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <div className={styles.page}>
            <div className={styles.loginCard}>
                <div className={styles.logoSection}>
                    <h1 className={styles.brandTitle}>부고온 B2B</h1>
                    <span className={styles.brandSubtitle}>상조회사 본사 정산 파트너 어드민</span>
                </div>

                {error && (
                    <div className={styles.errorBox}>
                        <span>{error}</span>
                    </div>
                )}

                <div className={styles.form}>
                    <div className={styles.inputWrapper}>
                        <IconUser className={styles.inputIcon} size={20} stroke={1.5} />
                        <input
                            type="tel"
                            className={styles.input}
                            placeholder="휴대폰 번호 입력"
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className={styles.inputWrapper}>
                        <IconLock className={styles.inputIcon} size={20} stroke={1.5} />
                        <input
                            type={showPw ? 'text' : 'password'}
                            className={styles.input}
                            placeholder="비밀번호 입력"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            type="button"
                            className={styles.pwToggle}
                            onClick={() => setShowPw(!showPw)}
                        >
                            {showPw ? <IconEyeOff size={20} stroke={1.5} /> : <IconEye size={20} stroke={1.5} />}
                        </button>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className={styles.loginBtn}
                    >
                        {loading ? '로그인 처리 중...' : '본사 어드민 로그인'}
                    </button>
                </div>

                <div className={styles.footerSection}>
                    <span>본 로그인 화면은 상조회사 본사 관리자 전용입니다.</span>
                </div>
            </div>
        </div>
    );
}
