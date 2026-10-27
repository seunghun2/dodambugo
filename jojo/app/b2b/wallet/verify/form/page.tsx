'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CalendarPicker from '@/app/b2b/create/sections/CalendarPicker';
import styles from './form.module.css';

export default function VerifyFormPage() {
    const router = useRouter();

    // 폼 입력 데이터
    const [partnerType, setPartnerType] = useState<'individual' | 'business'>('individual');
    const [name, setName] = useState('');
    const [rrnFront, setRrnFront] = useState('');
    const [rrnBack, setRrnBack] = useState('');
    const [idType, setIdType] = useState<'주민등록증' | '운전면허증'>('주민등록증');
    const [idIssueDate, setIdIssueDate] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [driverLicenseNo, setDriverLicenseNo] = useState('');
    const [phone, setPhone] = useState('');

    // 사업자 관련 추가 상태
    const [businessNo, setBusinessNo] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [ownerName, setOwnerName] = useState('');

    // 본인인증 관련 상태
    const [isSmsSent, setIsSmsSent] = useState(false);
    const [smsCode, setSmsCode] = useState('');
    const [timer, setTimer] = useState(180); // 3분
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [smsError, setSmsError] = useState('');
    const [smsSuccess, setSmsSuccess] = useState('');

    // 신분증/사업자등록증 업로드 상태
    const [idCardFile, setIdCardFile] = useState<File | null>(null);
    const [idCardUrl, setIdCardUrl] = useState('');
    const [idCardUploadProgress, setIdCardUploadProgress] = useState(0);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIdCardFile(file);
        setError('');
        setIdCardUploadProgress(10);

        const b2bUser = localStorage.getItem('b2b_user');
        if (!b2bUser) {
            setError('로그인 정보가 유효하지 않습니다.');
            setIdCardUploadProgress(0);
            return;
        }
        const user = JSON.parse(b2bUser);
        const userId = user.id;

        try {
            setIdCardUploadProgress(30);

            const token = localStorage.getItem('b2b_token');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/b2b/verify/upload', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || '업로드 오류');
            }

            const resData = await response.json();
            
            setIdCardUploadProgress(70);
            setIdCardUrl(resData.filePath);
            setIdCardUploadProgress(100);
        } catch (err: any) {
            console.error('파일 업로드 오류:', err);
            setError('파일 이미지 업로드에 실패했습니다. 다시 시도해 주세요: ' + (err.message || ''));
            setIdCardUploadProgress(0);
        }
    };

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // 로그인 체크 및 본인 정보 (이름, 휴대폰 번호) 자동 입력 (pre-fill)
        const token = localStorage.getItem('b2b_token');
        if (!token) {
            router.push('/b2b/login');
            return;
        }

        const b2bUser = localStorage.getItem('b2b_user');
        if (b2bUser) {
            try {
                const user = JSON.parse(b2bUser);
                if (user.owner_name) setName(user.owner_name);
                if (user.phone) setPhone(user.phone.replace(/[^0-9]/g, ''));
            } catch {}
        }

        fetch('/api/b2b/me', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
            if (data.owner_name) setName(data.owner_name);
            if (data.phone) setPhone(data.phone.replace(/[^0-9]/g, ''));
        }).catch(() => {});
    }, [router]);

    // 타이머 처리
    useEffect(() => {
        if (isSmsSent && timer > 0 && !isPhoneVerified) {
            timerRef.current = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            setSmsError('인증 시간이 만료되었습니다. 다시 시도해주세요.');
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isSmsSent, timer, isPhoneVerified]);

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    // 🚀 실전 SMS 인증번호 발송 (SOLAPI 연동)
    const handleSendSms = async () => {
        if (!phone || phone.length < 10) {
            setError('올바른 휴대폰 번호를 입력해주세요.');
            return;
        }
        setError('');
        setSmsError('');

        try {
            const res = await fetch('/api/b2b/verify/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (res.ok) {
                setIsSmsSent(true);
                setTimer(180);
                setSmsSuccess('인증번호가 발송되었습니다.');
            } else {
                setError(data.error || '문자 발송에 실패했습니다.');
            }
        } catch {
            setError('문자 발송 중 오류가 발생했습니다.');
        }
    };

    // 🚀 실전 SMS 인증번호 6자리 실시간 검증
    const handleVerifySms = async (val: string) => {
        setSmsCode(val);
        setSmsError('');
        if (val.length === 6) {
            try {
                const res = await fetch('/api/b2b/verify/check-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, code: val }),
                });
                const data = await res.json();
                if (res.ok) {
                    setIsPhoneVerified(true);
                    setSmsSuccess('휴대폰 본인인증이 완료되었습니다.');
                    setSmsError('');
                    if (timerRef.current) clearInterval(timerRef.current);
                } else {
                    setSmsError(data.error || '인증번호가 일치하지 않습니다.');
                }
            } catch {
                setSmsError('인증번호 확인 중 오류가 발생했습니다.');
            }
        }
    };

    // 최종 폼 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPhoneVerified) {
            setError('휴대폰 본인인증을 진행해주세요.');
            return;
        }

        if (partnerType === 'individual') {
            if (idType === '주민등록증' && !idIssueDate) {
                setError('주민등록증 발급일자를 입력해주세요.');
                return;
            }
            if (idType === '운전면허증' && !driverLicenseNo) {
                setError('운전면허증 면허번호를 입력해주세요.');
                return;
            }
        } else {
            if (!companyName.trim()) {
                setError('상호명(회사명)을 입력해주세요.');
                return;
            }
            if (!ownerName.trim()) {
                setError('대표자명을 입력해주세요.');
                return;
            }
            if (!businessNo.trim()) {
                setError('사업자등록번호를 입력해주세요.');
                return;
            }
        }

        setError('');
        setSubmitting(true);

        const token = localStorage.getItem('b2b_token');

        try {
            const payload = partnerType === 'individual' ? {
                partner_type: 'individual',
                identity_name: name,
                rrn_front: rrnFront,
                rrn_back: rrnBack,
                identity_type: idType,
                id_issue_date: idType === '주민등록증' ? idIssueDate : null,
                driver_license_no: idType === '운전면허증' ? driverLicenseNo : null,
                identity_phone: phone,
                id_card_url: idCardUrl,
            } : {
                partner_type: 'business',
                company_name: companyName,
                owner_name: ownerName,
                business_no: businessNo,
                business_license_url: idCardUrl,
                identity_phone: phone
            };

            const res = await fetch('/api/b2b/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                const b2bUser = localStorage.getItem('b2b_user');
                if (b2bUser) {
                    const parsed = JSON.parse(b2bUser);
                    parsed.identity_verified = true;
                    parsed.partner_type = partnerType;
                    localStorage.setItem('b2b_user', JSON.stringify(parsed));
                }

                router.push('/b2b/wallet');
            } else {
                setError(data.error || '본인인증 저장에 실패했습니다.');
            }
        } catch {
            setError('서버 연결 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    // 전체 입력 폼 유효성 체크
    const isFormValid = partnerType === 'individual'
        ? (name.trim() !== '' &&
           rrnFront.length === 6 &&
           rrnBack.length === 7 &&
           isPhoneVerified &&
           idCardUrl !== '' &&
           (idType === '주민등록증' ? idIssueDate.trim() !== '' : driverLicenseNo.trim() !== ''))
        : (companyName.trim() !== '' &&
           ownerName.trim() !== '' &&
           businessNo.trim() !== '' &&
           isPhoneVerified &&
           idCardUrl !== '');

    return (
        <div className={styles.page}>
            {/* 헤더 */}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => {
                    if (window.history.length > 1) router.back();
                    else router.replace('/b2b/wallet/verify');
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            </header>

            <div className={styles.content}>
                <h1 className={styles.title}>
                    개인 정보 입력(소득증빙)
                </h1>
                <p className={styles.redAlert}>
                    입력해주신 개인정보를 바탕으로 사업소득 신고가 진행될 예정입니다. 따라서 신청자와 예금주의 정보를 동일하게 입력 부탁드립니다.
                </p>

                {error && <p className={styles.errorText} style={{ marginBottom: '16px' }}>{error}</p>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    {partnerType === 'individual' ? (
                        <>
                            {/* 이름 */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>이름</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="성명 입력"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isPhoneVerified && name !== ''}
                                />
                            </div>

                            {/* 주민등록번호 */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>주민등록번호</label>
                                <div className={styles.rrnRow}>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="앞 6자리"
                                        maxLength={6}
                                        value={rrnFront}
                                        onChange={(e) => setRrnFront(e.target.value.replace(/[^0-9]/g, ''))}
                                        style={{ textAlign: 'center' }}
                                    />
                                    <span className={styles.rrnDivider}>-</span>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        placeholder="뒤 7자리"
                                        maxLength={7}
                                        value={rrnBack}
                                        onChange={(e) => setRrnBack(e.target.value.replace(/[^0-9]/g, ''))}
                                        style={{ textAlign: 'center' }}
                                    />
                                </div>
                            </div>

                            {/* 인증수단 */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>인증수단</label>
                                <div className={styles.selectWrapper}>
                                    <select
                                        className={styles.select}
                                        value={idType}
                                        onChange={(e) => setIdType(e.target.value as any)}
                                    >
                                        <option value="주민등록증">주민등록증</option>
                                        <option value="운전면허증">운전면허증</option>
                                    </select>
                                    <div className={styles.selectIcon}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* 인증수단별 분기 입력 */}
                            {idType === '주민등록증' ? (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>주민등록증 발급일자</label>
                                    <div 
                                        className={styles.input}
                                        onClick={() => setIsCalendarOpen(true)}
                                        style={{ 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between',
                                            color: idIssueDate ? '#0f172a' : '#94a3b8'
                                        }}
                                    >
                                        <span>{idIssueDate ? idIssueDate.replace(/-/g, '.') : '발급일자를 선택해주세요 (예: 2023.05.12)'}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>운전면허증 면허번호</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="운전면허증에 표시된 면허번호를 입력해주세요"
                                        value={driverLicenseNo}
                                        onChange={(e) => setDriverLicenseNo(e.target.value)}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* 상호명 */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>상호명 (회사명)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="상호명 입력"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </div>

                            {/* 대표자명 */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>대표자명</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="대표자 성명 입력"
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                />
                            </div>

                            {/* 사업자등록번호 */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>사업자등록번호</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="사업자등록번호 입력 (-없이 10자리)"
                                    maxLength={10}
                                    value={businessNo}
                                    onChange={(e) => setBusinessNo(e.target.value.replace(/[^0-9]/g, ''))}
                                />
                            </div>
                        </>
                    )}

                    {/* 휴대폰 번호 */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>본인 휴대폰 번호</label>
                        <div className={styles.phoneRow}>
                            <input
                                type="tel"
                                className={styles.input}
                                placeholder="휴대폰 번호 입력 (-없이)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                disabled={isPhoneVerified}
                            />
                            <button
                                type="button"
                                className={styles.verifyBtn}
                                onClick={handleSendSms}
                                disabled={isPhoneVerified || !phone}
                            >
                                {isSmsSent ? '재전송' : '인증'}
                            </button>
                        </div>

                        {/* 인증번호 입력 필드 노출 */}
                        {isSmsSent && !isPhoneVerified && (
                            <div className={styles.codeRow} style={{ position: 'relative', marginTop: '8px' }}>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="인증번호 6자리 입력"
                                    maxLength={6}
                                    value={smsCode}
                                    onChange={(e) => handleVerifySms(e.target.value.replace(/[^0-9]/g, ''))}
                                    style={{ paddingRight: '60px' }}
                                />
                                {timer > 0 && <span className={styles.timer}>{formatTimer(timer)}</span>}
                            </div>
                        )}

                        {smsSuccess && <p className={styles.successText}>{smsSuccess}</p>}
                        {smsError && <p className={styles.errorText}>{smsError}</p>}
                    </div>

                    {/* 신분증 이미지 업로드 */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            {partnerType === 'individual' ? '신분증 이미지 업로드 (최초 1회 필수)' : '사업자등록증 이미지 업로드 (최초 1회 필수)'}
                        </label>
                        <div className={styles.fileUploadRow}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className={styles.fileInput}
                                id="id-card-upload"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="id-card-upload" className={styles.fileLabelBtn}>
                                {idCardFile ? '파일 변경' : (partnerType === 'individual' ? '신분증 이미지 업로드' : '사업자등록증 업로드')}
                            </label>
                            {idCardFile && <span className={styles.fileName}>{idCardFile.name}</span>}
                        </div>
                        {idCardUploadProgress > 0 && idCardUploadProgress < 100 && (
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${idCardUploadProgress}%` }} />
                            </div>
                        )}
                        {idCardUrl && <p className={styles.successText}>✓ 업로드 완료</p>}
                    </div>

                    {/* 제출 버튼 */}
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={!isFormValid || submitting}
                    >
                        {submitting ? '제출 중...' : '다음'}
                    </button>
                </form>

                {/* 마음부고 전용 커스텀 달력 바텀시트 피커 */}
                <CalendarPicker
                    isOpen={isCalendarOpen}
                    title="주민등록증 발급일자 선택"
                    value={idIssueDate}
                    onSelect={(date) => setIdIssueDate(date)}
                    onClose={() => setIsCalendarOpen(false)}
                />
            </div>
        </div>
    );
}
