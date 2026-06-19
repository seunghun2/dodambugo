'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconEye, IconEyeOff, IconCheck } from '@tabler/icons-react';
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

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [timer, setTimer] = useState(0);
    const [showPw, setShowPw] = useState(false);
    const [showPwConfirm, setShowPwConfirm] = useState(false);

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
            await fetch('/api/b2b/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone, checkOnly: true }),
            });

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

                    {!codeSent && !form.phoneVerified && (
                        <button className={styles.subBtn} onClick={sendVerification} disabled={loading || form.phone.replace(/[^0-9]/g, '').length !== 11}>
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
                        </>
                    )}

                    {form.phoneVerified && (
                        <p className={styles.hintOk}>인증이 완료되었습니다.</p>
                    )}

                    <div className={styles.btnRow}>
                        <button className={styles.prevBtn} onClick={prevStep}>뒤로가기</button>
                        <button className={styles.nextBtn} onClick={nextStep} disabled={!form.phoneVerified}>
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

            {/* Step 3: 사업자 정보 */}
            {step === 3 && (
                <div className={styles.stepContent}>
                    <h2 className={styles.stepTitle}>
                        사업자 정보<span className={styles.stepTitleSub}>를 입력해 주세요</span>
                    </h2>
                    <p className={styles.stepDesc}>정산 및 파트너 관리에 필요한 정보입니다.</p>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>상호명</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="회사명 또는 장례식장명"
                            value={form.companyName}
                            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>대표자명</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="대표자 성함"
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
                        <button className={styles.nextBtn} onClick={nextStep}>다음</button>
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
                            type="text"
                            className={styles.input}
                            placeholder="추천인 코드 입력"
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
        </div>
    );
}
