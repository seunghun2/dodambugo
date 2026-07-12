'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import styles from './wallet.module.css';

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

function getPlaceholder(bankName: string): string {
    const bank = BANKS.find((b) => b.name === bankName);
    if (!bank) return '계좌번호 입력';
    return bank.fmt.map((n) => '0'.repeat(n)).join('-');
}

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
    const [withdrawableBalance, setWithdrawableBalance] = useState(0);
    const [lockedBalance, setLockedBalance] = useState(0);
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
    const [bankName, setBankName] = useState<string | null>(null);
    const [accountNo, setAccountNo] = useState<string | null>(null);
    const [accountHolder, setAccountHolder] = useState<string | null>(null);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editBankName, setEditBankName] = useState('');
    const [editAccountNo, setEditAccountNo] = useState('');
    const [editAccountHolder, setEditAccountHolder] = useState('');
    const [isEditingAccount, setIsEditingAccount] = useState(false);
    const [accountVerifyLoading, setAccountVerifyLoading] = useState(false);

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
            setWithdrawableBalance(data.withdrawable_balance || 0);
            setLockedBalance(data.locked_balance || 0);
            setTransactions(data.transactions || []);
            setIdentityVerified(data.identity_verified || false);
            setPartnerType(data.partner_type || 'individual');
            setBankName(data.bank_name || null);
            setAccountNo(data.account_no || null);
            setAccountHolder(data.account_holder || null);
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
        if (amount > withdrawableBalance) {
            setError(`출금 가능 금액을 초과했습니다. (정산 확정 대기 중인 수당: ${formatCurrency(lockedBalance)}원)`);
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

    const verifyAndSaveAccount = async () => {
        if (!editBankName || !editAccountNo || !editAccountHolder) {
            alert('은행, 계좌번호, 예금주를 모두 입력해 주세요.');
            return;
        }
        setAccountVerifyLoading(true);

        try {
            const bank = BANKS.find((b) => b.name === editBankName);
            if (!bank) {
                alert('올바른 은행을 선택해 주세요.');
                return;
            }
            // 1. 계좌 실명 확인
            const verifyRes = await fetch('/api/verify-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bankCd: bank.code,
                    accountNo: editAccountNo.replace(/[^0-9]/g, ''),
                    holderName: editAccountHolder,
                }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
                alert(verifyData.message || '계좌 실명 확인에 실패했습니다. 정보를 다시 확인해 주세요.');
                return;
            }

            // 2. 인증 성공 시 즉시 DB 업데이트
            const token = getToken();
            const res = await fetch('/api/b2b/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    bank_name: editBankName,
                    account_no: editAccountNo,
                    account_holder: editAccountHolder
                })
            });

            if (res.ok) {
                alert('정산 계좌 정보가 안전하게 변경되었습니다.');
                setIsEditingAccount(false);
                fetchWallet();
            } else {
                alert('계좌 정보 수정에 실패했습니다.');
            }
        } catch {
            alert('오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setAccountVerifyLoading(false);
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
        let list = transactions.filter(tx => tx.amount > 0 || tx.type === 'reward_cancel');
        if (rewardFilter === 'wreath') {
            list = list.filter(tx => tx.type === 'wreath_reward' || tx.type === 'reward_cancel');
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
            case 'reward_cancel': return '화환 판매 취소';
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
            {/* 상단 헤더와 탭 영역을 통합 고정하기 위한 컨테이너 */}
            <div className={styles.fixedHeaderContainer}>
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
                                <button className={styles.reportBtn} onClick={() => setShowAccountModal(true)}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                                        <line x1="2" y1="10" x2="22" y2="10" />
                                    </svg>
                                    정산계좌
                                </button>
                            </div>
                            <h2 className={styles.amountDisplay}>{formatCurrency(withdrawableBalance)}원</h2>
                            {lockedBalance > 0 && (
                                <div style={{ fontSize: '12px', color: '#8E94A0', fontWeight: '600', marginTop: '-8px', marginBottom: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>정산 대기 금액:</span>
                                    <span style={{ color: '#10B981', fontWeight: '700' }}>{formatCurrency(lockedBalance)}원</span>
                                </div>
                            )}
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
                                    {filteredRewards.map((tx) => {
                                        const isMinus = tx.amount < 0;
                                        return (
                                            <div key={tx.id} className={styles.listItem}>
                                                <span className={styles.txDate}>{formatTxDate(tx.created_at)}</span>
                                                <div className={styles.txMain}>
                                                    <span className={styles.txTitle}>{getTypeLabel(tx.type)}</span>
                                                    <span className={styles.txSub}>{tx.description}</span>
                                                </div>
                                                <span className={isMinus ? styles.txAmountMinus : styles.txAmountPlus}>
                                                    {isMinus ? '' : '+'}{formatCurrency(tx.amount)}원
                                                </span>
                                            </div>
                                        );
                                    })}
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
                                <p className={styles.amountHint}>환급 가능: {formatCurrency(withdrawableBalance)}원</p>
                                
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

            {/* 정산계좌 정보 바텀시트 */}
            <AnimatePresence>
                {showAccountModal && (
                    <motion.div 
                        className={styles.bottomSheetOverlay} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAccountModal(false)}
                    >
                        <motion.div 
                            className={styles.bottomSheetContainer}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.dragHandle} />
                            <div className={styles.bottomSheetHeader}>
                                <h3 className={styles.bottomSheetTitle}>등록된 정산계좌 정보</h3>
                            </div>
                            
                            <div style={{ padding: '20px 24px', textAlign: 'left' }}>
                                {bankName && accountNo ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f3f5' }}>
                                            <span style={{ color: '#868e96', fontSize: '14px' }}>예금주</span>
                                            <span style={{ fontWeight: 600, color: '#212529', fontSize: '15px' }}>{accountHolder || '-'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f3f5' }}>
                                            <span style={{ color: '#868e96', fontSize: '14px' }}>은행명</span>
                                            <span style={{ fontWeight: 600, color: '#212529', fontSize: '15px' }}>{bankName}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f3f5' }}>
                                            <span style={{ color: '#868e96', fontSize: '14px' }}>계좌번호</span>
                                            <span style={{ fontWeight: 600, color: '#212529', fontSize: '15px' }}>{accountNo}</span>
                                        </div>
                                        <p style={{ color: '#868e96', fontSize: '12px', marginTop: '8px', lineHeight: '1.5' }}>
                                            * 환급 신청 시 등록된 정산 계좌로 입금 및 세무 처리가 진행됩니다.
                                        </p>
                                        <button 
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                backgroundColor: '#f1f3f5',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#495057',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                marginTop: '16px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                setShowAccountModal(false);
                                                setEditBankName(bankName || '');
                                                setEditAccountNo(accountNo || '');
                                                setEditAccountHolder(accountHolder || '');
                                                setIsEditingAccount(true);
                                            }}
                                        >
                                            계좌 정보 변경하기
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                        <p style={{ color: '#495057', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                                            등록된 정산계좌가 없습니다.<br />
                                            최초 1회 본인인증 및 계좌 등록이 필요합니다.
                                        </p>
                                        <button 
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                backgroundColor: '#04B45F',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#ffffff',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                setShowAccountModal(false);
                                                setEditBankName('');
                                                setEditAccountNo('');
                                                setEditAccountHolder('');
                                                setIsEditingAccount(true);
                                            }}
                                        >
                                            정산계좌 등록하러 가기
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button className={styles.bottomSheetCancel} onClick={() => setShowAccountModal(false)}>
                                닫기
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 정산계좌 변경/등록 모달 */}
            <AnimatePresence>
                {isEditingAccount && (
                    <motion.div 
                        className={styles.bottomSheetOverlay} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsEditingAccount(false)}
                    >
                        <motion.div 
                            className={styles.bottomSheetContainer}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.dragHandle} />
                            <div className={styles.bottomSheetHeader}>
                                <h3 className={styles.bottomSheetTitle}>정산 계좌 정보 설정</h3>
                            </div>
                            
                            <div style={{ textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                                    
                                    {/* 은행 선택 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                                        <span style={{ fontSize: '13px', color: '#8E94A0', fontWeight: 600 }}>은행</span>
                                        <select
                                            style={{
                                                width: '100%',
                                                height: '46px',
                                                padding: '0 32px 0 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #E1E4ED',
                                                fontSize: '14px',
                                                backgroundColor: '#fff',
                                                color: '#1A1F26',
                                                appearance: 'none',
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none',
                                                boxSizing: 'border-box',
                                                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238E94A0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 12px center',
                                                backgroundSize: '16px'
                                            }}
                                            value={editBankName}
                                            onChange={(e) => setEditBankName(e.target.value)}
                                        >
                                            <option value="">은행을 선택해 주세요</option>
                                            {BANKS.map((b) => (
                                                <option key={b.code} value={b.name}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 계좌번호 입력 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                                        <span style={{ fontSize: '13px', color: '#8E94A0', fontWeight: 600 }}>계좌번호</span>
                                        <input 
                                            type="text" 
                                            style={{
                                                width: '100%',
                                                height: '46px',
                                                padding: '0 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #E1E4ED',
                                                fontSize: '14px',
                                                color: '#1A1F26',
                                                boxSizing: 'border-box'
                                            }}
                                            placeholder={editBankName ? getPlaceholder(editBankName) : '계좌번호 입력'} 
                                            value={editBankName ? formatAccountNo(editAccountNo, editBankName) : editAccountNo}
                                            onChange={(e) => setEditAccountNo(e.target.value.replace(/[^0-9]/g, ''))}
                                        />
                                    </div>

                                    {/* 예금주 입력 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                                        <span style={{ fontSize: '13px', color: '#8E94A0', fontWeight: 600 }}>예금주</span>
                                        <input 
                                            type="text" 
                                            style={{
                                                width: '100%',
                                                height: '46px',
                                                padding: '0 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #E1E4ED',
                                                fontSize: '14px',
                                                color: '#1A1F26',
                                                boxSizing: 'border-box'
                                            }}
                                            placeholder="예금주 성명" 
                                            value={editAccountHolder}
                                            onChange={(e) => setEditAccountHolder(e.target.value)}
                                        />
                                    </div>

                                    {/* 저장 버튼 */}
                                    <button
                                        style={{
                                            width: '100%',
                                            height: '48px',
                                            backgroundColor: (!editBankName || !editAccountNo || !editAccountHolder || accountVerifyLoading) ? '#E1E4ED' : '#3A8F47',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: (!editBankName || !editAccountNo || !editAccountHolder || accountVerifyLoading) ? '#8E94A0' : '#ffffff',
                                            fontWeight: 600,
                                            fontSize: '15px',
                                            marginTop: '16px',
                                            cursor: 'pointer',
                                            boxSizing: 'border-box',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onClick={verifyAndSaveAccount}
                                        disabled={accountVerifyLoading || !editBankName || !editAccountNo || !editAccountHolder}
                                    >
                                        {accountVerifyLoading ? '실명 확인 중...' : '실명 확인 후 저장하기'}
                                    </button>

                                </div>
                            </div>

                            <button className={styles.bottomSheetCancel} onClick={() => setIsEditingAccount(false)}>
                                취소
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
