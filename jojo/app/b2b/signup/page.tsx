'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconEye, IconEyeOff, IconCheck } from '@tabler/icons-react';
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
    { code: '004', name: '국민은행', prefix: ['9'], fmt: [6, 2, 6] },
    { code: '088', name: '신한은행', prefix: ['110', '140'], fmt: [3, 3, 6] },
    { code: '020', name: '우리은행', prefix: ['1002', '1005'], fmt: [4, 3, 6] },
    { code: '081', name: '하나은행', prefix: ['910'], fmt: [3, 6, 5] },
    { code: '011', name: 'NH농협은행', prefix: ['351', '302'], fmt: [3, 4, 4, 2] },
    { code: '003', name: 'IBK기업은행', prefix: ['01', '02'], fmt: [3, 6, 2, 3] },
    { code: '023', name: 'SC제일은행', prefix: [], fmt: [3, 2, 6] },
    { code: '027', name: '씨티은행', prefix: [], fmt: [3, 6, 3] },
    { code: '039', name: '경남은행', prefix: [], fmt: [3, 2, 6] },
    { code: '034', name: '광주은행', prefix: [], fmt: [3, 3, 6] },
    { code: '031', name: '대구은행', prefix: [], fmt: [3, 2, 6, 1] },
    { code: '032', name: '부산은행', prefix: [], fmt: [3, 4, 4, 2] },
    { code: '037', name: '전북은행', prefix: [], fmt: [3, 2, 6] },
    { code: '035', name: '제주은행', prefix: [], fmt: [2, 2, 6] },
    { code: '090', name: '카카오뱅크', prefix: ['3333'], fmt: [4, 2, 7] },
    { code: '092', name: '토스뱅크', prefix: ['1000'], fmt: [4, 4, 4] },
    { code: '089', name: '케이뱅크', prefix: ['100'], fmt: [3, 3, 6] },
];

// 계좌번호 포맷팅 (은행별 하이픈)
function formatAccountNo(raw: string, bankName: string): string {
    const bank = BANKS.find((b) => b.name === bankName);
    if (!bank || !raw) return raw;
    const digits = raw.replace(/[^0-9]/g, '');
    const parts: string[] = [];
    let idx = 0;
    for (const len of bank.fmt) {
        if (idx >= digits.length) break;
        parts.push(digits.slice(idx, idx + len));
        idx += len;
    }
    if (idx < digits.length) parts.push(digits.slice(idx));
    return parts.join('-');
}

// placeholder 생성 (은행 포맷에 맞는 0 패턴)
function getPlaceholder(bankName: string): string {
    const bank = BANKS.find((b) => b.name === bankName);
    if (!bank) return '계좌번호 입력';
    return bank.fmt.map((n) => '0'.repeat(n)).join('-');
}

