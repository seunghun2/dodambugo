'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
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
    const [identityVerified, setIdentityVerified] = useState(false);
    const [partnerType, setPartnerType] = useState<'individual' | 'business'>('individual');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 탭 및 필터 상태
    const [activeTab, setActiveTab] = useState<'reward' | 'withdraw'>('reward');
    const [rewardFilter, setRewardFilter] = useState<'all' | 'wreath' | 'referral' | 'condolence'>('all');
    const [withdrawSort, setWithdrawSort] = useState<'recent' | 'old'>('recent');

    // 바텀시트 모달 상태
    const [showRewardFilterModal, setShowRewardFilterModal] = useState(false);
    const [showWithdrawSortModal, setShowWithdrawSortModal] = useState(false);

    const getToken = () => localStorage.getItem('b2b_token');

    const fetchWallet = useCallback(async () => {
        console.log('[CLIENT DEBUG] fetchWallet start');
        const token = getToken();
        console.log('[CLIENT DEBUG] fetchWallet token exists:', !!token);
        if (!token) {
            setLoading(false);
            router.push('/b2b/login');
            return;
        }

        try {
            console.log('[CLIENT DEBUG] Fetching /api/b2b/wallet...');
            const res = await fetch('/api/b2b/wallet', {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('[CLIENT DEBUG] Fetch result status:', res.status);
            if (res.status === 401) {
                localStorage.removeItem('b2b_token');
                localStorage.removeItem('b2b_user');
                router.push('/b2b/login');
                return;
            }
            const data = await res.json();
            console.log('[CLIENT DEBUG] Wallet data received:', data);
            setBalance(data.balance || 0);
            setTransactions(data.transactions || []);
            setIdentityVerified(data.identity_verified || false);
            setPartnerType(data.partner_type || 'individual');
        } catch (err) {
            console.error('[CLIENT DEBUG] fetchWallet error:', err);
            setError('데이터를 불러오지 못했습니다.');
        } finally {
            console.log('[CLIENT DEBUG] fetchWallet finally -> setLoading(false)');
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    const handleWithdraw = async () => {
        const amount = parseInt(withdrawAmount);
        if (!amount || amount <= 0) {
            setError('금액을 입력해 주세요.');
            return;
        }
        if (amount > balance) {
            setError('환급 가능 금액을 초과하여 신청할 수 없습니다.');
            return;
        }
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
                setSuccess('환급 신청이 완료되었습니다.');
                setShowWithdraw(false);
                setWithdrawAmount('');
                fetchWallet();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || '환급 신청에 실패했습니다.');
            }
        } catch {
            setError('환급 신청 중 오류가 발생했습니다.');
        } finally {
            setWithdrawing(false);
        }
    };

    const formatCurrency = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

    // 누적 적립금 계산 (amount > 0 인 입금 트랜잭션의 총합)
    const cumulativeReward = useMemo(() => {
        return transactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0);
    }, [transactions]);

    // 누적 환급금 계산 (amount < 0 인 출금 트랜잭션 절대값의 총합)
    const cumulativeWithdraw = useMemo(() => {
        return transactions
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    }, [transactions]);

    // 적립내역 리스트 필터링 및 가공
    const filteredRewards = useMemo(() => {
        let list = transactions.filter(tx => tx.amount > 0);
        if (rewardFilter === 'wreath') {
            list = list.filter(tx => tx.type === 'wreath_reward');
        } else if (rewardFilter === 'referral') {
            list = list.filter(tx => tx.type === 'referral_bonus');
        } else if (rewardFilter === 'condolence') {
            list = list.filter(tx => tx.type === 'condolence_reward');
        }
        // 항상 최신순
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [transactions, rewardFilter]);

    // 환급내역 리스트 정렬 및 가공
    const filteredWithdraws = useMemo(() => {
        let list = transactions.filter(tx => tx.amount < 0);
        if (withdrawSort === 'recent') {
            list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else {
            list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
        return list;
    }, [transactions, withdrawSort]);

    // 날짜 포맷 (MM.DD)
    const formatTxDate = (d: string) => {
        try {
            const date = new Date(d);
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${m}.${day}`;
        } catch {
            return d;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'wreath_reward': return '화환 판매 적립';
            case 'referral_bonus': return '추천 수당';
            case 'condolence_reward': return '조의금 수당';
            default: return '적립 완료';
        }
    };

    if (!mounted) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>정산 정보를 불러오고 있습니다</p>
            </div>
        );
    }

    if (!getToken()) {
        return null;
    }

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>정산 정보를 불러오고 있습니다</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* 헤더 */}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.push('/b2b/dashboard')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <span className={styles.headerTitle}>{activeTab === 'reward' ? '적립내역' : '환급내역'}</span>
                <div className={styles.headerRightPlaceholder} />
            </header>

            {/* 탭 컨테이너 */}
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'reward' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('reward')}
                >
                    적립내역
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'withdraw' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('withdraw')}
                >
                    환급내역
                </button>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className={styles.content}>
                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                {activeTab === 'reward' ? (
                    <div className={styles.rewardSection}>
                        {/* 환급 가능 금액 영역 */}
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryTop}>
                                <span className={styles.summaryLabel}>환급 가능 금액</span>
                                <button className={styles.reportBtn}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    월별 리포트
                                </button>
                            </div>
                            <h2 className={styles.amountDisplay}>{formatCurrency(balance)}원</h2>
                            <button
                                className={styles.actionBtn}
                                onClick={() => {
                                    if (!identityVerified) {
                                        router.push('/b2b/wallet/verify');
                                    } else {
                                        setShowWithdraw(true);
                                    }
                                }}
                            >
                                환급신청
                            </button>
                        </div>

                        {/* 필터 및 목록 헤더 영역 */}
                        <div className={styles.listArea}>
                            <div className={styles.listFilterRow}>
                                <button className={styles.filterBtn} onClick={() => setShowRewardFilterModal(true)}>
                                    {rewardFilter === 'all' ? '전체' : rewardFilter === 'wreath' ? '판매수당' : rewardFilter === 'referral' ? '추천수당' : '조의금수당'}
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E94A0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                <span className={styles.sideInfo}>
                                    누적적립금 {formatCurrency(cumulativeReward)}원
                                </span>
                            </div>

                            {/* 리스트 */}
                            {filteredRewards.length === 0 ? (
                                <div className={styles.emptyState}>적립된 내역이 없습니다.</div>
                            ) : (
                                <div className={styles.rewardList}>
                                    {filteredRewards.map((tx) => (
                                        <div key={tx.id} className={styles.listItem}>
                                            <span className={styles.txDate}>{formatTxDate(tx.created_at)}</span>
                                            <div className={styles.txMain}>
                                                <span className={styles.txTitle}>{getTypeLabel(tx.type)}</span>
                                                <span className={styles.txSub}>{tx.description}</span>
                                            </div>
                                            <span className={styles.txAmountPlus}>+{formatCurrency(tx.amount)}원</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.withdrawSection}>
                        {/* 환급 금액 요약 */}
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>환급 금액</span>
                            <h2 className={styles.amountDisplay} style={{ marginTop: '8px', marginBottom: 0 }}>
                                {formatCurrency(cumulativeWithdraw)}원
                            </h2>
                        </div>

                        {/* 필터 및 목록 헤더 영역 */}
                        <div className={styles.listArea}>
                            <div className={styles.listFilterRow}>
                                <button className={styles.filterBtn} onClick={() => setShowWithdrawSortModal(true)}>
                                    {withdrawSort === 'recent' ? '최신순' : '과거순'}
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E94A0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                            </div>

                            {/* 리스트 */}
                            {filteredWithdraws.length === 0 ? (
                                <div className={styles.emptyState}>환급 신청 및 완료 내역이 없습니다.</div>
                            ) : (
                                <div className={styles.withdrawList}>
                                    {filteredWithdraws.map((tx: any) => {
                                        const rawAmount = Math.abs(tx.amount);
                                        const isBiz = tx.partner_type === 'business';
                                        
                                        const tax = tx.withholding_tax !== undefined ? (tx.withholding_tax + tx.local_income_tax) : Math.floor(rawAmount * 0.033);
                                        const vat = tx.vat !== undefined ? tx.vat : Math.floor(rawAmount * 0.1);
                                        const netAmount = tx.net_amount !== undefined ? tx.net_amount : (isBiz ? rawAmount + vat : rawAmount - tax);
                                        
                                        let statusLabel = '환급 완료';
                                        if (tx.status === 'pending') statusLabel = '환급 대기';
                                        else if (tx.status === 'rejected') statusLabel = '환급 반려';

                                        return (
                                            <div key={tx.id} className={styles.listItem} style={{ alignItems: 'flex-start' }}>
                                                <span className={styles.txDate} style={{ marginTop: '2px' }}>
                                                    {formatTxDate(tx.created_at)}
                                                </span>
                                                <div className={styles.txMain}>
                                                    <span className={styles.txTitle} style={{ 
                                                        color: tx.status === 'pending' ? '#E28743' : tx.status === 'rejected' ? '#E53E3E' : 'inherit' 
                                                    }}>
                                                        {statusLabel}
                                                    </span>
                                                    <span className={styles.txSub}>
                                                        {isBiz ? (
                                                            <>
                                                                환급신청(공급가액) {formatCurrency(rawAmount)}원 + 부가세(10%) {formatCurrency(vat)}원 (세금계산서 발행) / 최종 지급액 = {formatCurrency(netAmount)}원
                                                            </>
                                                        ) : (
                                                            <>
                                                                환급신청 {formatCurrency(rawAmount)}원 - 소득공제(3.3%) {formatCurrency(tax)}원 / 최종 지급액 = {formatCurrency(netAmount)}원
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                                <span className={styles.txAmountMinus} style={{
                                                    color: tx.status === 'rejected' ? '#A0AEC0' : undefined,
                                                    textDecoration: tx.status === 'rejected' ? 'line-through' : undefined
                                                }}>{formatCurrency(netAmount)}원</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 출금 신청 바텀시트 모달 */}
            <AnimatePresence>
                {showWithdraw && (
                    <motion.div 
                        className={styles.bottomSheetOverlay} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setShowWithdraw(false); setError(''); }}
                    >
                        <motion.div 
                            className={styles.bottomSheetContainer}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(event, info) => {
                                if (info.offset.y > 100) {
                                    setShowWithdraw(false);
                                    setError('');
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.dragHandle} />
                            <div className={styles.bottomSheetHeader}>
                                <h3 className={styles.bottomSheetTitle}>환급 신청</h3>
                                <p className={styles.bottomSheetDesc}>등록된 정산 계좌로 입금됩니다.</p>
                            </div>
                            <div className={styles.inputArea}>
                                <input
                                    type="number"
                                    className={styles.amountInput}
                                    placeholder="환급 신청 금액"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                />
                                <p className={styles.amountHint}>환급 가능: {formatCurrency(balance)}원</p>
                                
                                {withdrawAmount && parseInt(withdrawAmount) > 0 && (
                                    <div style={{ marginTop: '16px', padding: '12px', background: '#F8F9FA', borderRadius: '6px', fontSize: '13px', border: '1px solid #E9ECEF', textAlign: 'left' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span>신청 금액</span>
                                            <span style={{ fontWeight: '600' }}>{formatCurrency(parseInt(withdrawAmount))}원</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#E53E3E' }}>
                                            <span>원천징수 세액 (3.3%)</span>
                                            <span>-{formatCurrency(Math.floor(parseInt(withdrawAmount) * 0.033))}원</span>
                                        </div>
                                        <div style={{ borderTop: '1px solid #E9ECEF', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#1A1F26' }}>
                                            <span>예상 최종 입금액</span>
                                            <span>{formatCurrency(parseInt(withdrawAmount) - Math.floor(parseInt(withdrawAmount) * 0.033))}원</span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#868E96', marginTop: '8px', margin: '8px 0 0 0', lineHeight: '1.4' }}>
                                            ※ 개인(프리랜서) 대상자는 소득세법에 따라 3.3% 원천세가 공제된 금액으로 지급됩니다.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className={styles.bottomSheetBtns}>
                                <button className={styles.sheetCancelBtn} onClick={() => { setShowWithdraw(false); setError(''); }}>
                                    취소
                                </button>
                                <button className={styles.sheetConfirmBtn} onClick={handleWithdraw} disabled={withdrawing}>
                                    {withdrawing ? '처리 중...' : '신청하기'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 적립내역 필터 바텀시트 */}
            <AnimatePresence>
                {showRewardFilterModal && (
                    <motion.div 
                        className={styles.bottomSheetOverlay} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowRewardFilterModal(false)}
                    >
                        <motion.div 
                            className={styles.bottomSheetContainer}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(event, info) => {
                                if (info.offset.y > 100) {
                                    setShowRewardFilterModal(false);
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.dragHandle} />
                            <div className={styles.bottomSheetHeader}>
                                <h3 className={styles.bottomSheetTitle}>적립 항목 선택</h3>
                            </div>
                            <div className={styles.bottomSheetList}>
                                <button
                                    className={`${styles.bottomSheetItem} ${rewardFilter === 'all' ? styles.activeItem : ''}`}
                                    onClick={() => { setRewardFilter('all'); setShowRewardFilterModal(false); }}
                                >
                                    전체
                                </button>
                                <button
                                    className={`${styles.bottomSheetItem} ${rewardFilter === 'wreath' ? styles.activeItem : ''}`}
                                    onClick={() => { setRewardFilter('wreath'); setShowRewardFilterModal(false); }}
                                >
                                    판매수당
                                </button>
                                <button
                                    className={`${styles.bottomSheetItem} ${rewardFilter === 'referral' ? styles.activeItem : ''}`}
                                    onClick={() => { setRewardFilter('referral'); setShowRewardFilterModal(false); }}
                                >
                                    추천수당
                                </button>
                                <button
                                    className={`${styles.bottomSheetItem} ${rewardFilter === 'condolence' ? styles.activeItem : ''}`}
                                    onClick={() => { setRewardFilter('condolence'); setShowRewardFilterModal(false); }}
                                >
                                    조의금수당
                                </button>
                            </div>
                            <button className={styles.bottomSheetCancel} onClick={() => setShowRewardFilterModal(false)}>
                                취소
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 환급내역 정렬 바텀시트 */}
            <AnimatePresence>
                {showWithdrawSortModal && (
                    <motion.div 
                        className={styles.bottomSheetOverlay} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowWithdrawSortModal(false)}
                    >
                        <motion.div 
                            className={styles.bottomSheetContainer}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(event, info) => {
                                if (info.offset.y > 100) {
                                    setShowWithdrawSortModal(false);
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.dragHandle} />
                            <div className={styles.bottomSheetHeader}>
                                <h3 className={styles.bottomSheetTitle}>정렬 기준 선택</h3>
                            </div>
                            <div className={styles.bottomSheetList}>
                                <button
                                    className={`${styles.bottomSheetItem} ${withdrawSort === 'recent' ? styles.activeItem : ''}`}
                                    onClick={() => { setWithdrawSort('recent'); setShowWithdrawSortModal(false); }}
                                >
                                    최신순
                                </button>
                                <button
                                    className={`${styles.bottomSheetItem} ${withdrawSort === 'old' ? styles.activeItem : ''}`}
                                    onClick={() => { setWithdrawSort('old'); setShowWithdrawSortModal(false); }}
                                >
                                    과거순
                                </button>
                            </div>
                            <button className={styles.bottomSheetCancel} onClick={() => setShowWithdrawSortModal(false)}>
                                취소
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
