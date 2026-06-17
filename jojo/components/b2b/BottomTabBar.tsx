'use client';
import { usePathname, useRouter } from 'next/navigation';
import { IconHome, IconFileText, IconWallet, IconSettings } from '@tabler/icons-react';
import styles from './BottomTabBar.module.css';

const tabs = [
    { icon: IconHome, label: '홈', href: '/b2b/dashboard' },
    { icon: IconFileText, label: '부고', href: '/create' },
    { icon: IconWallet, label: '정산', href: '/b2b/wallet' },
    { icon: IconSettings, label: '설정', href: '/b2b/settings' },
];

export function BottomTabBar() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <nav className={styles.tabBar}>
            {tabs.map((tab) => {
                const active = pathname.startsWith(tab.href);
                return (
                    <button
                        key={tab.href}
                        onClick={() => router.push(tab.href)}
                        className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                    >
                        <tab.icon
                            size={22}
                            stroke={active ? 2 : 1.5}
                            className={styles.tabIcon}
                        />
                        <span className={styles.tabLabel}>{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
