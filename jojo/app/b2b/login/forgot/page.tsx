'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';
import styles from './forgot.module.css';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [phone, setPhone] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [verified, setVerified] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [timer, setTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const startTimer = () => {
        setTimer(180);
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTimer = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // 비밀번호 유효성
    const pwValid = newPassword.length >= 8
        && /[a-zA-Z]/.test(newPassword)
        && /[0-9]/.test(newPassword)
        && /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/.test(newPassword);
    const pwMatch = newPassword === confirmPassword && confirmPassword.length > 0;

    // Step 1: 인증번호 발송
    const sendCode = async () => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length !== 11) {
            setError('올바른 휴대폰 번호를 입력해 주세요.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/phone-verify/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone }),
            });
            const data = await res.json();
            if (res.ok) {
                setCodeSent(true);
                startTimer();
            } else {
                setError(data.error || '인증번호 발송에 실패했습니다.');
            }
        } catch {
            setError('서버 연결에 실패했습니다.');
        }
        setLoading(false);
    };

    // Step 1: 인증 확인
    const confirmCode = async () => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/phone-verify/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone, code: verifyCode }),
            });
            const data = await res.json();
            if (res.ok) {
                setVerified(true);
                setStep(2);
            } else {
                setError(data.error || '인증에 실패했습니다.');
            }
        } catch {
            setError('인증 확인 중 오류가 발생했습니다.');
        }
        setLoading(false);
    };

    // Step 2: 비밀번호 재설정
    const resetPassword = async () => {
        if (!pwValid) {
            setError('비밀번호 조건을 확인해 주세요.');
            return;
        }
        if (!pwMatch) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/b2b/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phone.replace(/[^0-9]/g, ''),
                    newPassword,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStep(3);
                setSuccess(true);
            } else {
                setError(data.error || '비밀번호 변경에 실패했습니다.');
            }
        } catch {
            setError('서버 연결에 실패했습니다.');
        }
        setLoading(false);
    };

    return (
        <div className={styles.page}>
            {/* 헤더 */}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.push('/b2b/login')}>
                    <IconArrowLeft size={20} stroke={1.5} />
                </button>
                <span className={styles.headerTitle}>비밀번호 찾기</span>
                <span className={styles.headerRight} />
            </header>

            <div className={styles.inner}>
                {error && <p className={styles.error}>{error}</p>}

                {/* Step 1: 본인 인증 */}
                {step === 1 && (
                    <>
                        <h2 className={styles.title}>
                            가입한 휴대폰 번호<span className={styles.titleSub}>로 인증해 주세요</span>
                        </h2>
                        <p className={styles.desc}>가입 시 등록한 번호를 입력하시면 인증번호를 보내드립니다.</p>

                        <div className={styles.inputGroup}>
                            <input
                                type="tel"
                                className={styles.input}
                                placeholder="010-0000-0000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={verified}
                            />
                        </div>

                        {!codeSent && (
                            <button className={styles.subBtn} onClick={sendCode} disabled={loading}>
                                {loading ? '발송 중...' : '인증번호 받기'}
                            </button>
                        )}

                        {codeSent && !verified && (
                            <>
                                <div className={styles.verifyRow}>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="인증번호 6자리"
                                        value={verifyCode}
                                        onChange={(e) => setVerifyCode(e.target.value)}
                                        maxLength={6}
                                    />
                                    {timer > 0 && <span className={styles.timer}>{formatTimer(timer)}</span>}
                                </div>
                                <button className={styles.subBtn} onClick={confirmCode} disabled={loading}>
                                    {loading ? '확인 중...' : '인증 확인'}
                                </button>
                            </>
                        )}
                    </>
                )}

                {/* Step 2: 새 비밀번호 */}
                {step === 2 && (
                    <>
                        <h2 className={styles.title}>
                            새 비밀번호<span className={styles.titleSub}>를 설정해 주세요</span>
                        </h2>
                        <p className={styles.desc}>영문, 숫자, 특수문자를 조합하여 8자리 이상 입력해 주세요.</p>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>새 비밀번호</label>
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="새 비밀번호 입력"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            {newPassword && (
                                <p className={pwValid ? styles.hintOk : styles.hintErr}>
                                    {pwValid ? '사용 가능한 비밀번호입니다.' : '영문, 숫자, 특수문자 포함 8자 이상'}
                                </p>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>비밀번호 확인</label>
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="비밀번호 재입력"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {confirmPassword && (
                                <p className={pwMatch ? styles.hintOk : styles.hintErr}>
                                    {pwMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                                </p>
                            )}
                        </div>

                        <button
                            className={styles.primaryBtn}
                            onClick={resetPassword}
                            disabled={loading || !pwValid || !pwMatch}
                        >
                            {loading ? '변경 중...' : '비밀번호 변경'}
                        </button>
                    </>
                )}

                {/* Step 3: 완료 */}
                {step === 3 && success && (
                    <div className={styles.complete}>
                        <div className={styles.completeIcon}>
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="24" fill="#F0FDF4"/>
                                <path d="M15 24L21 30L33 18" stroke="#3A8F47" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h2 className={styles.completeTitle}>비밀번호가 변경되었습니다</h2>
                        <p className={styles.completeDesc}>새 비밀번호로 로그인해 주세요.</p>
                        <button
                            className={styles.primaryBtn}
                            onClick={() => router.push('/b2b/login')}
                        >
                            로그인하기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
