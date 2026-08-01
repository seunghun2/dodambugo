'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { B2BIcon } from '@/components/b2b/B2BIcon';
import { unregisterPushNotifications } from '@/lib/push-notifications';
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
    avatar_url?: string;
    company_id?: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [referralCount, setReferralCount] = useState(0);
    const [referralList, setReferralList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // 뷰 전환 상태: 'main' | 'settings_main' | 'alarm' | 'price' | 'info' | 'withdraw' | 'terms' | 'privacy' | 'faq' | 'notice'
    const [view, setView] = useState<'main' | 'settings_main' | 'alarm' | 'price' | 'info' | 'withdraw' | 'terms' | 'privacy' | 'faq' | 'notice'>('main');

    // 상조 담당자용 정산서 조회 관련 상태
    const [settleSummary, setSettleSummary] = useState<any>({ pending_amount: 0, completed_amount: 0, total_count: 0 });
    const [settleMonthlyList, setSettleMonthlyList] = useState<any[]>([]);
    const [settleDetails, setSettleDetails] = useState<any[]>([]);
    const [settleSelectedMonth, setSettleSelectedMonth] = useState<string | null>(null);
    const [settleLoading, setSettleLoading] = useState(false);
    const [settleDetailLoading, setSettleDetailLoading] = useState(false);
    const [companyInfo, setCompanyInfo] = useState<any>(null);

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

    // 상조 담당자용 정산 내역 fetch 로직
    const fetchSettleMonthlyDetail = useCallback(async (yearMonth: string) => {
        if (!user || !user.company_id) return;
        setSettleDetailLoading(true);
        setSettleSelectedMonth(yearMonth);
        try {
            const token = localStorage.getItem('b2b_token');
            const res = await fetch(`/api/b2b/admin/companies/settlements?companyId=${user.company_id}&yearMonth=${yearMonth}`, {
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSettleDetails(data.settlements || []);
                    if (data.company) {
                        setCompanyInfo(data.company);
                    }
                }
            }
        } catch (err) {
            console.error('상세 정산 내역 로드 오류:', err);
        } finally {
            setSettleDetailLoading(false);
        }
    }, [user]);

    const fetchSettleMonthlyList = useCallback(async () => {
        if (!user || !user.company_id) return;
        setSettleLoading(true);
        try {
            const token = localStorage.getItem('b2b_token');
            const res = await fetch(`/api/b2b/admin/companies/settlements?companyId=${user.company_id}`, {
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSettleSummary(data.summary);
                    setSettleMonthlyList(data.monthlyList || []);
                    if (data.company) {
                        setCompanyInfo(data.company);
                    }
                    if (data.monthlyList && data.monthlyList.length > 0) {
                        fetchSettleMonthlyDetail(data.monthlyList[0].month);
                    }
                }
            }
        } catch (err) {
            console.error('월별 정산 장부 로드 오류:', err);
        } finally {
            setSettleLoading(false);
        }
    }, [user, fetchSettleMonthlyDetail]);


    // 모달 활성화 상태
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);

    // 비밀번호 변경 모달 상태
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // 소속 상조회사 변경 모달 상태
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [companyList, setCompanyList] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [customCompanyName, setCustomCompanyName] = useState('');
    const [companyLoading, setCompanyLoading] = useState(false);

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

    const handleAvatarClick = () => {
        if (uploadingAvatar) return;
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        const token = getToken();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/b2b/profile/upload', {
                method: 'POST',
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                },
                body: formData,
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json();
                throw new Error(errData.error || '이미지 업로드에 실패했습니다.');
            }

            const { url: avatarUrl } = await uploadRes.json();

            const updateRes = await fetch('/api/b2b/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({ avatar_url: avatarUrl }),
            });

            if (!updateRes.ok) {
                const errData = await updateRes.json();
                throw new Error(errData.error || '프로필 정보 갱신에 실패했습니다.');
            }

            if (user) {
                const updatedUser = { ...user, avatar_url: avatarUrl };
                setUser(updatedUser);
                localStorage.setItem('b2b_user', JSON.stringify(updatedUser));
            }
            alert('프로필 사진이 성공적으로 변경되었습니다.');
        } catch (err: any) {
            console.error('프로필 사진 변경 실패:', err);
            alert(err.message || '사진 변경 중 오류가 발생했습니다.');
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getToken = () => localStorage.getItem('b2b_token');

    const handleDeleteAvatar = async () => {
        if (!user?.avatar_url) return;
        if (!confirm('프로필 이미지를 삭제하시겠습니까?')) return;

        const token = getToken();
        setUploadingAvatar(true);

        try {
            const updateRes = await fetch('/api/b2b/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({ avatar_url: null }),
            });

            if (!updateRes.ok) {
                const errData = await updateRes.json();
                throw new Error(errData.error || '프로필 이미지 삭제에 실패했습니다.');
            }

            if (user) {
                const updatedUser = { ...user, avatar_url: undefined };
                setUser(updatedUser);
                localStorage.setItem('b2b_user', JSON.stringify(updatedUser));
            }
            alert('프로필 사진이 삭제되었습니다.');
        } catch (err: any) {
            console.error('프로필 사진 삭제 실패:', err);
            alert(err.message || '사진 삭제 중 오류가 발생했습니다.');
        } finally {
            setUploadingAvatar(false);
        }
    };

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
                setReferralList(data.referralList || []);
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

    const handleUpdatePassword = async () => {
        if (!currentPassword) {
            setPasswordError('기존 비밀번호를 입력해주세요.');
            return;
        }

        if (!newPassword || !newPasswordConfirm) {
            setPasswordError('새 비밀번호를 입력해주세요.');
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            setPasswordError('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('새 비밀번호는 8자 이상이어야 합니다.');
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
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('비밀번호가 성공적으로 변경되었습니다.');
                setShowPasswordModal(false);
                setCurrentPassword('');
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
        const shareUrl = `https://bugoon.maeumbugo.co.kr/b2b/signup?ref=${user.my_referral_code}`;
        const appStoreUrl = `https://apps.apple.com/kr/app/%EB%B6%80%EA%B3%A0%EC%98%A8%ED%94%8C%EB%9F%AC%EC%8A%A4/id6786073225`;
        const text = `[부고온 파트너] ${user.owner_name}님이 초대한 추천 코드가 도착했습니다.\n\n회원가입 시 추천 코드 [${user.my_referral_code}]를 입력해 주세요.\n\n▶ 파트너 추천 회원가입 바로가기:\n${shareUrl}\n\n▶ 부고온플러스 아이폰(iOS) 앱 다운로드:\n${appStoreUrl}`;
        
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
                        <span className={styles.profileName}>{user.owner_name} 장례지도사님</span>
                        <span className={styles.profileCompany}>{(!user.company_name || user.company_name === '부고온 파트너 상조' || user.company_name === '개인') ? '개인 장례지도사' : user.company_name}</span>
                    </div>
                    <button className={styles.infoEditBtn} onClick={() => setView('info')}>
                        내정보
                    </button>
                </div>

                {/* 계좌 정보 카드 */}
                <div className={styles.accountCard}>
                    <div>
                        <span className={styles.accountLabel}>수당 입금 계좌</span>
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
                            <span className={styles.gridLabel}>적립{"\n"}내역</span>
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
                                            type="tel" 
                                            inputMode="numeric"
                                            pattern="[0-9]*"
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
                                {referralList && referralList.length > 0 ? (
                                    <div className={styles.referralList}>
                                        {referralList.map((refItem: any) => {
                                            const rawName = refItem.owner_name || '파트너';
                                            const masked = rawName.length <= 2 ? rawName[0] + '*' : rawName[0] + '*'.repeat(rawName.length - 2) + rawName[rawName.length - 1];
                                            const dt = refItem.created_at ? new Date(refItem.created_at) : new Date();
                                            const formattedDate = `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;

                                            return (
                                                <div key={refItem.id} className={styles.referralItem}>
                                                    <div>
                                                        <span className={styles.refName}>{masked}</span>
                                                        <span className={styles.refCompany}>{refItem.company_name}</span>
                                                    </div>
                                                    <span className={styles.refDate}>{formattedDate}</span>
                                                </div>
                                            );
                                        })}
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
                                        <label style={{ fontSize: '13px', color: '#666' }}>기존 비밀번호</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="기존 비밀번호 입력"
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
                                        <label style={{ fontSize: '13px', color: '#666' }}>새 비밀번호 확인</label>
                                        <input
                                            type="password"
                                            value={newPasswordConfirm}
                                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                            placeholder="새 비밀번호 재입력"
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
                    <div className={styles.rowItem} style={{ cursor: 'pointer' }} onClick={() => router.push('/b2b/notice')}>
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
                    <div className={styles.logoutBtnArea}>
                        <button className={styles.logoutBtn} onClick={handleLogout}>
                            로그아웃
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
        const fetchCompanies = async () => {
            try {
                const res = await fetch('/api/b2b/companies');
                const data = await res.json();
                if (data.success && data.companies) {
                    setCompanyList(data.companies);
                }
            } catch (err) {
                console.error('상조회사 목록 조회 오류:', err);
            }
        };

        const handleResignCompany = async () => {
            if (!user) return;
            if (confirm(`현재 소속 정보(${user.company_name || '개인'})를 해제하시겠습니까?\n해제 후 개인 파트너(프리랜서 장례지도사) 상태로 전환되며, 필요 시 새로운 소속 회사를 등록하실 수 있습니다.`)) {
                try {
                    const token = getToken();
                    const res = await fetch('/api/b2b/me', {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            company_name: '개인',
                            company_id: null,
                        }),
                    });
                    if (res.ok) {
                        alert('소속 회사가 해제되어 개인 파트너 상태로 전환되었습니다.');
                        fetchUser();
                    } else {
                        alert('소속 해제 처리에 실패했습니다.');
                    }
                } catch {
                    alert('서버 통신 중 오류가 발생했습니다.');
                }
            }
        };

        const handleOpenCompanyModal = () => {
            fetchCompanies();
            setSelectedCompanyId('');
            setCustomCompanyName('');
            setShowCompanyModal(true);
        };

        const handleSaveCompany = async () => {
            if (!selectedCompanyId) {
                alert('소속 상조회사를 선택해 주세요.');
                return;
            }

            let targetCompanyName = '';
            let targetCompanyId: string | null = null;

            if (selectedCompanyId === 'custom') {
                if (!customCompanyName.trim()) {
                    alert('상조회사명을 입력해 주세요.');
                    return;
                }
                targetCompanyName = customCompanyName.trim();
            } else {
                const found = companyList.find(c => String(c.id) === String(selectedCompanyId));
                if (found) {
                    targetCompanyName = found.name;
                    targetCompanyId = found.id;
                } else {
                    targetCompanyName = selectedCompanyId;
                }
            }

            try {
                setCompanyLoading(true);
                const token = getToken();
                const res = await fetch('/api/b2b/me', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        company_name: targetCompanyName,
                        company_id: targetCompanyId,
                    }),
                });
                if (res.ok) {
                    alert(`소속 상조회사가 [${targetCompanyName}](으)로 성공적으로 변경되었습니다!`);
                    setShowCompanyModal(false);
                    fetchUser();
                } else {
                    alert('소속 변경 처리에 실패했습니다.');
                }
            } catch {
                alert('서버 통신 중 오류가 발생했습니다.');
            } finally {
                setCompanyLoading(false);
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
                            {user.avatar_url ? (
                                <img src={user.avatar_url} className={styles.avatarImage} alt="profile" />
                            ) : (
                                <B2BIcon name="user" size={48} color="#adb5bd" />
                            )}
                        </div>
                        {user.avatar_url ? (
                            /* 사진이 등록되어 있을 때는 X (삭제) 버튼 */
                            <button 
                                className={styles.avatarActionBtn} 
                                onClick={handleDeleteAvatar} 
                                title="프로필 사진 삭제" 
                                disabled={uploadingAvatar}
                            >
                                <B2BIcon name="close" size={14} color="#ffffff" strokeWidth={2.5} />
                            </button>
                        ) : (
                            /* 사진이 없을 때는 카메라 (등록) 버튼 */
                            <button 
                                className={styles.avatarActionBtn} 
                                onClick={handleAvatarClick} 
                                title="프로필 사진 등록" 
                                disabled={uploadingAvatar}
                            >
                                <B2BIcon name="camera" size={14} color="#ffffff" strokeWidth={2} />
                            </button>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>
                    <div className={styles.profileDetailMeta}>
                        <h4 className={styles.profileDetailName}>{user.owner_name}</h4>
                        <p className={styles.profileDetailCompany}>{(!user.company_name || user.company_name === '부고온 파트너 상조' || user.company_name === '개인') ? '개인 장례지도사' : user.company_name}</p>
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
                        <span className={styles.detailLabel}>연락처</span>
                        <div className={styles.detailValueRow}>
                            <span className={styles.detailValueText}>{formatPhone(user.phone)}</span>
                        </div>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>소속</span>
                        <div className={styles.detailValueRow}>
                            <span className={styles.detailValueText}>
                                {user.company_name && user.company_name !== '개인' && user.company_name !== '부고온 파트너 상조'
                                    ? user.company_name 
                                    : '소속 없음 (개인 장례지도사)'}
                            </span>
                            {user.company_name && user.company_name !== '개인' && user.company_name !== '부고온 파트너 상조' ? (
                                <button className={styles.detailActionBtn} onClick={handleResignCompany}>
                                    소속 해제
                                </button>
                            ) : (
                                <button className={styles.detailActionBtn} onClick={handleOpenCompanyModal}>
                                    소속 등록
                                </button>
                            )}
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
                                        <label style={{ fontSize: '13px', color: '#666' }}>기존 비밀번호</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="기존 비밀번호 입력"
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
                                        <label style={{ fontSize: '13px', color: '#666' }}>새 비밀번호 확인</label>
                                        <input
                                            type="password"
                                            value={newPasswordConfirm}
                                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                            placeholder="새 비밀번호 재입력"
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

                {/* 상조회사 소속 변경/등록 모달 */}
                {showCompanyModal && (
                    <div className={styles.bottomSheetOverlay} onClick={() => setShowCompanyModal(false)}>
                        <div className={styles.bottomSheetContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>소속 상조회사 선택</h3>
                                <button className={styles.closeBtn} onClick={() => setShowCompanyModal(false)}>×</button>
                            </div>
                            <div className={styles.modalBody}>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                                    새로 소속된 상조회사를 선택하시면 파트너 정보가 재설정됩니다.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>상조회사 선택</label>
                                        <select
                                            className={styles.textInput}
                                            value={selectedCompanyId}
                                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                                            style={{ backgroundColor: '#fff', appearance: 'auto', padding: '10px', fontSize: '14px' }}
                                        >
                                            <option value="">상조회사를 선택해 주세요</option>
                                            {companyList.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                            <option value="custom">기타 (직접 입력)</option>
                                        </select>
                                    </div>
                                    {selectedCompanyId === 'custom' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>회사명 입력</label>
                                            <input
                                                type="text"
                                                className={styles.textInput}
                                                placeholder="상조회사명을 입력해 주세요"
                                                value={customCompanyName}
                                                onChange={(e) => setCustomCompanyName(e.target.value)}
                                                style={{ padding: '10px', fontSize: '14px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <button 
                                    className={styles.confirmBtn} 
                                    style={{ backgroundColor: '#2E7238', color: '#ffffff' }}
                                    onClick={handleSaveCompany}
                                    disabled={companyLoading || !selectedCompanyId}
                                >
                                    {companyLoading ? '저장 중...' : '소속 변경 완료'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // 6. 회원탈퇴 상세 뷰 ('withdraw')
    // ==========================================
    if (view === 'withdraw') {
        const handleWithdrawSubmit = async () => {
            if (!isWithdrawAgree) return;
            if (!confirm('부고온 파트너 서비스를 정말로 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;

            try {
                const token = localStorage.getItem('b2b_token');
                const res = await fetch('/api/b2b/withdraw', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({
                        userId: user?.id,
                        phone: user?.phone
                    })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    alert('회원 탈퇴가 최종 완료되었습니다. 그동안 부고온 파트너 서비스를 이용해 주셔서 대단히 감사합니다.');
                    handleLogout();
                } else {
                    alert(data.error || '회원 탈퇴 처리 중 오류가 발생했습니다.');
                }
            } catch {
                alert('회원 탈퇴 처리 중 시스템 오류가 발생했습니다.');
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
                    <h3 className={styles.docTitle}>마음부고 B2B 파트너(부고온) 서비스 이용약관</h3>
                    <div className={styles.docContentBox}>
                        <h4>제 1 조 (목적)</h4>
                        <p>본 약관은 마음부고(이하 "회사")가 제공하는 부고온 B2B 파트너 서비스(이하 "서비스")의 이용과 관련하여 회사와 파트너 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                        
                        <h4>제 2 조 (정의)</h4>
                        <p>1. "서비스"라 함은 회사가 제공하는 B2B 파트너용 모바일 부고장 작성, 공유, 관리, 화환 주문 유치 및 수당(정산금) 지급 대시보드 등의 서비스를 말합니다.</p>
                        <p>2. "파트너"라 함은 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 파트너 서비스를 이용하는 자(장례지도사, 상조회사 임직원, 법인/개인사업자, 프리랜서 등)를 말합니다.</p>
                        <p>3. "부고장"이라 함은 파트너가 서비스를 통해 작성한 모바일 장례 안내 정보를 말합니다.</p>
                        <p>4. "수당(정산금)"이라 함은 파트너가 생성한 부고장을 통해 화환 주문 등 유료 서비스 매출이 발생하였을 때, 회사가 사전에 고지한 기준에 따라 파트너에게 지급하는 금액을 말합니다.</p>
                        <p>5. "추천인 보너스"라 함은 추천한 신규 파트너 가입 유치에 따라 추가 지급되는 보상금을 말합니다.</p>

                        <h4>제 3 조 (약관의 명시와 개정)</h4>
                        <p>1. 회사는 본 약관의 내용을 파트너가 쉽게 알 수 있도록 서비스 초기 화면 또는 설정 메뉴에 게시합니다.</p>
                        <p>2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
                        <p>3. 회사가 약관을 개정할 경우, 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전(불리한 변경은 30일 이전)부터 공지합니다.</p>
                        <p>4. 파트너가 개정약관의 적용에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>

                        <h4>제 4 조 (서비스의 제공)</h4>
                        <p>회사는 B2B 파트너 전용 모바일 부고장 작성, 화환 주문 유치 및 실시간 확인, 파트너 수당 및 추천인 보너스 적립/출금 관리 대시보드 등의 서비스를 24시간 연중무휴 제공함을 원칙으로 합니다.</p>

                        <h4>제 5 조 (서비스의 변경 및 중단)</h4>
                        <p>회사는 상당한 이유가 있는 경우 서비스의 전부 또는 일부를 제한하거나 변경·중단할 수 있으며, 무료 제공 서비스 수정·중단 시 관련 법령에 특별한 규정이 없는 한 별도 보상을 하지 않습니다.</p>

                        <h4>제 6 조 (파트너의 의무)</h4>
                        <p>파트너는 가입/계좌 등록 시 타인의 정보 도용, 허위 부고장 생성, 유령 주문 발생 등 부정한 방법으로 수당을 취득하는 행위, 명예 훼손, 스팸 전송 및 지적재산권 침해 행위를 해서는 안 됩니다.</p>

                        <h4>제 7 조 (콘텐츠의 관리)</h4>
                        <p>파트너가 작성한 부고장 콘텐츠의 권리와 책임은 파트너에게 있으며, 회사는 모욕, 미풍양속 위반, 불법복제, 영리목적 스미싱/보이스피싱 의심 게시물을 사전통지 없이 삭제하거나 등록 거부할 수 있습니다.</p>

                        <h4>제 8 조 (수당 정산 및 원천징수)</h4>
                        <p>1. 화환 수당은 주문 배송 완료 및 구매 확정이 처리된 건에 한하여 정산 적립되며, 취소 및 환불 시 자동 차감·회수 처리됩니다.</p>
                        <p>2. 개인(프리랜서) 파트너의 출금 신청 시 소득세법 제127조에 의거하여 사업소득세 3.3%(국세 3%, 지방소득세 0.3%)를 원천징수 공제한 후 입금됩니다.</p>
                        <p>3. 회사는 원천징수 세무 신고를 위해 파트너의 주민등록번호(개인정보 보호법 제24조의2 근거)를 수집 및 국세청에 신고합니다.</p>
                        <p>4. 정산 이체는 파트너 본인 명의 계좌로만 이체되며 명의 불일치 시 출금이 제한됩니다.</p>

                        <h4>제 8 조의2 (부정 수급 및 제재)</h4>
                        <p>허위 부고, 명의 도용, 어뷰징 등 부정한 방법으로 수당을 수급한 경우 계정 영구 정지, 부정 수당 전액 소멸·몰수 및 환수, 민·형사상 법적 조치가 취해지며 재가입이 제한됩니다.</p>

                        <h4>제 9 조 (저작권의 귀속)</h4>
                        <p>회사가 작성한 저작물 및 플랫폼 지적재산권은 회사에 귀속되며 파트너는 무단 복제, 배포, 영리 이용을 할 수 없습니다.</p>

                        <h4>제 10 조 (개인정보보호)</h4>
                        <p>회사는 파트너의 개인정보를 보호하기 위하여 개인정보처리방침을 수립하고 이를 준수합니다.</p>

                        <h4>제 11 조 (면책조항)</h4>
                        <p>회사는 천재지변, 파트너 귀책사유, 결제대행사(PG사), 이노페이, 금융기관의 전산 장애 또는 파트너의 계좌정보 오입력으로 인한 이체 지연/오류에 대하여 책임을 지지 않습니다.</p>

                        <h4>제 12 조 (분쟁의 해결)</h4>
                        <p>회사와 파트너 간 분쟁 발생 시 원만히 해결하되 소송이 제기될 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.</p>
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
                    <h3 className={styles.docTitle}>마음부고 B2B 파트너(부고온) 개인정보처리방침</h3>
                    <div className={styles.docContentBox}>
                        <p>마음부고(이하 "회사")는 "개인정보 보호법" 등 관련 법규를 준수하여 파트너의 개인정보를 안전하게 보호합니다.</p>

                        <h4>1. 수집하는 개인정보 항목 및 수집방법</h4>
                        <p><strong>가. 수집하는 개인정보 항목</strong></p>
                        <p>- 필수항목: 휴대폰 번호, 상호명(소속), 대표자명(성명), 비밀번호</p>
                        <p>- 정산 수집항목: 예금주, 은행명, 계좌번호</p>
                        <p>- 원천징수 세무 신고 수집항목: 성명, 주민등록번호(또는 외국인등록번호), 본인인증 정보 (소득세법 제127조 근거)</p>
                        <p>- 자동 수집항목: 서비스 이용 기록, 접속 로그, IP 주소, 쿠키, 접속 기기 정보</p>
                        <p><strong>나. 수집방법:</strong> 웹/앱 회원가입, 계좌 등록, 본인인증 폼 직접 입력 및 서비스 이용 중 자동 수집</p>

                        <h4>2. 개인정보의 수집 및 이용목적</h4>
                        <p>가. 파트너 서비스 제공, 본인 확인 및 파트너 자격 관리</p>
                        <p>나. 화환 수당 및 추천인 보너스 이체 송금 처리</p>
                        <p>다. 프리랜서 사업소득 3.3%(국세 3%, 지방소득세 0.3%) 원천징수 국세청 세무 신고 대행 및 지급명세서 제출</p>
                        <p>라. 파트너 문의 불만 처리, 정산 공지 안내 전달</p>

                        <h4>3. 개인정보의 보유 및 이용기간</h4>
                        <p>- 파트너 회원 정보: 파트너 회원 탈퇴 시까지</p>
                        <p>- 세무 신고 관련 자료 (주민등록번호 포함): 5년 (국세기본법 및 소득세법)</p>
                        <p>- 정산금 결제 및 이체 기록: 5년 (전자상거래법)</p>
                        <p>- 문의 정보: 1년, 접속 로그: 3개월 (통신비밀보호법)</p>
                        <p>- 부정 이용 및 어뷰징 기록: 5년 (전자상거래법)</p>

                        <h4>4. 개인정보의 파기절차 및 방법</h4>
                        <p>목적 달성 후 별도 DB로 옮겨져 법정 보관기간 후 기록을 재생할 수 없는 기술적 방법으로 파기합니다.</p>

                        <h4>5. 개인정보 제공 및 공유 (세무 신고 제3자 제공)</h4>
                        <p>회사는 소득세 원천징수 신고를 위해 개인정보보호법 제17조 제2항에 따라 제3자에게 제공합니다.</p>
                        <p>- 제공받는 자: 국세청, 관할 세무서, 회사의 수임 세무사</p>
                        <p>- 제공 항목: 성명, 주민등록번호, 지급 금액, 지급 일자</p>
                        <p>- 제공 목적: 소득세법에 따른 사업소득 3.3% 원천징수 세무 신고 및 영수증 발행</p>
                        <p>- 보유 기간: 세법에 따른 보존 기한 5년</p>
                        <p>- 동의 거부권: 동의 거부 시 원천징수 신고 불가로 정산 출금이 제한될 수 있습니다.</p>

                        <h4>6. 이용자(파트너)의 권리와 행사방법</h4>
                        <p>파트너는 언제든지 본인의 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수 있으며 개인정보보호책임자에게 이메일 연락 시 지체 없이 조치합니다.</p>

                        <h4>7. 쿠키의 사용</h4>
                        <p>이용자의 접속 빈도 분석 및 편의 향상을 위해 쿠키를 사용하며 웹 브라우저 설정을 통해 거부할 수 있습니다.</p>

                        <h4>8. 개인정보보호책임자</h4>
                        <p>- 성명: 김미연 (대표)</p>
                        <p>- 직책: 대표</p>
                        <p>- 이메일: miyoun1990@gmail.com</p>

                        <h4>9. 권익침해 구제방법</h4>
                        <p>개인정보침해신고센터 (118) / 대검찰청 사이버수사과 (1301) / 경찰청 사이버안전국 (182)</p>

                        <h4>10. 개인정보처리방침 변경</h4>
                        <p>본 개인정보처리방침은 2026년 6월 21일부터 적용됩니다.</p>
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


