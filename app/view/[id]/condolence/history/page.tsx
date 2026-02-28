'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import './history.css';

interface CondolenceOrder {
    id: number;
    order_number: string;
    buyer_name: string;
    buyer_phone: string;
    recipient_name: string;
    amount: number;
    fee: number;
    total_amount: number;
    payment_method: string;
    payment_type: string;
    status: string;
    created_at: string;
}

interface MournerAccount {
    name: string;
    relationship: string;
    bank: string;
    number: string;
}

export default function CondolenceHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const bugoId = params.id as string;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authName, setAuthName] = useState('');
    const [authPhoneLast4, setAuthPhoneLast4] = useState('');
    const [authError, setAuthError] = useState('');
    const [isOwner, setIsOwner] = useState(false); // 대표상주 여부

    const [orders, setOrders] = useState<CondolenceOrder[]>([]);
    const [mournerAccounts, setMournerAccounts] = useState<MournerAccount[]>([]);
    const [selectedMourner, setSelectedMourner] = useState('전체');
    const [bugoData, setBugoData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 부고 데이터 로드
    useEffect(() => {
        loadBugoData();
    }, [bugoId]);

    async function loadBugoData() {

        const { data } = await supabase
            .from('bugo')
            .select('bugo_number, mourner_name, phone_password, account_info, mourners')
            .eq('bugo_number', bugoId)
            .single();

        if (data) {
            setBugoData(data);

            // 상주 계좌 목록 파싱
            let accountInfo = data.account_info;
            if (typeof accountInfo === 'string') {
                try { accountInfo = JSON.parse(accountInfo); } catch { accountInfo = []; }
            }
            if (Array.isArray(accountInfo)) {
                let mourners = data.mourners;
                if (typeof mourners === 'string') {
                    try { mourners = JSON.parse(mourners); } catch { mourners = []; }
                }
                if (!Array.isArray(mourners)) mourners = [];

                const accounts: MournerAccount[] = accountInfo
                    .filter((a: any) => a && a.number)
                    .map((a: any) => {
                        const mourner = mourners.find((m: any) => m.name === a.holder);
                        return {
                            name: a.holder || '',
                            relationship: mourner?.relationship || '',
                            bank: a.bank || '',
                            number: a.number || '',
                        };
                    });
                setMournerAccounts(accounts);
            }
        }
        setLoading(false);
    }

    // 인증 처리
    async function handleAuth() {
        if (!authName.trim()) {
            setAuthError('이름을 입력해주세요.');
            return;
        }

        if (!bugoData) return;

        // 대표상주 인증 (phone_password 뒷4자리)
        const ownerPhone = bugoData.phone_password || '';
        if (authName === bugoData.mourner_name && ownerPhone.slice(-4) === authPhoneLast4) {
            setIsAuthenticated(true);
            setIsOwner(true);
            setSelectedMourner('전체');
            loadOrders();
            return;
        }

        // 추가상주 인증 (이름 + 연락처 뒷4자리)
        let mourners = bugoData.mourners;
        if (typeof mourners === 'string') {
            try { mourners = JSON.parse(mourners); } catch { mourners = []; }
        }
        if (!Array.isArray(mourners)) mourners = [];

        const matchedMourner = mourners.find(
            (m: any) => m.name === authName && m.contact && m.contact.replace(/-/g, '').slice(-4) === authPhoneLast4
        );

        if (matchedMourner) {
            setIsAuthenticated(true);
            setIsOwner(false);
            setSelectedMourner(matchedMourner.name);
            loadOrders();
            return;
        }

        setAuthError('인증 정보가 일치하지 않습니다.');
    }

    // 부의금 내역 로드
    async function loadOrders() {

        const { data } = await supabase
            .from('condolence_orders')
            .select('*')
            .eq('bugo_number', bugoData?.bugo_number)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

        if (data) {
            setOrders(data);
        }
    }

    // 필터된 주문 목록
    const filteredOrders = selectedMourner === '전체'
        ? orders
        : orders.filter((o) => o.recipient_name === selectedMourner);

    // 합계
    const totalAmount = filteredOrders.reduce((sum, o) => sum + o.amount, 0);

    // 결제방법 표시
    function getPaymentLabel(method: string, type: string) {
        if (type === 'card' || method === 'CARD') return '카드결제';
        if (method === 'EPAY') return '간편결제';
        if (type === 'transfer') return '계좌이체';
        return method || '결제';
    }

    // 날짜 포맷
    function formatDate(dateStr: string) {
        const d = new Date(dateStr);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${y}.${m}.${day} ${h}:${min}`;
    }

    if (loading) {
        return (
            <div className="history-page">
                <div className="loading-container">로딩 중...</div>
            </div>
        );
    }

    // 인증 전 화면
    if (!isAuthenticated) {
        return (
            <div className="history-page">
                <header className="history-header">
                    <h1>부의금 현황</h1>
                </header>

                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                <circle cx="12" cy="16" r="1" fill="#888" />
                            </svg>
                        </div>
                        <h2 className="auth-title">본인 인증</h2>
                        <p className="auth-desc">
                            상주 본인만 부의금 내역을 확인할 수 있습니다.<br />
                            이름과 휴대폰번호 뒷 4자리를 입력해주세요.
                        </p>

                        <div className="auth-form">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="이름"
                                value={authName}
                                onChange={(e) => { setAuthName(e.target.value); setAuthError(''); }}
                            />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="휴대폰번호 뒷 4자리"
                                maxLength={4}
                                inputMode="numeric"
                                value={authPhoneLast4}
                                onChange={(e) => { setAuthPhoneLast4(e.target.value.replace(/\D/g, '')); setAuthError(''); }}
                            />

                            {authError && <p className="auth-error">{authError}</p>}

                            <button
                                className={`auth-button ${authName && authPhoneLast4.length === 4 ? 'active' : ''}`}
                                onClick={handleAuth}
                                disabled={!authName || authPhoneLast4.length !== 4}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 인증 후 - 부의금 현황 화면
    return (
        <div className="history-page">
            <header className="history-header">
                <h1>부의금 현황</h1>
            </header>

            <div className="history-content">
                {/* 총액 카드 */}
                <div className="summary-card">
                    <p className="summary-label-text">총 부의금</p>
                    <p className="summary-amount">{totalAmount.toLocaleString()}원</p>
                    <p className="summary-count">총 {filteredOrders.length}건</p>
                </div>

                {/* 상주 탭 (대표상주만 전체 보기 가능) */}
                {isOwner && mournerAccounts.length > 0 && (
                    <div className="mourner-tabs">
                        <button
                            className={`mourner-tab ${selectedMourner === '전체' ? 'active' : ''}`}
                            onClick={() => setSelectedMourner('전체')}
                        >
                            전체
                        </button>
                        {mournerAccounts.map((a, i) => (
                            <button
                                key={i}
                                className={`mourner-tab ${selectedMourner === a.name ? 'active' : ''}`}
                                onClick={() => setSelectedMourner(a.name)}
                            >
                                {a.name}{a.relationship ? `(${a.relationship})` : ''}
                            </button>
                        ))}
                    </div>
                )}

                {/* 부의금 리스트 */}
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <p>아직 접수된 부의금이 없습니다.</p>
                    </div>
                ) : (
                    <div className="order-list">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="order-card">
                                <div className="order-main">
                                    <div className="order-left">
                                        <p className="order-sender">{order.buyer_name}</p>
                                        <p className="order-date">{formatDate(order.created_at)}</p>
                                    </div>
                                    <div className="order-right">
                                        <p className="order-amount">{order.amount.toLocaleString()}원</p>
                                        <p className="order-method">{getPaymentLabel(order.payment_method, order.payment_type)}</p>
                                    </div>
                                </div>
                                {isOwner && order.recipient_name && (
                                    <p className="order-recipient">→ {order.recipient_name}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
