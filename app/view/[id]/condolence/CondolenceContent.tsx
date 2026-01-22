'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import './condolence.css';

interface AccountInfo {
    relationship: string;
    name: string;
    bank: string;
    holder: string;
    number: string;
}

const AMOUNT_OPTIONS = [
    { value: 50000, label: '5만원' },
    { value: 100000, label: '10만원' },
    { value: 150000, label: '15만원' },
    { value: 200000, label: '20만원' },
    { value: 300000, label: '30만원' },
    { value: 500000, label: '50만원' },
    { value: 1000000, label: '100만원' },
];

export default function CondolenceContent() {
    const params = useParams();
    const router = useRouter();

    // sessionStorage에서 바로 읽기
    const stored = sessionStorage.getItem('condolence_account');
    const account: AccountInfo | null = stored ? JSON.parse(stored) : null;

    const [buyerName, setBuyerName] = useState('');
    const [buyerPhone, setBuyerPhone] = useState('');
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [agreed, setAgreed] = useState(false);

    const formatPhone = (value: string) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const handlePayment = () => {
        if (!buyerName || !buyerPhone || !selectedAmount || !agreed) {
            alert('모든 정보를 입력하고 동의해주세요.');
            return;
        }
        alert('카드결제 서비스 준비 중입니다.\n이노페이 PG 연동 완료 후 사용 가능합니다.');
    };

    const canSubmit = buyerName && buyerPhone && selectedAmount && agreed;

    if (!account) {
        return (
            <main className="condolence-page">
                <header className="condolence-header">
                    <button className="back-button" onClick={() => router.back()}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <h1>부의금 카드결제</h1>
                </header>
                <div className="loading-container">
                    계좌 정보가 없습니다.<br />
                    <button
                        style={{ marginTop: 16, padding: '12px 24px', background: '#FCC419', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}
                        onClick={() => router.back()}
                    >
                        돌아가기
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="condolence-page">
            <header className="condolence-header">
                <button className="back-button" onClick={() => router.back()}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <h1>부의금 카드결제</h1>
            </header>

            <div className="condolence-content">
                <section className="account-info-card">
                    <div className="account-header">
                        <span className="account-rel">{account.relationship}</span>
                        <span className="account-name">{account.name}</span>
                    </div>
                    <div className="account-detail">
                        <span className="bank-name">{account.bank}({account.holder})</span>
                        <span className="account-number-display">{account.number}</span>
                    </div>
                </section>

                <section className="form-section">
                    <label className="form-label">보내시는 분 성함</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="성함을 입력해주세요"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                    />
                </section>

                <section className="form-section">
                    <label className="form-label">보내시는 분 연락처</label>
                    <input
                        type="tel"
                        className="form-input"
                        placeholder="010-0000-0000"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(formatPhone(e.target.value))}
                        maxLength={13}
                    />
                </section>

                <section className="form-section">
                    <label className="form-label">마음을 전하실 금액을 선택해주세요</label>
                    <div className="amount-grid">
                        {AMOUNT_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`amount-button ${selectedAmount === option.value ? 'selected' : ''}`}
                                onClick={() => setSelectedAmount(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="agreement-section">
                    <label className="agreement-label">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <span>결제에 동의합니다</span>
                    </label>
                    <p className="agreement-note">* 부의금 카드결제는 장례식장과 무관합니다.</p>
                </section>

                <button
                    type="button"
                    className={`submit-button ${canSubmit ? 'active' : ''}`}
                    onClick={handlePayment}
                    disabled={!canSubmit}
                >
                    결제하기 {selectedAmount ? `(${(selectedAmount / 10000).toLocaleString()}만원)` : ''}
                </button>
            </div>
        </main>
    );
}
