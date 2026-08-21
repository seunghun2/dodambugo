'use client';

import { useState, useEffect } from 'react';
import { IconDeviceFloppy } from '@tabler/icons-react';
import styles from './settings.module.css';

export default function SettingsPage() {
    const [wreathReward, setWreathReward] = useState('');
    const [referralBonus, setReferralBonus] = useState('');
    const [minWithdrawal, setMinWithdrawal] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = typeof window !== 'undefined' ? (localStorage.getItem('b2b_token') || sessionStorage.getItem('admin_token') || '') : '';
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch('/api/b2b/admin/settings', { headers });
                if (!res.ok) {
                    throw new Error('설정 정보를 가져오는데 실패했습니다.');
                }
                const data = await res.json();
                if (data.success) {
                    setWreathReward(String(data.settings.wreath_reward_amount));
                    setReferralBonus(String(data.settings.referral_bonus_amount));
                    setMinWithdrawal(String(data.settings.min_withdrawal_amount));
                } else {
                    setError(data.error || '에러가 발생했습니다.');
                }
            } catch (err: any) {
                setError(err.message || '네트워크 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const wReward = parseInt(wreathReward);
        const rBonus = parseInt(referralBonus);
        const mWithdrawal = parseInt(minWithdrawal);

        if (isNaN(wReward) || wReward < 0 || isNaN(rBonus) || rBonus < 0 || isNaN(mWithdrawal) || mWithdrawal < 0) {
            setError('모든 설정값은 0 이상의 정수로 입력해주세요.');
            return;
        }

        setSaving(true);
        try {
            const token = typeof window !== 'undefined' ? (localStorage.getItem('b2b_token') || sessionStorage.getItem('admin_token') || '') : '';
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/b2b/admin/settings', {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    wreath_reward_amount: wReward,
                    referral_bonus_amount: rBonus,
                    min_withdrawal_amount: mWithdrawal
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '설정 저장에 실패했습니다.');
            }

            const data = await res.json();
            if (data.success) {
                setSuccess('설정이 성공적으로 저장되었습니다.');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || '오류가 발생했습니다.');
            }
        } catch (err: any) {
            setError(err.message || '네트워크 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#64748b', fontSize: '14px' }}>
                설정 정보를 불러오는 중...
            </div>
        );
    }

    return (
        <div>
            <div className={styles.titleArea}>
                <h1 className={styles.title}>B2B 어드민 설정</h1>
                <p className={styles.subtitle}>B2B 서비스 운영에 필요한 정산 및 수당 지급 기준을 설정합니다.</p>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', maxWidth: '600px' }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{ padding: '16px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', maxWidth: '600px' }}>
                    {success}
                </div>
            )}

            <div className={styles.card}>
                <form onSubmit={handleSave} className={styles.form}>
                    {/* 화환 판매 수당 */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>기본 화환 판매 수당</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="number"
                                className={styles.input}
                                value={wreathReward}
                                onChange={(e) => setWreathReward(e.target.value)}
                                placeholder="예: 10000"
                                required
                            />
                            <span className={styles.unit}>원</span>
                        </div>
                        <p className={styles.description}>소속 상조회사가 없는 개인/프리랜서 장례지도사님이 화환을 판매했을 때 지급되는 기본 수당입니다.</p>
                    </div>

                    {/* 추천 보너스 수당 */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>추천인 보너스 수당</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="number"
                                className={styles.input}
                                value={referralBonus}
                                onChange={(e) => setReferralBonus(e.target.value)}
                                placeholder="예: 2000"
                                required
                            />
                            <span className={styles.unit}>원</span>
                        </div>
                        <p className={styles.description}>지도사가 추천하여 가입한 추천 파트너(하위)가 화환을 판매했을 때 상위 파트너에게 적립되는 보너스 수당입니다.</p>
                    </div>

                    {/* 최소 출금 신청 금액 */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>최소 출금 신청 가능 금액</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="number"
                                className={styles.input}
                                value={minWithdrawal}
                                onChange={(e) => setMinWithdrawal(e.target.value)}
                                placeholder="예: 50000"
                                required
                            />
                            <span className={styles.unit}>원</span>
                        </div>
                        <p className={styles.description}>파트너가 적립금 환급 신청을 할 수 있는 최소 잔여 예치금 기준 금액입니다.</p>
                    </div>

                    <button type="submit" className={styles.saveBtn} disabled={saving}>
                        <IconDeviceFloppy stroke={1.5} size={18} />
                        <span>{saving ? '저장 중...' : '설정 저장'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
