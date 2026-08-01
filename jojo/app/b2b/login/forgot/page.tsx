'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';
import styles from './forgot.module.css';

// 휴대폰 번호 포맷
function formatPhone(val: string): string {
    const digits = val.replace(/[^0-9]/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [name, setName] = useState('');
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

    // Step 1: 이름 + 휴대폰 번호 매칭 검증 및 인증번호 발송
    const sendCode = async () => {
        if (!name.trim()) {
            setError('이름(본인명)을 입력해 주세요.');
            return;
        }
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length !== 11) {
            setError('올바른 휴대폰 번호를 입력해 주세요.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            // 1. 이름 & 휴대폰 번호 동시 일치 검증
            const verifyRes = await fetch('/api/b2b/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', phone: cleanPhone, name: name.trim() }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
                setError(verifyData.error || '입력하신 이름과 휴대폰 번호 정보가 일치하지 않습니다.');
                setLoading(false);
                return;
            }

            // 2. 인증번호 SMS 발송
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
    const confirmCode = async (code: string) => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/phone-verify/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone, code }),
            });
            const data = await res.json();
            if (res.ok) {
                setVerified(true);
                setStep(2);
            } else {
                setError(data.error || '인증번호가 일치하지 않습니다.');
                setVerifyCode('');
            }
        } catch {
            setError('인증 확인 중 오류가 발생했습니다.');
            setVerifyCode('');
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
                            이름과 휴대폰 번호<span className={styles.titleSub}>로 인증해 주세요</span>
                        </h2>
                        <p className={styles.desc}>가입 시 등록한 성명과 휴대폰 번호를 입력해 주세요.</p>

                        <div className={styles.inputGroup} style={{ marginBottom: '12px' }}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="이름 (본인명)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={verified}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <input
                                type="tel"
                                inputMode="numeric"
                                className={styles.input}
                                placeholder="가입한 휴대폰 번호 (010-0000-0000)"
                                value={formatPhone(phone)}
                                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                                disabled={verified}
                            />
                        </div>

                        {!codeSent && (
                            <button 
                                className={styles.subBtn} 
                                onClick={sendCode} 
                                disabled={loading || !name.trim() || phone.replace(/[^0-9]/g, '').length !== 11}
                            >
                                {loading ? '인증 확인 중...' : '인증번호 받기'}
                            </button>
                        )}

                        {codeSent && !verified && (
                            <>
                                <div className={styles.verifyRow}>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        className={styles.input}
                                        placeholder="인증번호 6자리"
                                        value={verifyCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                                            setVerifyCode(val);
                                            if (val.length === 6) confirmCode(val);
                                        }}
                                        maxLength={6}
                                        disabled={loading}
                                    />
                                    {timer > 0 && <span className={styles.timer}>{formatTimer(timer)}</span>}
                                </div>
                                {loading && <p className={styles.hint}>인증 확인 중...</p>}
                                <button
                                    className={styles.subBtn}
                                    style={{ marginTop: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                                    onClick={sendCode}
                                    disabled={loading}
                                >
                                    {loading ? '발송 중...' : '인증번호 재전송'}
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
