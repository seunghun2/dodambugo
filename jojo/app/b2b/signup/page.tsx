'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import commonStyles from '@/components/b2b/common.module.css';
import styles from './signup.module.css';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
    phone: string;
    phoneVerified: boolean;
    password: string;
    passwordConfirm: string;
    companyName: string;
    ownerName: string;
    bankName: string;
    accountNo: string;
    accountHolder: string;
    accountVerified: boolean;
    referralCode: string;
    referralInfo: { company_name: string; owner_name: string } | null;
}

const BANKS = [
    { code: '004', name: '국민은행' },
    { code: '088', name: '신한은행' },
    { code: '020', name: '우리은행' },
    { code: '081', name: '하나은행' },
    { code: '011', name: 'NH농협은행' },
    { code: '003', name: 'IBK기업은행' },
    { code: '023', name: 'SC제일은행' },
    { code: '027', name: '씨티은행' },
    { code: '039', name: '경남은행' },
    { code: '034', name: '광주은행' },
    { code: '031', name: '대구은행' },
    { code: '032', name: '부산은행' },
    { code: '037', name: '전북은행' },
    { code: '035', name: '제주은행' },
    { code: '090', name: '카카오뱅크' },
    { code: '092', name: '토스뱅크' },
    { code: '089', name: '케이뱅크' },
];

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [timer, setTimer] = useState(0);

    const [form, setForm] = useState<FormData>({
        phone: '',
        phoneVerified: false,
        password: '',
        passwordConfirm: '',
        companyName: '',
        ownerName: '',
        bankName: '',
        accountNo: '',
        accountHolder: '',
        accountVerified: false,
        referralCode: '',
        referralInfo: null,
    });

    // 타이머
    const startTimer = () => {
        setTimer(180);
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTimer = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Step 1: SMS 인증번호 발송
    const sendVerification = async () => {
        const cleanPhone = form.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length !== 11) {
            setError('올바른 휴대폰 번호를 입력해 주세요.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            // 중복 체크
            const checkRes = await fetch('/api/b2b/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone, checkOnly: true }),
            });

            // 인증번호 발송
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
            setError('인증번호 발송 중 오류가 발생했습니다.');
        }
        setLoading(false);
    };

    // Step 1: 인증번호 확인
    const confirmVerification = async () => {
        const cleanPhone = form.phone.replace(/[^0-9]/g, '');
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
                setForm({ ...form, phoneVerified: true });
            } else {
                setError(data.error || '인증에 실패했습니다.');
            }
        } catch {
            setError('인증 확인 중 오류가 발생했습니다.');
        }
        setLoading(false);
    };

    // Step 4: 계좌 실명확인
    const verifyAccount = async () => {
        setError('');
        setLoading(true);

        try {
            const bank = BANKS.find((b) => b.name === form.bankName);
            const res = await fetch('/api/verify-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bankCd: bank?.code,
                    accountNo: form.accountNo,
                    holderName: form.accountHolder,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setForm({ ...form, accountVerified: true });
            } else {
                setError(data.message || '계좌 확인에 실패했습니다.');
            }
        } catch {
            setError('계좌 확인 중 오류가 발생했습니다.');
        }
        setLoading(false);
    };

    // Step 5: 추천 코드 확인
    const checkReferral = async (code: string) => {
        if (!code.trim()) {
            setForm({ ...form, referralCode: code, referralInfo: null });
            return;
        }

        try {
            const res = await fetch(`/api/b2b/check-referral?code=${code.trim()}`);
            const data = await res.json();

            if (data.valid) {
                setForm({ ...form, referralCode: code, referralInfo: data.recommender });
                setError('');
            } else {
                setForm({ ...form, referralCode: code, referralInfo: null });
                setError('존재하지 않는 추천 코드입니다.');
            }
        } catch {
            setForm({ ...form, referralCode: code, referralInfo: null });
        }
    };

    // 최종 회원가입 제출
    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/b2b/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: form.phone.replace(/[^0-9]/g, ''),
                    password: form.password,
                    company_name: form.companyName,
                    owner_name: form.ownerName,
                    bank_name: form.bankName || null,
                    account_no: form.accountNo || null,
                    account_holder: form.accountHolder || null,
                    referral_code: form.referralCode || null,
                }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // JWT 토큰 저장
                localStorage.setItem('b2b_token', data.token);
                localStorage.setItem('b2b_user', JSON.stringify(data.user));
                // 가입 완료 페이지로
                router.push(`/b2b/signup/complete?code=${data.user.my_referral_code}`);
            } else {
                setError(data.error || '회원가입에 실패했습니다.');
            }
        } catch {
            setError('회원가입 중 오류가 발생했습니다.');
        }
        setLoading(false);
    };

    // 다음 단계로
    const nextStep = () => {
        setError('');
        setStep((prev) => (prev + 1) as Step);
    };

    // 이전 단계로
    const prevStep = () => {
        setError('');
        if (step === 1) {
            router.push('/b2b/login');
        } else {
            setStep((prev) => (prev - 1) as Step);
        }
    };

    return (
        <div className={`${commonStyles.b2bLayout} ${styles.container}`}>
            {/* 헤더 */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={prevStep}>
                    ←
                </button>
                <span className={styles.headerTitle}>회원가입</span>
                <span className={styles.headerRight}></span>
            </div>

            {/* 프로그레스 바 */}
            <div className={styles.progress}>
                <div className={styles.progressBar} style={{ width: `${(step / 5) * 100}%` }} />
            </div>
            <p className={styles.stepLabel}>{step} / 5</p>

            {/* 에러 메시지 */}
            {error && <div className={styles.error}>{error}</div>}

            {/* Step 1: 휴대폰 인증 */}
            {step === 1 && (
                <div className={styles.stepContent}>
                    <h2 className={styles.stepTitle}>휴대폰 번호 인증</h2>
                    <p className={styles.stepDesc}>로그인에 사용할 번호를 입력해 주세요</p>

                    <input
                        type="tel"
                        className={styles.input}
                        placeholder="010-0000-0000"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value, phoneVerified: false })}
                        disabled={form.phoneVerified}
                    />

                    {!codeSent && !form.phoneVerified && (
                        <button className={styles.subBtn} onClick={sendVerification} disabled={loading}>
                            {loading ? '발송 중...' : '인증번호 받기'}
                        </button>
                    )}

                    {codeSent && !form.phoneVerified && (
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
                            <button className={styles.subBtn} onClick={confirmVerification} disabled={loading}>
                                {loading ? '확인 중...' : '인증 확인'}
                            </button>
                        </>
                    )}

                    {form.phoneVerified && (
                        <div className={styles.verified}>인증이 완료되었습니다</div>
                    )}

                    <button
                        className={styles.nextBtn}
                        onClick={nextStep}
                        disabled={!form.phoneVerified}
                    >
                        다음
                    </button>
                </div>
            )}

            {/* Step 2: 비밀번호 설정 */}
            {step === 2 && (
                <div className={styles.stepContent}>
                    <h2 className={styles.stepTitle}>비밀번호 설정</h2>
                    <p className={styles.stepDesc}>로그인에 사용할 비밀번호를 설정해 주세요</p>

                    <input
                        type="password"
                        className={styles.input}
                        placeholder="비밀번호 (6자리 이상)"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <input
                        type="password"
                        className={styles.input}
                        placeholder="비밀번호 확인"
                        value={form.passwordConfirm}
                        onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                    />

                    <div className={styles.checkList}>
                        <span className={form.password.length >= 6 ? styles.checkOk : styles.checkNo}>
                            {form.password.length >= 6 ? '✓' : '○'} 6자리 이상
                        </span>
                        <span
                            className={
                                form.password && form.password === form.passwordConfirm
                                    ? styles.checkOk
                                    : styles.checkNo
                            }
                        >
                            {form.password && form.password === form.passwordConfirm ? '✓' : '○'} 비밀번호 일치
                        </span>
                    </div>

                    <button
                        className={styles.nextBtn}
                        onClick={nextStep}
                        disabled={form.password.length < 6 || form.password !== form.passwordConfirm}
                    >
                        다음
                    </button>
                </div>
            )}

            {/* Step 3: 사업자 정보 */}
            {step === 3 && (
                <div className={styles.stepContent}>
                    <h2 className={styles.stepTitle}>사업자 정보</h2>
                    <p className={styles.stepDesc}>정산 및 파트너 관리에 필요한 정보입니다</p>

                    <input
                        type="text"
                        className={styles.input}
                        placeholder="상호명 (회사명)"
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    />
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="대표자명"
                        value={form.ownerName}
                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    />

                    <button
                        className={styles.nextBtn}
                        onClick={nextStep}
                        disabled={!form.companyName.trim() || !form.ownerName.trim()}
                    >
                        다음
                    </button>
                </div>
            )}

            {/* Step 4: 정산 계좌 */}
            {step === 4 && (
                <div className={styles.stepContent}>
                    <h2 className={styles.stepTitle}>정산 계좌 등록</h2>
                    <p className={styles.stepDesc}>화환 판매 수익이 입금될 계좌입니다</p>

                    <select
                        className={styles.input}
                        value={form.bankName}
                        onChange={(e) =>
                            setForm({ ...form, bankName: e.target.value, accountVerified: false })
                        }
                    >
                        <option value="">은행 선택</option>
                        {BANKS.map((b) => (
                            <option key={b.code} value={b.name}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="계좌번호 (숫자만)"
                        value={form.accountNo}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                accountNo: e.target.value.replace(/[^0-9]/g, ''),
                                accountVerified: false,
                            })
                        }
                    />
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="예금주"
                        value={form.accountHolder}
                        onChange={(e) =>
                            setForm({ ...form, accountHolder: e.target.value, accountVerified: false })
                        }
                    />

                    {!form.accountVerified && (
                        <button
                            className={styles.subBtn}
                            onClick={verifyAccount}
                            disabled={loading || !form.bankName || !form.accountNo || !form.accountHolder}
                        >
                            {loading ? '확인 중...' : '계좌 확인'}
                        </button>
                    )}

                    {form.accountVerified && (
                        <div className={styles.verified}>계좌 확인 완료 (예금주: {form.accountHolder})</div>
                    )}

                    <button
                        className={styles.nextBtn}
                        onClick={nextStep}
                        disabled={!form.accountVerified}
                    >
                        다음
                    </button>

                    <button className={styles.skipBtn} onClick={nextStep}>
                        건너뛰기
                    </button>
                </div>
            )}

            {/* Step 5: 추천인 코드 */}
            {step === 5 && (
                <div className={styles.stepContent}>
                    <h2 className={styles.stepTitle}>추천인 코드</h2>
                    <p className={styles.stepDesc}>추천인 코드가 있으시면 입력해 주세요</p>

                    <input
                        type="text"
                        className={styles.input}
                        placeholder="추천인 코드 (선택)"
                        value={form.referralCode}
                        onChange={(e) => {
                            const code = e.target.value.toUpperCase();
                            setForm({ ...form, referralCode: code });
                            if (code.length >= 8) {
                                checkReferral(code);
                            } else {
                                setForm((prev) => ({ ...prev, referralCode: code, referralInfo: null }));
                                setError('');
                            }
                        }}
                        maxLength={8}
                    />

                    {form.referralInfo && (
                        <div className={styles.verified}>
                            추천인 확인: {form.referralInfo.company_name} ({form.referralInfo.owner_name})
                        </div>
                    )}

                    <p className={styles.skipText}>추천인 코드가 없으시면 비워두셔도 됩니다</p>

                    <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                        {loading ? '가입 중...' : '가입하기'}
                    </button>
                </div>
            )}
        </div>
    );
}