// 휴대폰 번호 포맷 (010-0000-0000)
function formatPhone(val: string): string {
    const digits = val.replace(/[^0-9]/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// 비밀번호 규칙
const PW_RULES = [
    { key: 'length', label: '8자리 이상', test: (pw: string) => pw.length >= 8 },
    { key: 'upper', label: '영문 대소문자', test: (pw: string) => /[a-zA-Z]/.test(pw) },
    { key: 'number', label: '숫자 포함', test: (pw: string) => /[0-9]/.test(pw) },
    { key: 'special', label: '특수문자 포함', test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/.test(pw) },
];

function SignupInner() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [timer, setTimer] = useState(0);
    const [showPw, setShowPw] = useState(false);
    const [showPwConfirm, setShowPwConfirm] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [showModal, setShowModal] = useState<'terms' | 'privacy' | null>(null);

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

    // 비밀번호 유효성
    const pwAllValid = PW_RULES.every((r) => r.test(form.password));
    const pwMatch = form.password === form.passwordConfirm && form.passwordConfirm.length > 0;

    const handleAllAgree = () => {
        const nextState = !(agreeTerms && agreePrivacy);
        setAgreeTerms(nextState);
        setAgreePrivacy(nextState);
    };

    // 계좌번호로 은행 추천
    const suggestedBanks = form.accountNo.length >= 3
        ? BANKS.filter((b) => b.prefix.some((p) => form.accountNo.startsWith(p)))
        : [];

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
            const checkRes = await fetch('/api/b2b/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone, checkOnly: true }),
            });
            const checkData = await checkRes.json();
            if (!checkRes.ok) {
                setError(checkData.error || '이미 가입된 휴대폰 번호입니다.');
                setLoading(false);
                return;
            }

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

    // Step 1: 인증번호 확인 (6자리 입력 시 자동 호출)
    const confirmVerification = async (code: string) => {
        const cleanPhone = form.phone.replace(/[^0-9]/g, '');
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
                setForm((prev) => ({ ...prev, phoneVerified: true }));
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

    const searchParams = useSearchParams();
    useEffect(() => {
        const urlRef = searchParams.get('ref') || searchParams.get('code');
        if (urlRef && urlRef.trim().length >= 4) {
            checkReferral(urlRef.trim());
        }
    }, [searchParams]);

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
                localStorage.setItem('b2b_token', data.token);
                localStorage.setItem('b2b_user', JSON.stringify(data.user));
                router.push(`/b2b/signup/complete?code=${data.user.my_referral_code}`);
            } else {
                setError(data.error || '회원가입에 실패했습니다.');
            }
        } catch {
            setError('회원가입 중 오류가 발생했습니다.');
        }
        setLoading(false);
    };

    const nextStep = () => {
        setError('');
        setStep((prev) => (prev + 1) as Step);
    };

    const prevStep = () => {
        setError('');
        if (step === 1) {
            router.push('/b2b/login');
        } else {
            setStep((prev) => (prev - 1) as Step);
        }
    };

    return (
        <div className={`b2bLayout ${styles.container}`}>
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
                    <h2 className={styles.stepTitle}>
                        휴대폰 번호<span className={styles.stepTitleSub}>를 인증해 주세요</span>
                    </h2>
                    <p className={styles.stepDesc}>로그인에 사용할 번호를 입력해 주세요.</p>

                    <div className={styles.inputGroup}>
                        <input
                            type="tel"
                            inputMode="numeric"
                            className={styles.input}
                            placeholder="010-0000-0000"
                            value={formatPhone(form.phone)}
                            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 11), phoneVerified: false })}
                            disabled={form.phoneVerified}
                        />
                    </div>

                    {/* 약관 동의 영역 */}
                    <div className={styles.termsArea}>
                        {/* 개별 약관 1 */}
                        <div className={styles.termItem} onClick={() => setAgreeTerms(!agreeTerms)}>
                            <div className={styles.termLeft}>
                                <div className={`${styles.checkbox} ${agreeTerms ? styles.checkboxChecked : ''}`}>
                                    {agreeTerms && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                                <span>
                                    <span className={styles.termRequired}>[필수]</span> B2B 파트너 이용약관 동의
                                </span>
                            </div>
                            <button 
                                className={styles.arrowBtn} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowModal('terms');
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </div>

                        {/* 개별 약관 2 */}
                        <div className={styles.termItem} onClick={() => setAgreePrivacy(!agreePrivacy)}>
                            <div className={styles.termLeft}>
                                <div className={`${styles.checkbox} ${agreePrivacy ? styles.checkboxChecked : ''}`}>
                                    {agreePrivacy && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                                <span>
                                    <span className={styles.termRequired}>[필수]</span> B2B 파트너 개인정보처리방침 동의
                                </span>
                            </div>
                            <button 
                                className={styles.arrowBtn} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowModal('privacy');
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </div>

                        {/* 전체 동의 */}
                        <div
                            className={`${styles.allAgreeBox} ${agreeTerms && agreePrivacy ? styles.allAgreeBoxActive : ''}`}
                            onClick={handleAllAgree}
                        >
                            <div className={`${styles.checkbox} ${agreeTerms && agreePrivacy ? styles.checkboxChecked : ''}`}>
                                {agreeTerms && agreePrivacy && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                            <span className={styles.allAgreeText}>전체 동의하기</span>
                        </div>
                    </div>

                    {!codeSent && !form.phoneVerified && (
                        <button 
                            className={styles.subBtn} 
                            onClick={sendVerification} 
                            disabled={loading || form.phone.replace(/[^0-9]/g, '').length !== 11 || !agreeTerms || !agreePrivacy}
                        >
                            {loading ? '발송 중...' : '인증번호 받기'}
                        </button>
                    )}

                    {codeSent && !form.phoneVerified && (
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
                                        if (val.length === 6) confirmVerification(val);
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
                                onClick={sendVerification}
                                disabled={loading}
                            >
                                {loading ? '발송 중...' : '인증번호 재전송'}
                            </button>
                        </>
                    )}

                    {form.phoneVerified && (
                        <p className={styles.hintOk}>인증이 완료되었습니다.</p>
                    )}

                    <div className={styles.btnRow}>
                        <button className={styles.prevBtn} onClick={prevStep}>뒤로가기</button>
                        <button className={styles.nextBtn} onClick={nextStep} disabled={!form.phoneVerified || !agreeTerms || !agreePrivacy}>
                            다음단계
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: 비밀번호 설정 */}
            {step === 2 && (
                <div className={styles.stepContent}>
                    <h2 className={styles.stepTitle}>
                        비밀번호<span className={styles.stepTitleSub}>를 설정해 주세요</span>
                    </h2>
                    <p className={styles.stepDesc}>영문, 숫자, 특수문자를 조합하여 8자리 이상 입력해 주세요.</p>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>비밀번호</label>
                        <div className={styles.pwWrap}>
                            <input
                                type={showPw ? 'text' : 'password'}
                                className={styles.input}
                                placeholder="비밀번호 입력"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                            <button
                                type="button"
                                className={styles.pwEye}
                                onClick={() => setShowPw(!showPw)}
                            >
                                {showPw ? <IconEye size={18} stroke={1.5} /> : <IconEyeOff size={18} stroke={1.5} />}
                            </button>
                        </div>
                        {form.password && (() => {
                            const passCount = PW_RULES.filter(r => r.test(form.password)).length;
                            const level = passCount <= 1 ? 'weak' : passCount <= 2 ? 'fair' : passCount <= 3 ? 'good' : 'strong';
                            const labelMap = { weak: '위험', fair: '보통', good: '안전', strong: '매우 안전' };
                            return (
                                <>
                                    <div className={styles.strengthBar}>
                                        <div className={`${styles.strengthFill} ${styles[`strength_${level}`]}`} />
                                    </div>
                                    <p className={`${styles.strengthText} ${styles[`strengthText_${level}`]}`}>
                                        {labelMap[level]}
                                    </p>
                                </>
                            );
                        })()}
                        <p className={styles.hint}>영문, 숫자, 특수문자 포함 8자 이상</p>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>비밀번호 확인</label>
                        <div className={styles.pwWrap}>
                            <input
                                type={showPwConfirm ? 'text' : 'password'}
                                className={styles.input}
                                placeholder="비밀번호 재입력"
                                value={form.passwordConfirm}
                                onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                            />
                            <button
                                type="button"
                                className={styles.pwEye}
                                onClick={() => setShowPwConfirm(!showPwConfirm)}
                            >
                                {showPwConfirm ? <IconEye size={18} stroke={1.5} /> : <IconEyeOff size={18} stroke={1.5} />}
                            </button>
                        </div>
                        {form.passwordConfirm && (
                            pwMatch
                                ? <p className={styles.hintOk}>비밀번호가 일치합니다.</p>
                                : <p className={styles.hintErr}>비밀번호가 일치하지 않습니다.</p>
                        )}
                    </div>

                    <div className={styles.btnRow}>
                        <button className={styles.prevBtn} onClick={prevStep}>뒤로가기</button>
                        <button
                            className={styles.nextBtn}
                            onClick={nextStep}
                            disabled={!pwAllValid || !pwMatch}
                        >
                            다음단계
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: 파트너 정보 */}
            {step === 3 && (
                <div className={styles.stepContent}>
                    <h2 className={styles.stepTitle}>
                        파트너 정보<span className={styles.stepTitleSub}>를 입력해 주세요</span>
                    </h2>
                    <p className={styles.stepDesc}>정산 및 파트너 관리에 필요한 정보입니다.</p>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>상호명 (소속 또는 회사명)</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="회사명, 장례식장명, 또는 '개인' 입력"
                            value={form.companyName}
                            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        />
                        <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: '1.4' }}>
                            ※ 프리랜서/개인 지도사님은 '개인' 또는 성함을 입력해 주세요.
                        </p>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>이름 (본인명)</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="본인 성함"
                            value={form.ownerName}
                            onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                        />
                    </div>

                    <div className={styles.btnRow}>
                        <button className={styles.prevBtn} onClick={prevStep}>뒤로가기</button>
                        <button
                            className={styles.nextBtn}
                            onClick={nextStep}
                            disabled={!form.companyName.trim() || !form.ownerName.trim()}
                        >
                            다음단계
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: 정산 계좌 */}
            {step === 4 && (
                <div className={styles.stepContent}>
                    <h2 className={styles.stepTitle}>
                        정산 계좌<span className={styles.stepTitleSub}>를 등록해 주세요</span>
                    </h2>
                    <p className={styles.stepDesc}>화환 판매 수익이 입금될 계좌입니다.</p>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>은행</label>
                        <select
                            className={styles.input}
                            value={form.bankName}
                            onChange={(e) =>
                                setForm({ ...form, bankName: e.target.value, accountVerified: false })
                            }
                        >
                            <option value="">은행을 선택해 주세요</option>
                            {BANKS.map((b) => (
                                <option key={b.code} value={b.name}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>계좌번호</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder={form.bankName ? getPlaceholder(form.bankName) : '계좌번호 입력'}
                            value={form.bankName ? formatAccountNo(form.accountNo, form.bankName) : form.accountNo}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    accountNo: e.target.value.replace(/[^0-9]/g, ''),
                                    accountVerified: false,
                                })
                            }
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>예금주</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="예금주 성함"
                            value={form.accountHolder}
                            onChange={(e) =>
                                setForm({ ...form, accountHolder: e.target.value, accountVerified: false })
                            }
                        />
                    </div>

                    {!form.accountVerified && (
                        <button
                            className={styles.subBtn}
                            onClick={verifyAccount}
                            disabled={loading || !form.bankName || !form.accountNo || !form.accountHolder}
                        >
                            {loading ? '확인 중...' : '계좌 실명 확인'}
                        </button>
                    )}

                    {form.accountVerified && (
                        <div className={styles.verified}>계좌 확인 완료 (예금주: {form.accountHolder})</div>
                    )}

                    <div className={styles.btnRow}>
                        <button className={styles.prevBtn} onClick={prevStep}>뒤로가기</button>
                        <button className={styles.nextBtn} onClick={nextStep} disabled={!form.accountVerified}>다음</button>
                    </div>
                    <p className={styles.skipLink} onClick={nextStep}>나중에 등록할게요</p>
                </div>
            )}

            {/* Step 5: 추천인 코드 */}
            {step === 5 && (
                <div className={styles.stepContent}>
                    <h2 className={styles.stepTitle}>
                        추천인 코드<span className={styles.stepTitleSub}>(선택)</span>
                    </h2>
                    <p className={styles.stepDesc}>추천인 코드가 있으시면 입력해 주세요.</p>

                    <div className={styles.inputGroup}>
                        <input
                            type="tel"
                            inputMode="numeric"
                            className={styles.input}
                            placeholder="추천인 숫자 4자리 입력"
                            value={form.referralCode}
                            onChange={(e) => {
                                const code = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                setForm((prev) => ({ ...prev, referralCode: code, referralInfo: null }));
                                if (code.length === 4) {
                                    checkReferral(code);
                                } else {
                                    setError('');
                                }
                            }}
                            maxLength={4}
                        />
                    </div>

                    {form.referralInfo && (
                        <p className={styles.hintOk}>
                            추천인 확인: {form.referralInfo.company_name} ({form.referralInfo.owner_name})
                        </p>
                    )}

                    <p className={styles.skipText}>추천인 코드가 없으시면 비워두셔도 됩니다.</p>

                    <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                        {loading ? '가입 중...' : '가입하기'}
                    </button>
                </div>
            )}
            {/* 약관 상세 모달 */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(null)}>
                    <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>
                                {showModal === 'terms' ? 'B2B 파트너 이용약관' : 'B2B 파트너 개인정보처리방침'}
                            </h3>
                            <button className={styles.modalCloseBtn} onClick={() => setShowModal(null)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            {showModal === 'terms' ? (
                                `[마음부고 B2B 파트너(부고온) 서비스 이용약관]

제 1 조 (목적)
본 약관은 마음부고(이하 "회사")가 제공하는 부고온 B2B 파트너 서비스(이하 "서비스")의 이용과 관련하여 회사와 파트너 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제 2 조 (정의)
1. "서비스"라 함은 회사가 제공하는 B2B 파트너용 모바일 부고장 작성, 공유, 관리, 화환 주문 유치 및 수당(정산금) 지급 대시보드 등의 서비스를 말합니다.
2. "파트너"라 함은 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 파트너 서비스를 이용하는 자(장례지도사, 상조회사 임직원, 법인/개인사업자, 프리랜서 등)를 말합니다.
3. "부고장"이라 함은 파트너가 서비스를 통해 작성한 모바일 장례 안내 정보를 말합니다.
4. "수당(정산금)"이라 함은 파트너가 생성한 부고장을 통해 화환 주문 등 유료 서비스 매출이 발생하였을 때, 회사가 사전에 고지한 기준에 따라 파트너에게 지급하는 금액을 말합니다.
5. "추천인 보너스"라 함은 추천한 신규 파트너 가입 유치에 따라 추가 지급되는 보상금을 말합니다.

제 3 조 (약관의 명시와 개정)
1. 회사는 본 약관의 내용을 파트너가 쉽게 알 수 있도록 서비스 초기 화면 또는 설정 메뉴에 게시합니다.
2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
3. 회사가 약관을 개정할 경우, 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전(불리한 변경은 30일 이전)부터 공지합니다.
4. 파트너가 개정약관의 적용에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.

제 4 조 (서비스의 제공)
1. 회사는 B2B 파트너 전용 모바일 부고장 작성, 화환 주문 유치 및 실시간 확인, 파트너 수당 및 추천인 보너스 적립/출금 관리 대시보드 등의 서비스를 24시간 연중무휴 제공함을 원칙으로 합니다.

제 5 조 (서비스의 변경 및 중단)
회사는 상당한 이유가 있는 경우 서비스의 전부 또는 일부를 제한하거나 변경·중단할 수 있으며, 무료 제공 서비스 수정·중단 시 관련 법령에 특별한 규정이 없는 한 별도 보상을 하지 않습니다.

제 6 조 (파트너의 의무)
파트너는 가입/계좌 등록 시 타인의 정보 도용, 허위 부고장 생성, 유령 주문 발생 등 부정한 방법으로 수당을 취득하는 행위, 명예 훼손, 스팸 전송 및 지적재산권 침해 행위를 해서는 안 됩니다.

제 7 조 (콘텐츠의 관리)
파트너가 작성한 부고장 콘텐츠의 권리와 책임은 파트너에게 있으며, 회사는 모욕, 미풍양속 위반, 불법복제, 영리목적 스미싱/보이스피싱 의심 게시물을 사전통지 없이 삭제하거나 등록 거부할 수 있습니다.

제 8 조 (수당 정산 및 원천징수)
1. 화환 수당은 주문 배송 완료 및 구매 확정이 처리된 건에 한하여 정산 적립되며, 취소 및 환불 시 자동 차감·회수 처리됩니다.
2. 개인(프리랜서) 파트너의 출금 신청 시 소득세법 제127조에 의거하여 사업소득세 3.3%(국세 3%, 지방소득세 0.3%)를 원천징수 공제한 후 입금됩니다.
3. 회사는 원천징수 세무 신고를 위해 파트너의 주민등록번호(개인정보 보호법 제24조의2 근거)를 수집 및 국세청에 신고합니다.
4. 정산 이체는 파트너 본인 명의 계좌로만 이체되며 명의 불일치 시 출금이 제한됩니다.

제 8 조의2 (부정 수급 및 제재)
허위 부고, 명의 도용, 어뷰징 등 부정한 방법으로 수당을 수급한 경우 계정 영구 정지, 부정 수당 전액 소멸·몰수 및 환수, 민·형사상 법적 조치가 취해지며 재가입이 제한됩니다.

제 9 조 (저작권의 귀속)
회사가 작성한 저작물 및 플랫폼 지적재산권은 회사에 귀속되며 파트너는 무단 복제, 배포, 영리 이용을 할 수 없습니다.

제 10 조 (개인정보보호)
회사는 파트너의 개인정보를 보호하기 위하여 개인정보처리방침을 수립하고 이를 준수합니다.

제 11 조 (면책조항)
회사는 천재지변, 파트너 귀책사유, 결제대행사(PG사), 이노페이, 금융기관의 전산 장애 또는 파트너의 계좌정보 오입력으로 인한 이체 지연/오류에 대하여 책임을 지지 않습니다.

제 12 조 (분쟁의 해결)
회사와 파트너 간 분쟁 발생 시 원만히 해결하되 소송이 제기될 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.`
                            ) : (
                                `[마음부고 B2B 파트너(부고온) 개인정보처리방침]

마음부고(이하 "회사")는 "개인정보 보호법" 등 관련 법규를 준수하여 파트너의 개인정보를 안전하게 보호합니다.

1. 수집하는 개인정보 항목 및 수집방법
가. 수집하는 개인정보 항목
- 필수항목: 휴대폰 번호, 상호명(소속), 대표자명(성명), 비밀번호
- 정산 수집항목: 예금주, 은행명, 계좌번호
- 원천징수 세무 신고 수집항목: 성명, 주민등록번호(또는 외국인등록번호), 본인인증 정보 (소득세법 제127조 근거)
- 자동 수집항목: 서비스 이용 기록, 접속 로그, IP 주소, 쿠키, 접속 기기 정보
나. 수집방법: 웹/앱 회원가입, 계좌 등록, 본인인증 폼 직접 입력 및 서비스 이용 중 자동 수집

2. 개인정보의 수집 및 이용목적
가. 파트너 서비스 제공, 본인 확인 및 파트너 자격 관리
나. 화환 수당 및 추천인 보너스 이체 송금 처리
다. 프리랜서 사업소득 3.3%(국세 3%, 지방소득세 0.3%) 원천징수 국세청 세무 신고 대행 및 지급명세서 제출
라. 파트너 문의 불만 처리, 정산 공지 안내 전달

3. 개인정보의 보유 및 이용기간
- 파트너 회원 정보: 파트너 회원 탈퇴 시까지
- 세무 신고 관련 자료 (주민등록번호 포함): 5년 (국세기본법 및 소득세법)
- 정산금 결제 및 이체 기록: 5년 (전자상거래법)
- 문의 정보: 1년, 접속 로그: 3개월 (통신비밀보호법)
- 부정 이용 및 어뷰징 기록: 5년 (전자상거래법)

4. 개인정보의 파기절차 및 방법
목적 달성 후 별도 DB로 옮겨져 법정 보관기간 후 기록을 재생할 수 없는 기술적 방법으로 파기합니다.

5. 개인정보 제공 및 공유 (세무 신고 제3자 제공)
회사는 소득세 원천징수 신고를 위해 개인정보보호법 제17조 제2항에 따라 제3자에게 제공합니다.
- 제공받는 자: 국세청, 관할 세무서, 회사의 수임 세무사
- 제공 항목: 성명, 주민등록번호, 지급 금액, 지급 일자
- 제공 목적: 소득세법에 따른 사업소득 3.3% 원천징수 세무 신고 및 영수증 발행
- 보유 기간: 세법에 따른 보존 기한 5년
- 동의 거부권: 동의 거부 시 원천징수 신고 불가로 정산 출금이 제한될 수 있습니다.

6. 이용자(파트너)의 권리와 행사방법
파트너는 언제든지 본인의 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수 있으며 개인정보보호책임자에게 이메일 연락 시 지체 없이 조치합니다.

7. 쿠키의 사용
이용자의 접속 빈도 분석 및 편의 향상을 위해 쿠키를 사용하며 웹 브라우저 설정을 통해 거부할 수 있습니다.

8. 개인정보보호책임자
- 성명: 김미연 (대표)
- 직책: 대표
- 이메일: miyoun1990@gmail.com

9. 권익침해 구제방법
개인정보침해신고센터 (118) / 대검찰청 사이버수사과 (1301) / 경찰청 사이버안전국 (182)

10. 개인정보처리방침 변경
본 개인정보처리방침은 2026년 6월 21일부터 적용됩니다.`
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#64748B' }}>
                로딩 중...
            </div>
        }>
            <SignupInner />
        </Suspense>
    );
}
