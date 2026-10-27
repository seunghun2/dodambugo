'use client';

import { useState, useEffect } from 'react';
import { 
    IconRefresh, 
    IconCircleCheck, 
    IconCircleX, 
    IconWallet, 
    IconAdjustments, 
    IconCash, 
    IconDeviceFloppy,
    IconLoader2
} from '@tabler/icons-react';
import styles from './condolenceSettings.module.css';

interface CondolenceConfig {
    id: number;
    is_active: boolean;
    fee_rate: number;
    daily_limit: number;
    min_amount: number;
    max_amount: number;
    updated_at: string;
}

interface AmountOption {
    id: number;
    value: number;
    label: string;
    is_active: boolean;
    sort_order: number;
}

export default function CondolenceSettingsPage() {
    const [config, setConfig] = useState<CondolenceConfig | null>(null);
    const [amounts, setAmounts] = useState<AmountOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // 예치금 잔액 상태
    const [depositBalance, setDepositBalance] = useState<{
        remainAmt: string;
        totDptAmt: string;
        totWdrAmt: string;
        loading: boolean;
    }>({ remainAmt: '-', totDptAmt: '-', totWdrAmt: '-', loading: true });

    const fetchConfigAndAmounts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/b2b/admin/condolence-settings');
            if (!res.ok) {
                throw new Error('설정 정보를 가져오는데 실패했습니다.');
            }
            const data = await res.json();
            if (data.success) {
                setConfig(data.config);
                setAmounts(data.amounts || []);
            } else {
                showAlert('error', data.error || '에러가 발생했습니다.');
            }
        } catch (err: any) {
            showAlert('error', err.message || '네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepositBalance = async () => {
        setDepositBalance(prev => ({ ...prev, loading: true }));
        try {
            const res = await fetch('/api/condolence/transfer/balance');
            const data = await res.json();
            if (data.success && data.data) {
                setDepositBalance({
                    remainAmt: Number(data.data.remainAmt || 0).toLocaleString(),
                    totDptAmt: Number(data.data.totDptAmt || 0).toLocaleString(),
                    totWdrAmt: Number(data.data.totWdrAmt || 0).toLocaleString(),
                    loading: false,
                });
            } else {
                setDepositBalance(prev => ({ ...prev, loading: false }));
            }
        } catch (e) {
            setDepositBalance(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        fetchConfigAndAmounts();
        fetchDepositBalance();
    }, []);

    const showAlert = (type: 'success' | 'error', message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3000);
    };

    // 서비스 전체 활성/비활성 토글
    const handleToggleService = async () => {
        if (!config) return;
        const newActive = !config.is_active;

        try {
            const res = await fetch('/api/b2b/admin/condolence-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'config',
                    is_active: newActive,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setConfig({ ...config, is_active: newActive, updated_at: new Date().toISOString() });
                showAlert('success', newActive ? '조의금 서비스가 활성화되었습니다.' : '조의금 서비스가 비활성화되었습니다.');
            } else {
                showAlert('error', data.error || '상태 변경에 실패했습니다.');
            }
        } catch (err: any) {
            showAlert('error', '네트워크 오류가 발생했습니다.');
        }
    };

    // 설정 정보 저장
    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!config) return;

        setSaving(true);
        try {
            const res = await fetch('/api/b2b/admin/condolence-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'config',
                    fee_rate: config.fee_rate,
                    daily_limit: config.daily_limit,
                    min_amount: config.min_amount,
                    max_amount: config.max_amount,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showAlert('success', '설정이 성공적으로 저장되었습니다.');
            } else {
                showAlert('error', data.error || '설정 저장에 실패했습니다.');
            }
        } catch (err: any) {
            showAlert('error', '네트워크 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 개별 금액 옵션 활성/비활성 토글
    const handleToggleAmount = async (amt: AmountOption) => {
        const newActive = !amt.is_active;

        try {
            const res = await fetch('/api/b2b/admin/condolence-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'amount',
                    id: amt.id,
                    is_active: newActive,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setAmounts(prev => prev.map(a => a.id === amt.id ? { ...a, is_active: newActive } : a));
                showAlert('success', `${amt.label} 옵션이 ${newActive ? '활성화' : '비활성화'}되었습니다.`);
            } else {
                showAlert('error', data.error || '금액 옵션 변경에 실패했습니다.');
            }
        } catch (err: any) {
            showAlert('error', '네트워크 오류가 발생했습니다.');
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={styles.loadingSpinner}>
                <IconLoader2 className={styles.spinning} size={24} />
                <span style={{ marginLeft: '8px' }}>설정 정보를 불러오는 중...</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.titleArea}>
                <div>
                    <h1 className={styles.title}>B2B 조의금 서비스 설정</h1>
                    <p className={styles.subtitle}>부고장에서 사용되는 모바일 조의금(카드결제) 서비스 및 노출 금액을 관리합니다.</p>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={() => { fetchConfigAndAmounts(); fetchDepositBalance(); }} className={styles.btnRefresh}>
                        <IconRefresh size={16} />
                        <span>새로고침</span>
                    </button>
                </div>
            </div>

            {alert && (
                <div className={`${styles.alert} ${alert.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                    {alert.message}
                </div>
            )}

            {config && (
                <div>
                    {/* 서비스 상태 카드 */}
                    <div className={styles.statusCard}>
                        <div className={styles.statusLeft}>
                            <div className={`${styles.statusIcon} ${config.is_active ? styles.statusIconActive : ''}`}>
                                {config.is_active ? (
                                    <IconCircleCheck size={28} />
                                ) : (
                                    <IconCircleX size={28} />
                                )}
                            </div>
                            <div>
                                <h2 className={styles.statusTitle}>부의금 카드결제 서비스</h2>
                                <p className={styles.statusDesc}>
                                    {config.is_active
                                        ? '서비스가 활성화되어 있습니다. 모바일 부고장에 조의금 결제 기능이 노출됩니다.'
                                        : '서비스가 비활성화되어 있습니다. 모바일 부고장에 조의금 결제 기능이 표시되지 않습니다.'
                                    }
                                </p>
                                <p className={styles.statusUpdated}>마지막 수정일: {formatDate(config.updated_at)}</p>
                            </div>
                        </div>
                        <button
                            className={`${styles.toggle} ${config.is_active ? styles.toggleActive : ''}`}
                            onClick={handleToggleService}
                            aria-label="서비스 활성화 토글"
                        >
                            <div className={styles.toggleKnob} />
                        </button>
                    </div>

                    {/* 예치금 잔액 카드 */}
                    <div className={styles.depositCard}>
                        <div className={styles.depositHeader}>
                            <h3 className={styles.depositTitle}>
                                <IconWallet size={18} />
                                <span>예치금 잔액</span>
                            </h3>
                            <button onClick={fetchDepositBalance} className={styles.depositRefreshBtn} aria-label="예치금 새로고침">
                                <IconRefresh size={16} className={depositBalance.loading ? styles.spinning : ''} />
                            </button>
                        </div>
                        <div className={styles.depositAmount}>
                            {depositBalance.loading ? '불러오는 중...' : `${depositBalance.remainAmt} 원`}
                        </div>
                        {!depositBalance.loading && (
                            <div className={styles.depositDetail}>
                                총 입금 누적액: {depositBalance.totDptAmt}원 · 총 출금 누적액: {depositBalance.totWdrAmt}원
                            </div>
                        )}
                    </div>

                    {/* 결제 금액 옵션 카드 */}
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>
                            <IconCash size={20} style={{ color: '#d4a84b' }} />
                            <span>결제 금액 옵션</span>
                        </h3>
                        <p className={styles.cardDesc}>조의금 이체 시 부고장에서 선택할 수 있는 간편 금액 버튼들의 노출 여부를 제어합니다.</p>

                        <div className={styles.amountList}>
                            {amounts.map((amt) => (
                                <div key={amt.id} className={`${styles.amountItem} ${amt.is_active ? '' : styles.amountItemInactive}`}>
                                    <div className={styles.amountInfo}>
                                        <span className={styles.amountLabel}>{amt.label}</span>
                                        <span className={styles.amountValue}>{amt.value.toLocaleString()} 원</span>
                                    </div>
                                    <button
                                        className={`${styles.toggleSm} ${amt.is_active ? styles.toggleSmActive : ''}`}
                                        onClick={() => handleToggleAmount(amt)}
                                        aria-label={`${amt.label} 토글`}
                                    >
                                        <div className={styles.toggleKnobSm} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 결제 설정 폼 */}
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>
                            <IconAdjustments size={20} style={{ color: '#d4a84b' }} />
                            <span>결제 설정</span>
                        </h3>
                        <p className={styles.cardDesc}>수수료율 및 결제 금액 한도를 설정합니다.</p>

                        <form onSubmit={handleSaveSettings}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>수수료율 (%)</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className={styles.input}
                                            value={config.fee_rate}
                                            onChange={(e) => setConfig({ ...config, fee_rate: parseFloat(e.target.value) || 0 })}
                                            required
                                        />
                                        <span className={styles.inputSuffix}>%</span>
                                    </div>
                                    <p className={styles.formHelp}>결제 시 적용되는 서비스 이용 수수료율 (PG 수수료 포함)</p>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>1일 결제 한도</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={config.daily_limit}
                                            onChange={(e) => setConfig({ ...config, daily_limit: parseInt(e.target.value) || 0 })}
                                            required
                                        />
                                        <span className={styles.inputSuffix}>원</span>
                                    </div>
                                    <p className={styles.formHelp}>동일인 기준 하루 최대 누적 송금 결제 한도</p>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>최소 결제 금액</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={config.min_amount}
                                            onChange={(e) => setConfig({ ...config, min_amount: parseInt(e.target.value) || 0 })}
                                            required
                                        />
                                        <span className={styles.inputSuffix}>원</span>
                                    </div>
                                    <p className={styles.formHelp}>1회 결제 시 송금할 수 있는 최소 금액</p>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>최대 결제 금액</label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={config.max_amount}
                                            onChange={(e) => setConfig({ ...config, max_amount: parseInt(e.target.value) || 0 })}
                                            required
                                        />
                                        <span className={styles.inputSuffix}>원</span>
                                    </div>
                                    <p className={styles.formHelp}>1회 결제 시 송금할 수 있는 최대 금액</p>
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <button type="submit" className={styles.saveBtn} disabled={saving}>
                                    <IconDeviceFloppy size={18} />
                                    <span>{saving ? '저장 중...' : '설정 저장'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
