'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function B2BDeleteAccountPage() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const formatPhone = (val: string) => {
        const nums = val.replace(/[^0-9]/g, '').slice(0, 11);
        if (nums.length <= 3) return nums;
        if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
        return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) {
            setErrorMsg('가입하신 휴대폰 번호를 정확히 입력해 주세요.');
            return;
        }
        if (!password) {
            setErrorMsg('비밀번호를 입력해 주세요.');
            return;
        }
        if (!agreed) {
            setErrorMsg('계정 및 데이터 삭제 안내사항에 동의해 주세요.');
            return;
        }

        if (!confirm('부고온플러스(부고온) 파트너 계정을 영구 삭제하시겠습니까?\n삭제된 계정 및 데이터는 복구할 수 없습니다.')) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/b2b/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: cleanPhone,
                    password,
                    forfeitBalance: true,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                try {
                    localStorage.removeItem('b2b_token');
                    localStorage.removeItem('b2b_user');
                } catch {}
                setCompleted(true);
            } else {
                setErrorMsg(data.error || '계정 삭제 처리 중 오류가 발생했습니다.');
            }
        } catch {
            setErrorMsg('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#ffffff', color: '#0f172a', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
            <header style={{ height: '56px', display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    type="button"
                    onClick={() => router.back()}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px 4px 0', fontSize: '18px', color: '#0f172a' }}
                    aria-label="뒤로가기"
                >
                    &#8592;
                </button>
                <h1 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>부고온플러스 계정 및 데이터 삭제 요청</h1>
            </header>

            <main style={{ padding: '24px 20px 48px' }}>
                {completed ? (
                    <div style={{ padding: '32px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>계정 및 개인정보 삭제가 완료되었습니다.</h2>
                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
                            회원님의 파트너 계정과 등록된 신분증 이미지, 정산 계좌, 푸시 알림 토큰 등 개인정보가 즉시 파기되었습니다. 그동안 부고온플러스(부고온) 서비스를 이용해 주셔서 감사합니다.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.replace('/b2b/login')}
                            style={{ width: '100%', height: '48px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#ffffff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            확인
                        </button>
                    </div>
                ) : (
                    <>
                        <section style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>부고온플러스(부고온) 파트너 계정 삭제 안내</h2>
                            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                                앱 내 <strong>[설정 &gt; 정보 &gt; 회원탈퇴]</strong> 메뉴 또는 본 웹페이지를 통해 언제든지 파트너 계정 및 데이터를 직접 삭제하실 수 있습니다.
                            </p>
                        </section>

                        <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '13px', lineHeight: 1.6, color: '#334155' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>1. 즉시 삭제(파기)되는 데이터</div>
                            <ul style={{ margin: '0 0 14px 18px', padding: 0 }}>
                                <li>파트너 계정 정보 (성명, 상호/소속, 비밀번호, 프로필 이미지)</li>
                                <li>본인인증 및 신분증 원본 사진 이미지, 주민등록번호/운전면허번호 등 고유식별정보</li>
                                <li>정산 계좌 정보 (은행명, 계좌번호, 예금주) 및 앱 푸시 알림 토큰</li>
                                <li>미출금 잔여 적립금 (탈퇴 시 전액 자동 소멸되며 복구 불가)</li>
                            </ul>
                            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>2. 관계 법령에 따른 일정 기간 보존 데이터</div>
                            <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
                                <li>이미 지급 완료된 수당의 원천징수 세무 신고 자료: 5년 (국세기본법 및 소득세법)</li>
                                <li>정산금 지급 및 전자금융거래 기록: 5년 (전자상거래법)</li>
                            </ul>
                        </section>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                    가입 휴대폰 번호
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                    placeholder="010-0000-0000"
                                    style={{ width: '100%', height: '48px', padding: '0 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                    비밀번호
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="비밀번호 입력"
                                    style={{ width: '100%', height: '48px', padding: '0 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '20px', fontSize: '14px', color: '#1e293b', lineHeight: 1.5 }}>
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#0f172a' }}
                                />
                                <span>위 데이터 파기 안내 및 미출금 잔여 적립금 자동 소멸에 모두 동의하며 계정을 영구 삭제합니다.</span>
                            </label>

                            {errorMsg && (
                                <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px', fontWeight: 500 }}>
                                    {errorMsg}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !agreed}
                                style={{
                                    width: '100%',
                                    height: '50px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: agreed ? '#dc2626' : '#cbd5e1',
                                    color: '#ffffff',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    cursor: agreed ? 'pointer' : 'not-allowed',
                                }}
                            >
                                {loading ? '삭제 처리 중...' : '계정 및 데이터 영구 삭제하기'}
                            </button>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
}
