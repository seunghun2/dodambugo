'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconWallet } from '@tabler/icons-react';
import { BottomTabBar } from '@/components/b2b/BottomTabBar';
import commonStyles from '@/components/b2b/common.module.css';
import styles from './wallet.module.css';

interface Transaction {
    id: string;
    amount: number;
    type: string;
    description: string;
    created_at: string;
}

export default function WalletPage() {
    const router = useRouter();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawing, setWithdrawing] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const getToken = () => localStorage.getItem('b2b_token');

    const fetchWallet = useCallback(async () => {
        const token = getToken();
        if (!token) { router.push('/b2b/login'); return; }

        try {
            const res = await fetch('/api/b2b/wallet', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) { router.push('/b2b/login'); return; }
            const data = await res.json();
            setBalance(data.balance);
            setTransactions(data.transactions);
        } catch {
            setError('데이터를 불러오지 못했습니다.');
        }
        setLoading(false);
    }, [router]);

    useEffect(() => { fetchWallet(); }, [fetchWallet]);

    const handleWithdraw = async () => {
        const amount = parseInt(withdrawAmount);
        if (!amount || amount <= 0) { setError('금액을 입력해 주세요.'); return; }
        setError('');
        setWithdrawing(true);

        try {
            const res = await fetch('/api/b2b/wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ amount }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('출금 신청이 완료되었습니다.');
                setShowWithdraw(false);
                setWithdrawAmount('');
                fetchWallet();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error);
            }
        } catch {
            setError('출금 신청 중 오류가 발생했습니다.');
        }
        setWithdrawing(false);
    };

    const formatCurrency = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'wreath_reward': return '화환 판매 적립';
            case 'referral_bonus': return '추천 수당';
            case 'withdrawal': return '출금';
            default: return type;
        }
    };

    const formatDate = (d: string) => {
        const date = new Date(d);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    if (loading) return <div className={styles.loadingState}>불러오는 중...</div>;

    return (
        <div className={`${commonStyles.b2bLayout} ${styles.container}`}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.push('/b2b/dashboard')}>
                    <IconArrowLeft size={20} />
                </button>
                <span className={styles.headerTitle}>정산</span>
                <span className={styles.headerRight}></span>
            </div>

            {/* 잔액 카드 */}
            <div className={styles.balanceCard}>
                <div className={styles.balanceTop}>
                    <IconWallet size={18} color="rgba(255,255,255,0.7)" />
                    <span className={styles.balanceLabel}>내 예치금</span>
                </div>
                <p className={styles.balanceAmount}>{formatCurrency(balance)}<span className={styles.won}>원</span></p>
                <button className={styles.withdrawBtn} onClick={() => setShowWithdraw(true)}>출금 신청</button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {/* 출금 모달 */}
            {showWithdraw && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3 className={styles.modalTitle}>출금 신청</h3>
                        <p className={styles.modalDesc}>등록된 정산 계좌로 입금됩니다</p>
                        <input
                            type="number"
                            className={styles.input}
                            placeholder="출금 금액"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <p className={styles.modalHint}>출금 가능: {formatCurrency(balance)}원</p>
                        <div className={styles.modalBtns}>
                            <button className={styles.cancelBtn} onClick={() => { setShowWithdraw(false); setError(''); }}>취소</button>
                            <button className={styles.confirmBtn} onClick={handleWithdraw} disabled={withdrawing}>
                                {withdrawing ? '처리 중...' : '신청하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 내역 리스트 */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>입출금 내역</h3>
                {transactions.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>아직 내역이 없습니다</p>
                        <p className={styles.emptyHint}>부고를 작성하고 화환이 판매되면 자동으로 적립됩니다</p>
                    </div>
                ) : (
                    <div className={styles.txList}>
                        {transactions.map((tx) => (
                            <div key={tx.id} className={styles.txItem}>
                                <div>
                                    <p className={styles.txType}>{getTypeLabel(tx.type)}</p>
                                    <p className={styles.txDesc}>{tx.description}</p>
                                    <p className={styles.txDate}>{formatDate(tx.created_at)}</p>
                                </div>
                                <span className={tx.amount > 0 ? styles.txPlus : styles.txMinus}>
                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}원
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BottomTabBar />
        </div>
    );
}
