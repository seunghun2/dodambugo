'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconChevronRight, IconUser, IconCreditCard, IconHeadphones } from '@tabler/icons-react';
import { BottomTabBar } from '@/components/b2b/BottomTabBar';
import styles from './settings.module.css';

interface User {
    phone: string;
    company_name: string;
    owner_name: string;
    bank_name?: string;
    account_no?: string;
    account_holder?: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('b2b_token');
        const userData = localStorage.getItem('b2b_user');
        
        if (!token || !userData) {
            router.push('/b2b/login');
            return;
        }
        
        setUser(JSON.parse(userData));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('b2b_token');
        localStorage.removeItem('b2b_user');
        router.push('/b2b/login');
    };

    const formatPhone = (phone: string) => {
        if (!phone) return '';
        const clean = phone.replace(/[^0-9]/g, '');
        if (clean.length === 11) {
            return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
        }
        return phone;
    };

    if (!user) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--gray-500)' }}>
                불러오는 중...
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 상단 헤더 */}
            <div className={styles.header}>
                <span className={styles.headerTitle}>설정</span>
            </div>

            {/* 파트너 정보 */}
            <div className={styles.section}>
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                        <IconUser size={18} stroke={2} />
                        파트너 정보
                    </h3>
                    <div className={styles.infoGroup}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>상호명 (회사명)</span>
                            <span className={styles.infoValue}>{user.company_name}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>대표자명</span>
                            <span className={styles.infoValue}>{user.owner_name}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>휴대폰 번호</span>
                            <span className={styles.infoValue}>{formatPhone(user.phone)}</span>
                        </div>
                    </div>
                </div>

                {/* 정산 계좌 정보 */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                        <IconCreditCard size={18} stroke={2} />
                        정산 계좌 정보
                    </h3>
                    <div className={styles.infoGroup}>
                        {user.bank_name && user.account_no ? (
                            <>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>은행명</span>
                                    <span className={styles.infoValue}>{user.bank_name}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>계좌번호</span>
                                    <div className={styles.accountValueWrap}>
                                        <span className={styles.badge}>확인완료</span>
                                        <span className={styles.infoValue}>{user.account_no}</span>
                                    </div>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>예금주</span>
                                    <span className={styles.infoValue}>{user.account_holder || user.owner_name}</span>
                                </div>
                            </>
                        ) : (
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>등록된 계좌가 없습니다.</span>
                                <button 
                                    className={styles.changeBtn}
                                    onClick={() => router.push('/b2b/wallet')}
                                >
                                    등록하기
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 고객센터 및 시스템 관리 */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                        <IconHeadphones size={18} stroke={2} />
                        고객센터 및 지원
                    </h3>
                    <div className={styles.infoGroup}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>이메일 문의</span>
                            <span className={styles.infoValue}>miyoun1990@gmail.com</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>이용 가이드</span>
                            <span className={styles.infoValue}>추후 안내 예정</span>
                        </div>
                    </div>
                </div>

                {/* 유틸리티 메뉴 리스트 */}
                <div className={styles.menuList}>
                    <button className={styles.menuItem} onClick={handleLogout}>
                        <span className={styles.menuLabelDanger}>로그아웃</span>
                        <IconChevronRight size={16} stroke={1.5} color="var(--gray-400)" />
                    </button>
                </div>
            </div>

            {/* 푸터 */}
            <div className={styles.footer}>
                <p className={styles.footerText}>
                    마음부고 파트너 v1.0.0<br />
                    사업자등록번호 408-22-68851
                </p>
            </div>

            <BottomTabBar />
        </div>
    );
}
