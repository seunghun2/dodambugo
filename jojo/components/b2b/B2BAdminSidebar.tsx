'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    IconLayoutDashboard, 
    IconUsers, 
    IconBuilding,
    IconCreditCard, 
    IconSettings,
    IconLogout,
    IconFileText,
    IconFlower,
    IconFileDescription,
    IconMessage2,
    IconQuestionMark,
    IconClipboardList,
    IconBan,
    IconCash,
    IconPackage,
    IconAdjustments,
    IconMailOpened,
    IconHistory
} from '@tabler/icons-react';
import styles from './B2BAdminSidebar.module.css';

interface B2BAdminSidebarProps {
    onLogout: () => void;
}

export function B2BAdminSidebar({ onLogout }: B2BAdminSidebarProps) {
    const pathname = usePathname();

    const menuItems = [
        {
            href: '/b2b/admin',
            label: '대시보드',
            icon: <IconLayoutDashboard stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/partners',
            label: '파트너 관리',
            icon: <IconUsers stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/companies',
            label: '상조회사 관리',
            icon: <IconBuilding stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/bugo',
            label: 'B2B 부고 조회',
            icon: <IconFileText stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/drafts',
            label: 'B2B 임시저장',
            icon: <IconFileDescription stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/flower-orders',
            label: 'B2B 화환 주문',
            icon: <IconFlower stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/condolence-orders',
            label: '조의금 주문 관리',
            icon: <IconCash stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/products',
            label: '상품 등록',
            icon: <IconPackage stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/condolence-settings',
            label: '조의금 설정',
            icon: <IconAdjustments stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/notification-templates',
            label: '알림 문구 설정',
            icon: <IconMailOpened stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/notification-logs',
            label: '알림 발송 로그',
            icon: <IconHistory stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/burial-reviews',
            label: '편지 후기 관리',
            icon: <IconMessage2 stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/withdrawals',
            label: '출금 신청 관리',
            icon: <IconCreditCard stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/inquiries',
            label: '1:1 문의 관리',
            icon: <IconQuestionMark stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/notices',
            label: '공지사항 관리',
            icon: <IconClipboardList stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/blocked-ips',
            label: 'IP 제한 관리',
            icon: <IconBan stroke={1.5} size={22} />
        },
        {
            href: '/b2b/admin/settings',
            label: '어드민 설정',
            icon: <IconSettings stroke={1.5} size={22} />
        }
    ];


    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoArea}>
                <span className={styles.logoText}>부고온 B2B</span>
                <span className={styles.logoSub}>어드민</span>
            </div>
            
            <nav className={styles.menuList}>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/b2b/admin' && pathname.startsWith(item.href + '/'));
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={`${styles.menuItem} ${isActive ? styles.activeItem : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.footerArea}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', marginBottom: '14px', fontSize: '11px', color: '#94a3b8' }}>
                    <Link href="/b2b/faq" target="_blank" style={{ color: '#94a3b8', textDecoration: 'none' }}>자주 묻는 질문</Link>
                    <span>·</span>
                    <Link href="/b2b/inquiry" target="_blank" style={{ color: '#94a3b8', textDecoration: 'none' }}>1:1 문의</Link>
                    <span>·</span>
                    <Link href="/b2b/notice" target="_blank" style={{ color: '#94a3b8', textDecoration: 'none' }}>공지사항</Link>
                    <span>·</span>
                    <Link href="/b2b/terms" target="_blank" style={{ color: '#94a3b8', textDecoration: 'none' }}>이용약관</Link>
                    <span>·</span>
                    <Link href="/b2b/privacy" target="_blank" style={{ color: '#94a3b8', textDecoration: 'none' }}>개인정보 처리방침</Link>
                </div>
                <button className={styles.logoutBtn} onClick={onLogout}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <IconLogout stroke={1.5} size={16} />
                        <span>로그아웃</span>
                    </div>
                </button>
            </div>
        </aside>
    );
}
