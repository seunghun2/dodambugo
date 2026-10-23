'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    IconLayoutDashboard, 
    IconUsers, 
    IconCreditCard, 
    IconFileText,
    IconFlower
} from '@tabler/icons-react';
import styles from './B2BAdminMobileNav.module.css';

export function B2BAdminMobileNav() {
    const pathname = usePathname();

    const menuItems = [
        {
            href: '/b2b/admin',
            label: '홈',
            icon: <IconLayoutDashboard stroke={1.5} size={20} />
        },
        {
            href: '/b2b/admin/partners',
            label: '파트너',
            icon: <IconUsers stroke={1.5} size={20} />
        },
        {
            href: '/b2b/admin/bugo',
            label: '부고',
            icon: <IconFileText stroke={1.5} size={20} />
        },
        {
            href: '/b2b/admin/flower-orders',
            label: '화환',
            icon: <IconFlower stroke={1.5} size={20} />
        },
        {
            href: '/b2b/admin/withdrawals',
            label: '출금',
            icon: <IconCreditCard stroke={1.5} size={20} />
        }
    ];


    return (
        <nav className={styles.mobileNav}>
            {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link 
                        key={item.href} 
                        href={item.href}
                        className={`${styles.navItem} ${isActive ? styles.activeItem : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
