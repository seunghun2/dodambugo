'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { B2BIcon } from '@/components/b2b/B2BIcon';
import { unregisterPushNotifications } from '@/lib/push-notifications';
import { Capacitor } from '@capacitor/core';
import styles from './settings.module.css';

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

interface User {
    id: string;
    phone: string;
    company_name: string;
    owner_name: string;
    bank_name?: string;
    account_no?: string;
    account_holder?: string;
    my_referral_code: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [referralCount, setReferralCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // 뷰 전환 상태: 'main' | 'settings_main' | 'alarm' | 'price' | 'info' | 'withdraw' | 'terms' | 'privacy' | 'faq' | 'notice'
    const [view, setView] = useState<'main' | 'settings_main' | 'alarm' | 'price' | 'info' | 'withdraw' | 'terms' | 'privacy' | 'faq' | 'notice'>('main');

    // FAQ 다중 오픈 상태
    const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([]);

    // 공지사항 데이터 및 다중 오픈 상태
    const [notices, setNotices] = useState<any[]>([]);
    const [noticesLoading, setNoticesLoading] = useState(false);
    const [openNoticeIds, setOpenNoticeIds] = useState<string[]>([]);

    const fetchNotices = useCallback(async () => {
        setNoticesLoading(true);
        try {
            const res = await fetch('/api/b2b/notices');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.notices) {
                    setNotices(data.notices);
                }
            }
        } catch (err) {
            console.error('공지사항 로드 오류:', err);
        } finally {
            setNoticesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'notice') {
            fetchNotices();
        }
    }, [view, fetchNotices]);

    // 모달 활성화 상태
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);

    // 비밀번호 변경 모달 상태
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // 계좌 변경 폼 입력값
    const [bankName, setBankName] = useState('');
    const [accountNo, setAccountNo] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [accountVerified, setAccountVerified] = useState(false);
    const [accountVerifyLoading, setAccountVerifyLoading] = useState(false);

    // 토글 스위치 상태값들 (설정 & 알림 용)
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    const [isMournerSatisfy, setIsMournerSatisfy] = useState(true);
    const [isSalesInfo, setIsSalesInfo] = useState(true);

    const [allAlarm, setAllAlarm] = useState(true);
    const [alarmDeceased, setAlarmDeceased] = useState(true);
    const [alarmReward, setAlarmReward] = useState(true);
    const [alarmReferral, setAlarmReferral] = useState(true);
    const [alarmOrder, setAlarmOrder] = useState(true);
    const [alarmDeposit, setAlarmDeposit] = useState(true);
    const [alarmNotice, setAlarmNotice] = useState(true);
    const [alarmEvent, setAlarmEvent] = useState(true);

    // 화환 가격 개별 설정 5종 (할인 금액 입력값 및 판매 여부 토글)
    const [basketDiscount, setBasketDiscount] = useState('0');
    const [basketStatus, setBasketStatus] = useState(true);
    const [wreath3Discount, setWreath3Discount] = useState('0');
    const [wreath3Status, setWreath3Status] = useState(true);
    const [object2Discount, setObject2Discount] = useState('0');
    const [object2Status, setObject2Status] = useState(true);
    const [wreath4Discount, setWreath4Discount] = useState('0');
    const [wreath4Status, setWreath4Status] = useState(true);
    const [riceDiscount, setRiceDiscount] = useState('0');
    const [riceStatus, setRiceStatus] = useState(true);

    // 회원 탈퇴 동의 상태
    const [isWithdrawAgree, setIsWithdrawAgree] = useState(false);

    // 추천인 공유 토스트/복사 알림 상태
    const [shareCopied, setShareCopied] = useState(false);

    const getToken = () => localStorage.getItem('b2b_token');

    const fetchUser = useCallback(async () => {
        const token = getToken();
        if (!token) {
            router.push('/b2b/login');
            return;
        }

        try {
            const res = await fetch('/api/b2b/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                localStorage.removeItem('b2b_token');
                localStorage.removeItem('b2b_user');
                router.push('/b2b/login');
                return;
            }
            if (!res.ok) {
                try {
                    const errData = await res.json();
                    alert(`API 오류 (코드: ${res.status})\n메시지: ${errData.error || res.statusText}`);
                } catch {
                    alert(`API 오류 (코드: ${res.status}, 텍스트: ${res.statusText})`);
                }
                setLoading(false);
                return;
            }
            const data = await res.json();
            if (data.user) {
                setUser(data.user);
                setReferralCount(data.referralCount || 0);
                // 계좌 인풋 초기값 셋팅
                setBankName(data.user.bank_name || '');
                setAccountNo(data.user.account_no || '');
                setAccountHolder(data.user.account_holder || data.user.owner_name || '');
                setAccountVerified(!!data.user.bank_name && !!data.user.account_no);
                
                // 알림 토글 초기화
                setAllAlarm(data.user.alarm_all ?? true);
                setAlarmDeceased(data.user.alarm_deceased ?? true);
                setAlarmReward(data.user.alarm_reward ?? true);
                setAlarmReferral(data.user.alarm_referral ?? true);
                setAlarmOrder(data.user.alarm_order ?? true);
                setAlarmDeposit(data.user.alarm_deposit ?? true);
                setAlarmNotice(data.user.alarm_notice ?? true);
                setAlarmEvent(data.user.alarm_event ?? true);

                // 로컬 스토리지 데이터 최신화
                localStorage.setItem('b2b_user', JSON.stringify(data.user));
            }
        } catch (err: any) {
            console.error('사용자 정보 로드 실패:', err);
            alert(`사용자 정보 로드 실패 예외: ${err?.message || err}`);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchUser();
        // 쿼리 스트링 파싱하여 초기 뷰 설정 (?view=faq 또는 ?view=notice)
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const viewParam = params.get('view');
            if (viewParam === 'faq' || viewParam === 'notice') {
                setView(viewParam as any);
            }
        }
    }, [fetchUser]);

    const handleBackToSettings = () => {
        setView('settings_main');
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/b2b/settings');
        }
    };

    const updateAlarmConfig = async (updates: Record<string, boolean>) => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/b2b/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                setUser((prev: any) => prev ? { ...prev, ...updates } : prev);
            }
        } catch (err) {
            console.error('알림 설정 저장 오류:', err);
        }
    };

    const handleLogout = async () => {
        // 1. 인증 정보가 사라지기 전에 푸시 알림 등록 해제 진행
        if (user && user.id) {
            try {
                await unregisterPushNotifications(user.id);
            } catch (err) {
                console.error('푸시 등록 해제 중 에러:', err);
            }
        }

        localStorage.removeItem('b2b_token');
        localStorage.removeItem('b2b_user');
        sessionStorage.removeItem('b2b_token');
        sessionStorage.removeItem('b2b_user');
        // 클라이언트 쿠키 직접 만료
        document.cookie = 'b2b_token=; path=/; max-age=0;';
        // 서버 쿠키도 삭제 (httpOnly 쿠키 대응)
        try {
            await fetch('/api/b2b/auth', { method: 'DELETE', credentials: 'include' });
        } catch {
            // 쿠키 삭제 실패해도 로그아웃 진행
        }
        router.push('/b2b/login');
    };

    const copyFcmToken = () => {
        const fcm = localStorage.getItem('my_fcm_token');
        if (fcm) {
            navigator.clipboard.writeText(fcm);
            alert(`FCM 기기 토큰이 복사되었습니다!\n\n${fcm}\n\n에이전트 채팅창에 바로 붙여넣어 주세요.`);
        } else {
            alert('FCM 토큰이 아직 기기에 발급되지 않았습니다.\n\n앱을 멀티태스킹 창에서 완전히 종료했다가 다시 실행하여 대시보드 화면을 본 뒤, 다시 시도해 주세요.');
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || !newPasswordConfirm) {
            setPasswordError('비밀번호를 입력해주세요.');
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        if (!user || !user.phone) {
            setPasswordError('사용자 휴대폰 정보가 없습니다.');
            return;
        }

        setPasswordError('');
        try {
            const res = await fetch('/api/b2b/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: user.phone,
                    newPassword: newPassword
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('비밀번호가 성공적으로 변경되었습니다.');
                setShowPasswordModal(false);
                setNewPassword('');
                setNewPasswordConfirm('');
            } else {
                setPasswordError(data.error || '비밀번호 변경에 실패했습니다.');
            }
        } catch {
            setPasswordError('비밀번호 변경 과정에 서버 오류가 발생했습니다.');
        }
    };

    const verifyAndSaveAccount = async () => {
        if (!bankName || !accountNo || !accountHolder) {
            alert('은행, 계좌번호, 예금주를 모두 입력해 주세요.');
            return;
        }
        setAccountVerifyLoading(true);

        try {
            const bank = BANKS.find((b) => b.name === bankName);
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
                    accountNo: accountNo.replace(/[^0-9]/g, ''),
                    holderName: accountHolder,
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
                    bank_name: bankName,
                    account_no: accountNo,
                    account_holder: accountHolder
                })
            });

            if (res.ok) {
                alert('정산 계좌 정보가 안전하게 변경되었습니다.');
                setShowAccountModal(false);
                fetchUser();
            } else {
                alert('계좌 정보 수정에 실패했습니다.');
            }
        } catch {
            alert('오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setAccountVerifyLoading(false);
        }
    };

    // 추천 코드 공유 기능
    const shareCode = async () => {
        if (!user) return;
        const text = `[부고온 파트너] ${user.owner_name}님이 추천 코드를 보냈습니다.\n회원가입 시 추천 코드 [${user.my_referral_code}]를 입력해 주세요.\n\n파트너 앱 다운로드: https://bugoon.co.kr/download/partner`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '부고온 파트너 추천',
                    text: text,
                });
            } catch (err) {
                console.error('공유 실패:', err);
                window.location.href = `sms:?body=${encodeURIComponent(text)}`;
            }
        } else {
            // Fallback: SMS
            window.location.href = `sms:?body=${encodeURIComponent(text)}`;
        }
    };

    // 추천 코드 단순 클립보드 복사
    const copyReferralCode = () => {
        if (!user) return;
        navigator.clipboard.writeText(user.my_referral_code);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
    };

    const formatPhone = (phone: string) => {
        if (!phone) return '';
        const clean = phone.replace(/[^0-9]/g, '');
        if (clean.length === 11) {
            return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
        }
        return phone;
    };

    const maskAccountNo = (acc?: string) => {
        if (!acc) return '등록된 계좌 없음';
        if (acc.length > 6) {
            return acc.slice(0, acc.length - 5) + '*****';
        }
        return acc;
    };

    if (loading) {
        return (
            <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ color: '#8E94A0', fontSize: '14px' }}>로딩 중...</p>
            </div>
        );
    }

    if (!user) return null;

    // ==========================================
    // 1. 마이페이지 메인 뷰 ('main')
    // ==========================================
    if (view === 'main') {
        return (
            <div className={styles.container}>
                {/* 헤더 */}
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/b2b/dashboard')}>
                        <B2BIcon name="chevron-left" size={24} />
                    </button>
                    <span className={styles.headerTitle}>마이페이지</span>
                    <div className={styles.headerRightPlaceholder} />
                </header>

                {/* 내정보 카드 */}
                <div className={styles.profileCard}>
                    <div className={styles.profileInfo}>
                        <span className={styles.profileName}>{user.owner_name} 지도사님</span>
                        <span className={styles.profileCompany}>{user.company_name}</span>
                    </div>
                    <button className={styles.infoEditBtn} onClick={() => setView('info')}>
                        내정보
                    </button>
                </div>

                {/* 계좌 정보 카드 */}
                <div className={styles.accountCard}>
                    <div>
                        <span className={styles.accountLabel}>연결된 정산 계좌</span>
                        <span className={styles.accountInfo}>
                            {user.bank_name ? `${user.bank_name} ${maskAccountNo(user.account_no)}` : '등록된 계좌 없음'}
                        </span>
                    </div>
                    <button className={styles.changeBtn} onClick={() => {
                        setBankName(user.bank_name || '');
                        setAccountNo(user.account_no || '');
                        setAccountHolder(user.account_holder || user.owner_name || '');
                        setAccountVerified(!!user.bank_name && !!user.account_no);
                        setShowAccountModal(true);
                    }}>
                        {user.bank_name ? '변경하기' : '등록하기'}
                    </button>
                </div>

                {/* 주요 메뉴 그리드 */}
                <section className={styles.menuSection}>
                    <h3 className={styles.sectionTitle}>주요메뉴</h3>
                    <div className={styles.menuGrid}>
                        <div className={styles.gridCard} onClick={() => router.push('/b2b/create')}>
                            <span className={styles.gridLabel}>부고{"\n"}만들기</span>
                            <div className={styles.gridIcon}>
                                <B2BIcon name="doc-create" size={20} className={styles.gridIconSvg} />
                            </div>
                        </div>

                        <div className={styles.gridCard} onClick={() => router.push('/b2b/manage')}>
                            <span className={styles.gridLabel}>부고{"\n"}조회</span>
                            <div className={styles.gridIcon}>
                                <B2BIcon name="doc-search" size={20} className={styles.gridIconSvg} />
                            </div>
                        </div>

                        <div className={styles.gridCard} onClick={() => router.push('/b2b/manage')}>
                            <span className={styles.gridLabel}>답례{"\n"}인사</span>
                            <div className={styles.gridIcon}>
                                <B2BIcon name="reply" size={20} className={styles.gridIconSvg} />
                            </div>
                        </div>

                        <div className={styles.gridCard} onClick={() => router.push('/b2b/faq')}>
                            <span className={styles.gridLabel}>공지{"\n"}사항</span>
                            <div className={styles.gridIcon}>
                                <B2BIcon name="bell" size={20} className={styles.gridIconSvg} />
                            </div>
                        </div>

                        <div className={styles.gridCard} onClick={() => router.push('/b2b/wallet')}>
                            <span className={styles.gridLabel}>장부{"\n"}관리</span>
                            <div className={styles.gridIcon}>
                                <B2BIcon name="wallet" size={20} className={styles.gridIconSvg} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 마이페이지 리스트 그룹 */}
                <section className={styles.myPageSection}>
                    <h3 className={styles.sectionTitle}>마이페이지</h3>
                    <div className={styles.listGroup}>
                        <div className={styles.listItem} onClick={() => setView('info')}>
                            <span className={styles.listLabel}>내정보</span>
                            <span className={styles.listArrow}>
                                <B2BIcon name="chevron-right" size={18} />
                            </span>
                        </div>
                        <div className={styles.listItem} onClick={() => router.push('/b2b/wallet')}>
                            <span className={styles.listLabel}>적립내역</span>
                            <span className={styles.listArrow}>
                                <B2BIcon name="chevron-right" size={18} />
                            </span>
                        </div>
                        <div className={styles.listItem} onClick={() => setShowReferralModal(true)}>
                            <span className={styles.listLabel}>추천회원</span>
                            <span className={styles.listArrow}>
                                <B2BIcon name="chevron-right" size={18} />
                            </span>
                        </div>
                        <div className={styles.listItem} onClick={() => setView('settings_main')}>
                            <span className={styles.listLabel}>설정</span>
                            <span className={styles.listArrow}>
                                <B2BIcon name="chevron-right" size={18} />
                            </span>
                        </div>
                    </div>
                </section>

                {/* 내정보 팝업 모달 */}
                {showInfoModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowInfoModal(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>파트너 내정보</h3>
                                <button className={styles.closeBtn} onClick={() => setShowInfoModal(false)}>×</button>
                            </div>
                            <div className={styles.modalBody}>
                                <div className={styles.inputGroup}>
                                    <div className={styles.inputField}>
                                        <span className={styles.inputLabel}>성명</span>
                                        <input type="text" className={styles.textInput} value={user.owner_name} disabled />
                                    </div>
                                    <div className={styles.inputField}>
                                        <span className={styles.inputLabel}>소속 상조회사</span>
                                        <input type="text" className={styles.textInput} value={user.company_name} disabled />
                                    </div>
                                    <div className={styles.inputField}>
                                        <span className={styles.inputLabel}>휴대폰 번호</span>
                                        <input type="text" className={styles.textInput} value={formatPhone(user.phone)} disabled />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 정산 계좌 변경 모달 */}
                {showAccountModal && (
                    <div className={styles.bottomSheetOverlay} onClick={() => setShowAccountModal(false)}>
                        <div className={styles.bottomSheetContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>정산 계좌 정보 설정</h3>
                                <button className={styles.closeBtn} onClick={() => setShowAccountModal(false)}>×</button>
                            </div>
                            <div className={styles.modalBody}>
                                <div className={styles.inputGroup}>
                                    <div className={styles.inputField}>
                                        <span className={styles.inputLabel}>은행</span>
                                        <select
                                            className={styles.textInput}
                                            value={bankName}
                                            onChange={(e) => {
                                                setBankName(e.target.value);
                                                setAccountVerified(false);
                                            }}
                                            style={{ backgroundColor: '#fff', appearance: 'auto' }}
                                        >
                                            <option value="">은행을 선택해 주세요</option>
                                            {BANKS.map((b) => (
                                                <option key={b.code} value={b.name}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.inputField}>
                                        <span className={styles.inputLabel}>계좌번호</span>
                                        <input 
                                            type="text" 
                                            className={styles.textInput} 
                                            placeholder={bankName ? getPlaceholder(bankName) : '계좌번호 입력'} 
                                            value={bankName ? formatAccountNo(accountNo, bankName) : accountNo}
                                            onChange={(e) => {
                                                setAccountNo(e.target.value.replace(/[^0-9]/g, ''));
                                                setAccountVerified(false);
                                            }}
                                        />
                                    </div>
                                    <div className={styles.inputField}>
                                        <span className={styles.inputLabel}>예금주</span>
                                        <input 
                                            type="text" 
                                            className={styles.textInput} 
                                            placeholder="예금주 성명" 
                                            value={accountHolder}
                                            onChange={(e) => {
                                                setAccountHolder(e.target.value);
                                                setAccountVerified(false);
                                            }}
                                        />
                                    </div>

                                    <button
                                        className={styles.confirmBtn}
                                        onClick={verifyAndSaveAccount}
                                        disabled={accountVerifyLoading || !bankName || !accountNo || !accountHolder}
                                    >
                                        {accountVerifyLoading ? '실명 확인 중...' : '실명 확인 후 저장하기'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 추천회원 모달 */}
                {showReferralModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowReferralModal(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>추천 파트너 목록</h3>
                                <button className={styles.closeBtn} onClick={() => setShowReferralModal(false)}>×</button>
                            </div>
                            <div className={styles.modalBody}>
                                <div className={styles.referralStats}>
                                    <span>내가 추천한 파트너 수</span>
                                    <span className={styles.referralCount}>{referralCount}명</span>
                                </div>
                                
                                {referralCount > 0 ? (
                                    <div className={styles.referralList}>
                                        <div className={styles.referralItem}>
                                            <div>
                                                <span className={styles.refName}>이*우</span>
                                                <span className={styles.refCompany}>도담상조</span>
                                            </div>
                                            <span className={styles.refDate}>2026.06.18</span>
                                        </div>
                                        <div className={styles.referralItem}>
                                            <div>
                                                <span className={styles.refName}>김*수</span>
                                                <span className={styles.refCompany}>한마음상조</span>
                                            </div>
                                            <span className={styles.refDate}>2026.06.12</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>아직 추천한 파트너 회원이 없습니다.</div>
                                )}

                                <div className={styles.inputGroup} style={{ marginTop: '20px' }}>
                                    <div className={styles.inputField}>
                                        <span className={styles.inputLabel}>나의 추천인 코드</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input 
                                                type="text" 
                                                className={styles.textInput} 
                                                style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px' }} 
                                                value={user.my_referral_code} 
                                                disabled 
                                            />
                                            <button 
                                                className={styles.confirmBtn} 
                                                style={{ width: '80px', margin: 0 }} 
                                                onClick={copyReferralCode}
                                            >
                                                {shareCopied ? '복사됨' : '복사'}
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        className={styles.confirmBtn} 
                                        style={{ backgroundColor: '#2E7238', color: '#ffffff' }}
                                        onClick={shareCode}
                                    >
                                        추천 링크 공유하기 (SMS)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 비밀번호 변경 모달 */}
                {showPasswordModal && (
                    <div className={styles.bottomSheetOverlay} onClick={() => setShowPasswordModal(false)}>
                        <div className={styles.bottomSheetContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>비밀번호 변경</h3>
                                <button className={styles.closeBtn} onClick={() => setShowPasswordModal(false)}>×</button>
                            </div>
                            <div className={styles.modalBody}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '13px', color: '#666' }}>새 비밀번호</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="8자 이상의 새 비밀번호"
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '13px', color: '#666' }}>비밀번호 확인</label>
                                        <input
                                            type="password"
                                            value={newPasswordConfirm}
                                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                            placeholder="비밀번호 재입력"
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                    {passwordError && (
                                        <p style={{ color: '#E74C3C', fontSize: '12px', margin: 0 }}>
                                            {passwordError}
                                        </p>
                                    )}
                                </div>
                                <button 
                                    className={styles.confirmBtn} 
                                    style={{ backgroundColor: '#2E7238', color: '#ffffff' }}
                                    onClick={handleUpdatePassword}
                                >
                                    변경하기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // 2. 설정 세부 메인 뷰 ('settings_main')
    // ==========================================
    if (view === 'settings_main') {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setView('main')}>
                        <B2BIcon name="chevron-left" size={24} />
                    </button>
                    <span className={styles.headerTitle}>설정</span>
                    <div className={styles.headerRightPlaceholder} />
                </header>

                <div className={styles.settingsSection}>
                    {/* 알림 설정 그룹 */}
                    <div className={styles.groupTitle}>알림</div>
                    <div className={styles.rowItem} style={{ cursor: 'pointer' }} onClick={() => setView('alarm')}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>알림 설정</span>
                        </div>
                        <span className={styles.listArrow}>
                            <B2BIcon name="chevron-right" size={18} />
                        </span>
                    </div>

                    {/* 메인 화면 그룹 */}
                    <div className={styles.groupTitle}>메인화면</div>
                    <div className={styles.rowItem}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>적립 예정 금액</span>
                            <span className={styles.rowDesc}>메인 화면 대시보드에 적립 금액을 기본으로 표시합니다.</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input 
                                type="checkbox" 
                                checked={isBalanceVisible} 
                                onChange={() => setIsBalanceVisible(!isBalanceVisible)} 
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {/* 부고장 그룹 */}
                    <div className={styles.groupTitle}>부고장</div>
                    <div className={styles.rowItem}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>상주 만족도</span>
                            <span className={styles.rowDesc}>모바일 부고장 뷰에 만족도 평가 영역을 노출합니다.</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input 
                                type="checkbox" 
                                checked={isMournerSatisfy} 
                                onChange={() => setIsMournerSatisfy(!isMournerSatisfy)} 
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                    <div className={styles.rowItem}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>판매정보</span>
                            <span className={styles.rowDesc}>부고장에 부착될 화환 및 근조 상품 판매 정보를 노출합니다.</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input 
                                type="checkbox" 
                                checked={isSalesInfo} 
                                onChange={() => setIsSalesInfo(!isSalesInfo)} 
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                    <div className={styles.rowItem} style={{ cursor: 'pointer' }} onClick={() => setView('price')}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>화환 판매가격 설정</span>
                            <span className={styles.rowDesc}>고객에게 노출될 화환의 할인 금액 및 판매 여부를 관리합니다.</span>
                        </div>
                        <span className={styles.listArrow}>
                            <B2BIcon name="chevron-right" size={18} />
                        </span>
                    </div>

                    {/* 보안 및 인증 그룹 */}
                    <div className={styles.groupTitle}>보안 및 인증</div>
                    <div className={styles.rowItem} style={{ cursor: 'pointer' }} onClick={() => alert('간편 비밀번호 변경 기능이 곧 준비됩니다.')}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>간편 비밀번호 변경</span>
                        </div>
                        <span className={styles.listArrow}>
                            <B2BIcon name="chevron-right" size={18} />
                        </span>
                    </div>

                    {/* 고객지원 그룹 */}
                    <div className={styles.groupTitle}>고객지원</div>
                    <div className={styles.rowItem} style={{ cursor: 'pointer' }} onClick={() => setView('notice')}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>공지사항</span>
                        </div>
                        <span className={styles.listArrow}>
                            <B2BIcon name="chevron-right" size={18} />
                        </span>
                    </div>
                    <div className={styles.rowItem} style={{ cursor: 'pointer' }} onClick={() => setView('faq')}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>자주 묻는 질문</span>
                        </div>
                        <span className={styles.listArrow}>
                            <B2BIcon name="chevron-right" size={18} />
                        </span>
                    </div>
                    <div className={styles.rowItem} style={{ cursor: 'pointer' }} onClick={() => router.push('/b2b/inquiry')}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>1:1 문의하기</span>
                        </div>
                        <span className={styles.listArrow}>
                            <B2BIcon name="chevron-right" size={18} />
                        </span>
                    </div>

                    {/* 정보 그룹 */}
                    <div className={styles.groupTitle}>정보</div>
                    <div className={styles.rowItem} style={{ cursor: 'pointer' }} onClick={() => setView('terms')}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>약관 및 정책</span>
                        </div>
                        <span className={styles.listArrow}>
                            <B2BIcon name="chevron-right" size={18} />
                        </span>
                    </div>
                    <div className={styles.rowItem} style={{ cursor: 'pointer' }} onClick={() => setView('privacy')}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>개인정보처리방침</span>
                        </div>
                        <span className={styles.listArrow}>
                            <B2BIcon name="chevron-right" size={18} />
                        </span>
                    </div>
                    <div className={styles.rowItem} style={{ cursor: 'pointer' }} onClick={() => setView('withdraw')}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>회원탈퇴</span>
                        </div>
                        <span className={styles.listArrow}>
                            <B2BIcon name="chevron-right" size={18} />
                        </span>
                    </div>

                    {/* 로그아웃 버튼 */}
                    <div className={styles.logoutBtnArea} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#8b95a1', marginBottom: '4px', fontWeight: 500 }}>
                            현재 접속 환경: {Capacitor.isNativePlatform() ? '📱 실물 네이티브 앱 (수신 가능)' : '🌐 모바일 웹 브라우저 (푸시 불가)'}
                        </div>
                        <button className={styles.logoutBtn} onClick={handleLogout}>
                            로그아웃
                        </button>
                        <button 
                            onClick={copyFcmToken}
                            style={{
                                fontSize: '11px',
                                color: '#8b95a1',
                                backgroundColor: 'transparent',
                                border: 'none',
                                textDecoration: 'underline',
                                padding: '6px 0',
                                cursor: 'pointer'
                            }}
                        >
                            (디버그) 내 기기 푸시 토큰 복사
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 3. 알림 설정 뷰 ('alarm')
    // ==========================================
    if (view === 'alarm') {
        const toggleAllAlarm = () => {
            const val = !allAlarm;
            setAllAlarm(val);
            setAlarmDeceased(val);
            setAlarmReward(val);
            setAlarmReferral(val);
            setAlarmOrder(val);
            setAlarmDeposit(val);
            setAlarmNotice(val);
            setAlarmEvent(val);
            
            updateAlarmConfig({
                alarm_all: val,
                alarm_deceased: val,
                alarm_reward: val,
                alarm_referral: val,
                alarm_order: val,
                alarm_deposit: val,
                alarm_notice: val,
                alarm_event: val
            });
        };

        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={handleBackToSettings}>
                        <B2BIcon name="chevron-left" size={24} />
                    </button>
                    <span className={styles.headerTitle}>알림 설정</span>
                    <div className={styles.headerRightPlaceholder} />
                </header>

                <div className={styles.settingsSection}>
                    <div className={styles.rowItem} style={{ borderBottom: '2px solid #e9ecef', paddingBottom: '20px' }}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel} style={{ fontSize: '16px', fontWeight: '700' }}>전체 알림 받기</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input type="checkbox" checked={allAlarm} onChange={toggleAllAlarm} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={styles.groupTitle}>서비스 알림</div>
                    <div className={styles.rowItem}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>고인/상주 정보</span>
                            <span className={styles.rowDesc}>부고 신규 등록 및 정보 수정 시 알림</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input type="checkbox" checked={alarmDeceased} onChange={() => {
                                const val = !alarmDeceased;
                                setAlarmDeceased(val);
                                updateAlarmConfig({ alarm_deceased: val });
                            }} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={styles.rowItem}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>적립금 지급</span>
                            <span className={styles.rowDesc}>화환 판매 및 이벤트 성공으로 정산금 적립 시 알림</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input type="checkbox" checked={alarmReward} onChange={() => {
                                const val = !alarmReward;
                                setAlarmReward(val);
                                updateAlarmConfig({ alarm_reward: val });
                            }} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={styles.rowItem}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>추천인 정보</span>
                            <span className={styles.rowDesc}>새로운 회원이 추천 코드를 사용해 가입 시 알림</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input type="checkbox" checked={alarmReferral} onChange={() => {
                                const val = !alarmReferral;
                                setAlarmReferral(val);
                                updateAlarmConfig({ alarm_referral: val });
                            }} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={styles.rowItem}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>화환 주문</span>
                            <span className={styles.rowDesc}>부고장에 부착된 링크로 화환 주문 결제 완료 시 알림</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input type="checkbox" checked={alarmOrder} onChange={() => {
                                const val = !alarmOrder;
                                setAlarmOrder(val);
                                updateAlarmConfig({ alarm_order: val });
                            }} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={styles.rowItem}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>정산 입금</span>
                            <span className={styles.rowDesc}>환급 출금 신청이 최종 승인 및 완료 시 알림</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input type="checkbox" checked={alarmDeposit} onChange={() => {
                                const val = !alarmDeposit;
                                setAlarmDeposit(val);
                                updateAlarmConfig({ alarm_deposit: val });
                            }} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={styles.rowItem}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>공지사항</span>
                            <span className={styles.rowDesc}>새로운 주요 정책 변경이나 전체 공지 등록 시 알림</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input type="checkbox" checked={alarmNotice} onChange={() => {
                                const val = !alarmNotice;
                                setAlarmNotice(val);
                                updateAlarmConfig({ alarm_notice: val });
                            }} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={styles.groupTitle}>이벤트 혜택 알림</div>
                    <div className={styles.rowItem}>
                        <div className={styles.rowLeft}>
                            <span className={styles.rowLabel}>이벤트 혜택</span>
                            <span className={styles.rowDesc}>파트너 대상의 프로모션, 정산금 추가 적립 혜택 알림</span>
                        </div>
                        <label className={styles.toggleSwitch}>
                            <input type="checkbox" checked={alarmEvent} onChange={() => {
                                const val = !alarmEvent;
                                setAlarmEvent(val);
                                updateAlarmConfig({ alarm_event: val });
                            }} />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 4. 화환 판매가격 설정 뷰 ('price')
    // ==========================================
    if (view === 'price') {
        const handleSavePrice = () => {
            alert('화환 상품 설정 정보가 업데이트되었습니다.');
            setView('settings_main');
        };

        return (
            <div className={styles.container} style={{ paddingBottom: '80px' }}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setView('settings_main')}>
                        <B2BIcon name="chevron-left" size={24} />
                    </button>
                    <span className={styles.headerTitle}>화환 판매가격 설정</span>
                    <div className={styles.headerRightPlaceholder} />
                </header>

                <div className={styles.priceIntroBox}>
                    <h4 className={styles.priceIntroTitle}>부고장 내 화환 판매 가격을{"\n"}설정하실 수 있습니다.</h4>
                    <p className={styles.priceIntroDesc}>
                        {`* 판매가격은 지역별 또는 날씨 상황에 따라 변동될 수 있습니다.
* 장례식장 별 판매가능한 화환이 변경될 수 있습니다.
* 할인금액 만큼 회원님의 받는 수수료가 감소합니다.
* 부고장에서 선택한 기업의 판매 설정 시, 회원님의 수수료는 적용되지 않습니다.`}
                    </p>
                </div>

                <div className={styles.wreathList}>
                    {/* 근조바구니 */}
                    <div className={styles.wreathCard}>
                        <div className={styles.wreathImg}>💐</div>
                        <div className={styles.wreathInfo}>
                            <span className={styles.wreathName}>근조바구니</span>
                            <span className={styles.wreathPriceRange}>판매가격: 99,500원 ~ 119,000원</span>
                            <span className={styles.wreathDiscountLimit}>할인가능 가격: 30,000원</span>
                            
                            <div className={styles.discountInputRow}>
                                <div className={styles.discountInputWrapper}>
                                    <span className={styles.discountText}>할인금액</span>
                                    <input 
                                        type="text" 
                                        className={styles.discountInput} 
                                        value={basketDiscount}
                                        onChange={(e) => setBasketDiscount(e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                    <span className={styles.discountText}>원</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className={styles.discountText}>판매여부</span>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={basketStatus} onChange={() => setBasketStatus(!basketStatus)} />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 근조 3단 */}
                    <div className={styles.wreathCard}>
                        <div className={styles.wreathImg}>🏵️</div>
                        <div className={styles.wreathInfo}>
                            <span className={styles.wreathName}>근조 3단</span>
                            <span className={styles.wreathPriceRange}>판매가격: 109,500원 ~ 159,000원</span>
                            <span className={styles.wreathDiscountLimit}>할인가능 가격: 55,000원</span>
                            
                            <div className={styles.discountInputRow}>
                                <div className={styles.discountInputWrapper}>
                                    <span className={styles.discountText}>할인금액</span>
                                    <input 
                                        type="text" 
                                        className={styles.discountInput} 
                                        value={wreath3Discount}
                                        onChange={(e) => setWreath3Discount(e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                    <span className={styles.discountText}>원</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className={styles.discountText}>판매여부</span>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={wreath3Status} onChange={() => setWreath3Status(!wreath3Status)} />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 오브제 2단 */}
                    <div className={styles.wreathCard}>
                        <div className={styles.wreathImg}>🌹</div>
                        <div className={styles.wreathInfo}>
                            <span className={styles.wreathName}>오브제 2단</span>
                            <span className={styles.wreathPriceRange}>판매가격: 149,000원 ~ 199,000원</span>
                            <span className={styles.wreathDiscountLimit}>할인가능 가격: 65,000원</span>
                            
                            <div className={styles.discountInputRow}>
                                <div className={styles.discountInputWrapper}>
                                    <span className={styles.discountText}>할인금액</span>
                                    <input 
                                        type="text" 
                                        className={styles.discountInput} 
                                        value={object2Discount}
                                        onChange={(e) => setObject2Discount(e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                    <span className={styles.discountText}>원</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className={styles.discountText}>판매여부</span>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={object2Status} onChange={() => setObject2Status(!object2Status)} />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 근조 4단 특대 */}
                    <div className={styles.wreathCard}>
                        <div className={styles.wreathImg}>🌸</div>
                        <div className={styles.wreathInfo}>
                            <span className={styles.wreathName}>근조 4단 특대</span>
                            <span className={styles.wreathPriceRange}>판매가격: 189,000원 ~ 209,000원</span>
                            <span className={styles.wreathDiscountLimit}>할인가능 가격: 80,000원</span>
                            
                            <div className={styles.discountInputRow}>
                                <div className={styles.discountInputWrapper}>
                                    <span className={styles.discountText}>할인금액</span>
                                    <input 
                                        type="text" 
                                        className={styles.discountInput} 
                                        value={wreath4Discount}
                                        onChange={(e) => setWreath4Discount(e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                    <span className={styles.discountText}>원</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className={styles.discountText}>판매여부</span>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={wreath4Status} onChange={() => setWreath4Status(!wreath4Status)} />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 근조 쌀화환 10kg */}
                    <div className={styles.wreathCard}>
                        <div className={styles.wreathImg}>🌾</div>
                        <div className={styles.wreathInfo}>
                            <span className={styles.wreathName}>근조 쌀화환 10kg</span>
                            <span className={styles.wreathPriceRange}>판매가격: 149,000원 ~ 169,000원</span>
                            <span className={styles.wreathDiscountLimit}>할인가능 가격: 55,000원</span>
                            
                            <div className={styles.discountInputRow}>
                                <div className={styles.discountInputWrapper}>
                                    <span className={styles.discountText}>할인금액</span>
                                    <input 
                                        type="text" 
                                        className={styles.discountInput} 
                                        value={riceDiscount}
                                        onChange={(e) => setRiceDiscount(e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                    <span className={styles.discountText}>원</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className={styles.discountText}>판매여부</span>
                                    <label className={styles.toggleSwitch}>
                                        <input type="checkbox" checked={riceStatus} onChange={() => setRiceStatus(!riceStatus)} />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 밀착 고정 저장하기 버튼 */}
                <div className={styles.bottomFixedBtnArea}>
                    <button className={styles.bottomFixedBtn} onClick={handleSavePrice}>
                        저장하기
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // 5. 내정보 상세 뷰 ('info')
    // ==========================================
    if (view === 'info') {
        const handleResignCompany = () => {
            if (confirm('소속 상조회사 정보를 정말로 해제하시겠습니까?\n해제 시 파트너 혜택 및 정산율 설정이 일반 등급으로 재조정될 수 있습니다.')) {
                alert('소속 회사 해제 신청이 접수되었습니다.');
            }
        };

        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setView('main')}>
                        <B2BIcon name="chevron-left" size={24} />
                    </button>
                    <span className={styles.headerTitle}>내정보</span>
                    <button className={styles.backBtn} onClick={() => setView('settings_main')}>
                        <B2BIcon name="menu" size={24} />
                    </button>
                </header>

                {/* 프로필 이미지 정보 */}
                <div className={styles.profileDetailSection}>
                    <div className={styles.avatarWrapper}>
                        <div className={styles.avatarCircle}>
                            <B2BIcon name="user" size={48} color="#adb5bd" />
                        </div>
                        <button className={styles.avatarCameraBtn} onClick={() => alert('프로필 사진 변경 기능이 곧 지원됩니다.')}>
                            <B2BIcon name="camera" size={14} color="#ffffff" strokeWidth={2} />
                        </button>
                    </div>
                    <div className={styles.profileDetailMeta}>
                        <h4 className={styles.profileDetailName}>{user.owner_name}</h4>
                        <p className={styles.profileDetailCompany}>{user.company_name}</p>
                    </div>
                </div>

                {/* 상세 내역 영역 */}
                <div className={styles.infoDetailSection}>
                    <div className={styles.infoGroupTitle}>기본정보</div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>추천코드</span>
                        <div className={styles.detailValueRow}>
                            <span className={styles.detailValueCode}>{user.my_referral_code}</span>
                            <button className={styles.detailActionBtn} onClick={copyReferralCode}>
                                {shareCopied ? '복사됨' : '복사하기'}
                            </button>
                        </div>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>소속</span>
                        <div className={styles.detailValueRow}>
                            <span className={styles.detailValueText}>{user.company_name}</span>
                            <button className={styles.detailActionBtn} onClick={handleResignCompany}>
                                탈퇴하기
                            </button>
                        </div>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>비밀번호</span>
                        <div className={styles.detailValueRow}>
                            <span className={styles.detailValueText}>••••</span>
                            <button className={styles.detailActionBtn} onClick={() => { setPasswordError(''); setShowPasswordModal(true); }}>
                                변경하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 6. 회원탈퇴 상세 뷰 ('withdraw')
    // ==========================================
    if (view === 'withdraw') {
        const handleWithdrawSubmit = () => {
            if (!isWithdrawAgree) return;
            if (confirm('부고온 파트너 서비스를 정말로 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
                alert('회원 탈퇴가 최종 완료되었습니다. 그동안 부고온 파트너 서비스를 이용해주셔서 대단히 감사합니다.');
                handleLogout();
            }
        };

        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setView('settings_main')}>
                        <B2BIcon name="chevron-left" size={24} />
                    </button>
                    <span className={styles.headerTitle}>회원탈퇴</span>
                    <div className={styles.headerRightPlaceholder} />
                </header>

                <div className={styles.withdrawBody}>
                    <h3 className={styles.withdrawMainTitle}>그동안 부고온을{"\n"}이용해주셔서 감사합니다.</h3>
                    <p className={styles.withdrawSubDesc}>
                        탈퇴하시면 이용중인 부고온의 모든 정보가 폐기되며, 폐기된 데이터는 복구가 불가능합니다.
                    </p>

                    <div className={styles.withdrawWarnBox}>
                        <p className={styles.withdrawWarnItem}>• 고객, 관리, 프로필 등 모든 정보가 삭제됩니다.</p>
                        <p className={styles.withdrawWarnItem}>• 적립금을 미리 출금하셨는지 확인하세요.</p>
                    </div>

                    <div className={styles.withdrawAgreeRow} onClick={() => setIsWithdrawAgree(!isWithdrawAgree)}>
                        <div className={`${styles.customCheckbox} ${isWithdrawAgree ? styles.checked : ''}`}>
                            {isWithdrawAgree && <B2BIcon name="check-circle" size={14} color="#ffffff" strokeWidth={2.5} />}
                        </div>
                        <span className={styles.withdrawAgreeText}>안내사항을 모두 확인하였으며, 이에 동의합니다.</span>
                    </div>

                    <button 
                        className={`${styles.withdrawBtn} ${isWithdrawAgree ? styles.active : ''}`}
                        disabled={!isWithdrawAgree}
                        onClick={handleWithdrawSubmit}
                    >
                        탈퇴하기
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // 7. 약관 및 정책 뷰 ('terms')
    // ==========================================
    if (view === 'terms') {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setView('settings_main')}>
                        <B2BIcon name="chevron-left" size={24} />
                    </button>
                    <span className={styles.headerTitle}>약관 및 정책</span>
                    <div className={styles.headerRightPlaceholder} />
                </header>

                <div className={styles.docViewBody}>
                    <h3 className={styles.docTitle}>부고온 파트너 서비스 이용약관</h3>
                    <div className={styles.docContentBox}>
                        <h4>제 1 조 (목적)</h4>
                        <p>본 약관은 주식회사 부고온(이하 "회사")이 제공하는 부고온 B2B 파트너 서비스(이하 "서비스")를 이용함에 있어 회사와 파트너 회원(이하 "회원") 간의 권리, 의무, 책임사항 및 정산금 지급 절차를 규정함을 목적으로 합니다.</p>
                        
                        <h4>제 2 조 (서비스의 정의)</h4>
                        <p>1. "서비스"란 회원이 모바일 부고장을 제작 및 유포하고 이를 통해 화환 등의 근조 상품 매출이 발생할 시 수수료를 적립 및 환급해주는 B2B 비즈니스 파트너 플랫폼을 말합니다.</p>
                        <p>2. "적립금"이란 부고장 배송 완료 및 회사의 수익 배분 정책에 따라 회원에게 가상 지갑 형태로 지급되는 포인트를 뜻합니다.</p>

                        <h4>제 3 조 (회원의 의무)</h4>
                        <p>1. 회원은 서비스 가입 신청 시 실제 가입자 정보와 업종 증빙 정보를 사실대로 작성해야 하며, 부정한 정보 등록으로 인한 정산금 미지급 등의 모든 책임은 회원에게 있습니다.</p>
                        <p>2. 회원은 적립금 정산 시 부과되는 세금(원천징수 3.3%) 신고를 위해 주민등록번호 등 소득증빙 세무 신고 목적의 필수 정보를 필수적으로 제출해야 합니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 8. 개인정보처리방침 뷰 ('privacy')
    // ==========================================
    if (view === 'privacy') {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => setView('settings_main')}>
                        <B2BIcon name="chevron-left" size={24} />
                    </button>
                    <span className={styles.headerTitle}>개인정보처리방침</span>
                    <div className={styles.headerRightPlaceholder} />
                </header>

                <div className={styles.docViewBody}>
                    <h3 className={styles.docTitle}>개인정보 처리방침</h3>
                    <div className={styles.docContentBox}>
                        <h4>1. 개인정보의 수집 및 이용 목적</h4>
                        <p>부고온 파트너 서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 관련 법령에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                        <p>- 회원 가입 의사 확인, 본인 식별/인증, 회원자격 유지/관리, 정산 지급을 위한 본인 확인, 세무 당국 신고 대행(원천세 3.3% 신고)</p>

                        <h4>2. 수집하는 개인정보의 항목</h4>
                        <p>- 필수항목: 성명, 연락처, 소속 상조회사명, 정산 계좌정보(은행명, 예금주, 계좌번호)</p>
                        <p>- 정산출금 및 세무신고 신청 시: 주민등록번호(또는 외국인등록번호), 주민등록증/운전면허증 정보</p>

                        <h4>3. 개인정보의 보유 및 이용기간</h4>
                        <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 회원으로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                        <p>- 서비스 회원탈퇴 시 즉시 파기. 단, 관련 세법 및 국세기본법에 의한 정산 증빙용 거래기록은 5년간 보관함.</p>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 9. 자주묻는질문 뷰 ('faq')
    // ==========================================
    if (view === 'faq') {
        const toggleFaq = (index: number) => {
            setOpenFaqIndexes(prev =>
                prev.includes(index)
                    ? prev.filter(i => i !== index)
                    : [...prev, index]
            );
        };

        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={handleBackToSettings}>
                        <B2BIcon name="chevron-left" size={24} />
                    </button>
                    <span className={styles.headerTitle}>자주 묻는 질문</span>
                    <button className={styles.menuBtn} onClick={() => alert('메뉴 기능이 준비 중입니다.')}>
                        <B2BIcon name="menu" size={24} />
                    </button>
                </header>

                <div className={styles.faqList}>
                    {b2bFaqData.map((item, index) => {
                        const isActive = openFaqIndexes.includes(index);
                        return (
                            <div
                                key={index}
                                className={`${styles.faqItem} ${isActive ? styles.faqItemActive : ''}`}
                            >
                                <div className={styles.faqQuestion} onClick={() => toggleFaq(index)}>
                                    <div className={styles.questionMain}>
                                        <span className={styles.qPrefix}>Q</span>
                                        <span className={styles.questionText}>{item.question}</span>
                                    </div>
                                    <span className={styles.faqIcon} style={{ transform: isActive ? 'rotate(180deg)' : 'none', display: 'flex', alignItems: 'center' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </span>
                                </div>
                                <div className={styles.faqAnswer} style={{ maxHeight: isActive ? '300px' : '0' }}>
                                    <div className={styles.answerContent}>
                                        <div className={styles.aBadge}>A</div>
                                        <p className={styles.answerText}>{item.answer}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ==========================================
    // 10. 공지사항 뷰 ('notice')
    // ==========================================
    if (view === 'notice') {
        const toggleNotice = (id: string) => {
            setOpenNoticeIds(prev =>
                prev.includes(id)
                    ? prev.filter(item => item !== id)
                    : [...prev, id]
            );
        };

        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={handleBackToSettings}>
                        <B2BIcon name="chevron-left" size={24} />
                    </button>
                    <span className={styles.headerTitle}>공지사항</span>
                    <div className={styles.headerRightPlaceholder} />
                </header>

                <div className={styles.noticeList}>
                    {noticesLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                            로딩 중...
                        </div>
                    ) : notices.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                            등록된 공지사항이 없습니다.
                        </div>
                    ) : (
                        notices.map((item) => {
                            const isOpen = openNoticeIds.includes(item.id);
                            const noticeDate = item.created_at
                                ? new Date(item.created_at).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                  }).replace(/\. /g, '-').replace(/\./, '')
                                : '';

                            return (
                                <div
                                    key={item.id}
                                    className={`${styles.noticeWrapper} ${isOpen ? styles.noticeItemActive : ''}`}
                                    style={{ borderBottom: '1px solid #f1f3f5' }}
                                >
                                    <div
                                        className={styles.noticeItem}
                                        onClick={() => toggleNotice(item.id)}
                                        style={{ borderBottom: 'none' }}
                                    >
                                        <div className={styles.noticeMain}>
                                            <div className={styles.titleRow}>
                                                {item.is_fixed && <span className={styles.noticeBadge}>공지</span>}
                                                <span className={styles.noticeTitle}>{item.title}</span>
                                            </div>
                                            <span className={styles.noticeDate}>{noticeDate}</span>
                                        </div>
                                        <span className={`${styles.arrowIcon} ${isOpen ? styles.arrowIconActive : ''}`}>
                                            <B2BIcon name="chevron-right" size={20} />
                                        </span>
                                    </div>
                                    <div className={`${styles.noticeContentPanel} ${isOpen ? styles.noticeContentPanelActive : ''}`}>
                                        <div className={styles.noticeContent}>
                                            {item.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    return null;
}

interface FAQItem {
  question: string;
  answer: string;
}

const b2bFaqData: FAQItem[] = [
  {
    question: '부고장 내에 화환보내기 버튼이 보이지 않습니다.',
    answer: '부고장 내 하단의 근조화환 보내기 버튼은 발인 진행이 되지 않은 부고에서만 구매가 가능합니다.\n또한 부고장 생성 시, \'근조화환 받지 않기\'를 설정하였는지 확인해주세요.',
  },
  {
    question: '부고장 내에 부의금 보내기에 카드결제를 안보이게 할 수 있나요?',
    answer: '현재 카드 결제 기능만 별도로 숨기는 기능은 제공되지 않습니다.\n부고장 생성 시, 상주님의 계좌번호를 입력하지 않으면 카드 결제 또한 노출되지 않으니, 이 점 참고하여 이용해 주세요.',
  },
  {
    question: '부고장 내에 상주 자리 앞부분을 공란으로 맞추려면 어떻게 해야하나요?',
    answer: 'ㅁ 을 입력해주시면 공란으로 변경되어 노출됩니다.',
  },
  {
    question: '계좌번호 입력을 했는데 부고장(부의금보내기)에 안보여요',
    answer: '계좌번호 정보는 부고장 생성 단계에서 노출 여부를 선택하거나, 상주별 발송 설정 화면에서 계좌 노출 규칙(내 계좌만 노출, 모든 계좌 노출 등)을 개별 지정하여 표시되도록 설정해야 합니다.',
  },
  {
    question: '부고온 고객센터가 어떻게 되나요?',
    answer: '현재 고객센터는 유선 상담을 운영하고 있지 않으며, 1:1문의만 지원하고 있습니다.',
  },
  {
    question: '내 정보에 고유번호는 무엇인가요?',
    answer: '고유번호는 고객님의 추천코드로 부고온에서 랜덤으로 부여하고 있습니다.\n가입자가 추천인 입력시 회원님의 고유번호 입력 하시면 됩니다.',
  },
  {
    question: '적립금은 언제 지급되나요?',
    answer: '적립금은 상품 결제 기준 24시간 후에 적립됩니다.',
  },
  {
    question: '환급신청을 했는데 언제 지급되나요?',
    answer: '적립금(포인트) 환급은 당일 지급을 원칙으로 하고 있습니다.\n자세한 내용은 부고온 공지사항을 참조하시길 바랍니다.',
  },
  {
    question: '환급신청 시 인증 과정에서 오류가 나요',
    answer: '신청자와 입력하신 예금주 정보가 동일한지 먼저 확인 부탁드립니다.\n또한, 발급일자는 가장 최근에 발급 받으신 주민등록증 하단의 날짜를 입력해 주세요.\n이는 원활한 소득공제 처리를 위한 절차이오니, 번거로우시더라도 양해 부탁드립니다.',
  },
  {
    question: '장례식장 별로 다른 화환이 나와요. 화환 상품 추가 가능한가요?',
    answer: '지역 또는 장례식장 별 반입 가능한 화환이 달라 내부적으로 노출 가능한 화환을 제한하고 있습니다.',
  },
];

interface NoticeItem {
  id: number;
  title: string;
  date: string;
  isFixed: boolean;
}

const noticeData: NoticeItem[] = [
  {
    id: 1,
    title: '[공지] 등급별 포인트 지급 누락 관련 안내',
    date: '2025/10/31',
    isFixed: true,
  },
  {
    id: 2,
    title: '화환 판매금액 설정 기능 추가 안내',
    date: '2025/05/22',
    isFixed: true,
  },
  {
    id: 3,
    title: '부고온 화환 수수료 안내',
    date: '2025/05/16',
    isFixed: true,
  },
  {
    id: 4,
    title: '[공지] 부고온 등급별 혜택 변경',
    date: '2025/06/17',
    isFixed: true,
  },
  {
    id: 5,
    title: '[공지] 빈소현황판 AI 분석 기능 안내',
    date: '2025/03/18',
    isFixed: true,
  },
  {
    id: 6,
    title: '[공지] PC버전 로그인 계정 생성 방법 안내',
    date: '2025/02/04',
    isFixed: true,
  },
  {
    id: 7,
    title: '[공지] 답례글 관련 안내',
    date: '2024/09/26',
    isFixed: false,
  },
  {
    id: 8,
    title: '[공지] 실시간 환급금 자동이체 시행 안내',
    date: '2024/11/20',
    isFixed: false,
  },
];
