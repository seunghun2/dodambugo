'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface CondolenceConfig {
    id: number;
    is_active: boolean;
    fee_rate: number;
    daily_limit: number;
    min_amount: number;
    max_amount: number;
    updated_at: string;
}

export default function AdminCondolenceSettingsPage() {
    const [config, setConfig] = useState<CondolenceConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // 예치금 잔액
    const [depositBalance, setDepositBalance] = useState<{
        remainAmt: string;
        totDptAmt: string;
        totWdrAmt: string;
        loading: boolean;
    }>({ remainAmt: '-', totDptAmt: '-', totWdrAmt: '-', loading: true });

    useEffect(() => {
        fetchConfig();
        fetchDepositBalance();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('condolence_config')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            console.error('설정 조회 오류:', error);
        } else {
            setConfig(data);
        }
        setLoading(false);
    };

    const fetchDepositBalance = async () => {
        setDepositBalance(prev => ({ ...prev, loading: true }));
        try {
            const res = await fetch('/api/condolence/transfer/balance');
            const data = await res.json();
            if (data.success) {
                setDepositBalance({
                    remainAmt: Number(data.data.remainAmt).toLocaleString(),
                    totDptAmt: Number(data.data.totDptAmt).toLocaleString(),
                    totWdrAmt: Number(data.data.totWdrAmt).toLocaleString(),
                    loading: false,
                });
            } else {
                setDepositBalance(prev => ({ ...prev, loading: false }));
            }
        } catch (e) {
            setDepositBalance(prev => ({ ...prev, loading: false }));
        }
    };

    const handleToggle = async () => {
        if (!config) return;
        const newActive = !config.is_active;

        const { error } = await supabase
            .from('condolence_config')
            .update({ is_active: newActive, updated_at: new Date().toISOString() })
            .eq('id', config.id);

        if (error) {
            showToast('변경 실패');
        } else {
            setConfig({ ...config, is_active: newActive });
            showToast(newActive ? '조의금 서비스가 활성화되었습니다' : '조의금 서비스가 비활성화되었습니다');
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);

        const { error } = await supabase
            .from('condolence_config')
            .update({
                fee_rate: config.fee_rate,
                daily_limit: config.daily_limit,
                min_amount: config.min_amount,
                max_amount: config.max_amount,
                updated_at: new Date().toISOString(),
            })
            .eq('id', config.id);

        if (error) {
            showToast('저장 실패');
        } else {
            showToast('설정이 저장되었습니다');
        }
        setSaving(false);
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="admin-pc">
            <AdminSidebar />

            <main className="admin-main">
                <header className="admin-top-header">
                    <h1>조의금 서비스 설정</h1>
                    <div className="header-actions">
                        <button onClick={fetchConfig} className="btn-refresh">
                            <span className="material-symbols-outlined">refresh</span>
                            새로고침
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#94a3b8' }}>
                        <span className="material-symbols-outlined spinning">progress_activity</span>
                    </div>
                ) : config ? (
                    <div style={{ padding: '0 24px' }}>
                        {/* 서비스 상태 카드 */}
                        <div className="cs-status-card">
                            <div className="cs-status-left">
                                <div className="cs-status-icon">
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                                        {config.is_active ? 'check_circle' : 'cancel'}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="cs-status-title">
                                        부의금 카드결제 서비스
                                    </h2>
                                    <p className="cs-status-desc">
                                        {config.is_active
                                            ? '서비스가 활성화되어 있습니다. 부고장에서 카드결제 버튼이 표시됩니다.'
                                            : '서비스가 비활성화되어 있습니다. 카드결제 버튼이 숨겨집니다.'
                                        }
                                    </p>
                                    <p className="cs-status-updated">
                                        마지막 변경: {formatDate(config.updated_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                className={`cs-toggle ${config.is_active ? 'active' : ''}`}
                                onClick={handleToggle}
                            >
                                <div className="cs-toggle-knob" />
                            </button>
                        </div>

                        {/* 예치금 잔액 */}
                        <div className="cs-deposit-card">
                            <div className="cs-deposit-header">
                                <h3>
                                    <span className="material-symbols-outlined">account_balance</span>
                                    예치금 잔액
                                </h3>
                                <button onClick={fetchDepositBalance} className="cs-deposit-refresh">
                                    <span className={`material-symbols-outlined ${depositBalance.loading ? 'spinning' : ''}`}>refresh</span>
                                </button>
                            </div>
                            <div className="cs-deposit-amount">
                                {depositBalance.loading ? '...' : `${depositBalance.remainAmt}원`}
                            </div>
                            {!depositBalance.loading && (
                                <div className="cs-deposit-detail">
                                    총 입금 {depositBalance.totDptAmt}원 · 총 출금 {depositBalance.totWdrAmt}원
                                </div>
                            )}
                        </div>

                        {/* 설정 폼 */}
                        <div className="cs-settings-card">
                            <h3 className="cs-card-title">
                                <span className="material-symbols-outlined">tune</span>
                                결제 설정
                            </h3>

                            <div className="cs-form-grid">
                                <div className="cs-form-group">
                                    <label>수수료율 (%)</label>
                                    <div className="cs-input-wrapper">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={config.fee_rate}
                                            onChange={(e) => setConfig({ ...config, fee_rate: parseFloat(e.target.value) || 0 })}
                                        />
                                        <span className="cs-input-suffix">%</span>
                                    </div>
                                    <p className="cs-form-help">결제자에게 부과되는 수수료율 (PG 수수료 2.9% 포함)</p>
                                </div>

                                <div className="cs-form-group">
                                    <label>1일 결제 한도</label>
                                    <div className="cs-input-wrapper">
                                        <input
                                            type="number"
                                            step="100000"
                                            value={config.daily_limit}
                                            onChange={(e) => setConfig({ ...config, daily_limit: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="cs-input-suffix">원</span>
                                    </div>
                                    <p className="cs-form-help">동일 결제자 기준 1일 누적 결제 한도</p>
                                </div>

                                <div className="cs-form-group">
                                    <label>최소 결제 금액</label>
                                    <div className="cs-input-wrapper">
                                        <input
                                            type="number"
                                            step="10000"
                                            value={config.min_amount}
                                            onChange={(e) => setConfig({ ...config, min_amount: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="cs-input-suffix">원</span>
                                    </div>
                                </div>

                                <div className="cs-form-group">
                                    <label>최대 결제 금액</label>
                                    <div className="cs-input-wrapper">
                                        <input
                                            type="number"
                                            step="100000"
                                            value={config.max_amount}
                                            onChange={(e) => setConfig({ ...config, max_amount: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="cs-input-suffix">원</span>
                                    </div>
                                </div>
                            </div>

                            <div className="cs-form-actions">
                                <button className="cs-btn-save" onClick={handleSave} disabled={saving}>
                                    {saving ? '저장 중...' : '설정 저장'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        설정을 불러올 수 없습니다
                    </div>
                )}
            </main>

            {/* 토스트 */}
            {toast && (
                <div className="cs-toast">{toast}</div>
            )}

            <style jsx>{`
                .cs-status-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: white;
                    border-radius: 16px;
                    padding: 28px 32px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                    margin-bottom: 20px;
                }
                .cs-status-left {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .cs-status-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: ${config?.is_active ? '#dcfce7' : '#fee2e2'};
                    color: ${config?.is_active ? '#16a34a' : '#dc2626'};
                }
                .cs-status-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 4px;
                }
                .cs-status-desc {
                    font-size: 14px;
                    color: #64748b;
                    margin: 0 0 4px;
                }
                .cs-status-updated {
                    font-size: 12px;
                    color: #94a3b8;
                    margin: 0;
                }
                .cs-toggle {
                    width: 56px;
                    height: 30px;
                    border-radius: 15px;
                    border: none;
                    background: #e2e8f0;
                    cursor: pointer;
                    position: relative;
                    transition: background 0.3s;
                    flex-shrink: 0;
                }
                .cs-toggle.active {
                    background: #22c55e;
                }
                .cs-toggle-knob {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: white;
                    position: absolute;
                    top: 3px;
                    left: 3px;
                    transition: transform 0.3s;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                .cs-toggle.active .cs-toggle-knob {
                    transform: translateX(26px);
                }

                .cs-deposit-card {
                    background: linear-gradient(135deg, #059669, #047857);
                    border-radius: 16px;
                    padding: 24px 32px;
                    color: white;
                    margin-bottom: 20px;
                }
                .cs-deposit-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }
                .cs-deposit-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.85);
                    margin: 0;
                }
                .cs-deposit-refresh {
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.7);
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                }
                .cs-deposit-refresh:hover { color: white; }
                .cs-deposit-amount {
                    font-size: 32px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                .cs-deposit-detail {
                    font-size: 13px;
                    color: rgba(255,255,255,0.7);
                }

                .cs-settings-card {
                    background: white;
                    border-radius: 16px;
                    padding: 28px 32px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                    margin-bottom: 20px;
                }
                .cs-card-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 24px;
                }
                .cs-form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }
                .cs-form-group label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    margin-bottom: 8px;
                }
                .cs-input-wrapper {
                    display: flex;
                    align-items: center;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    overflow: hidden;
                    transition: border-color 0.2s;
                }
                .cs-input-wrapper:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
                }
                .cs-input-wrapper input {
                    border: none;
                    padding: 12px 16px;
                    font-size: 15px;
                    width: 100%;
                    outline: none;
                    color: #1e293b;
                }
                .cs-input-suffix {
                    padding: 12px 16px;
                    font-size: 14px;
                    color: #94a3b8;
                    background: #f8fafc;
                    border-left: 1px solid #e2e8f0;
                    white-space: nowrap;
                }
                .cs-form-help {
                    font-size: 12px;
                    color: #94a3b8;
                    margin: 6px 0 0;
                }
                .cs-form-actions {
                    margin-top: 28px;
                    display: flex;
                    justify-content: flex-end;
                }
                .cs-btn-save {
                    padding: 12px 32px;
                    background: #D4A84B;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .cs-btn-save:hover { background: #c49a3f; }
                .cs-btn-save:disabled {
                    background: #cbd5e1;
                    cursor: not-allowed;
                }

                .cs-toast {
                    position: fixed;
                    bottom: 32px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1e293b;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-size: 14px;
                    z-index: 9999;
                    animation: fadeInUp 0.3s;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
        </div>
    );
}
