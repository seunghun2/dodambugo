'use client';

import { usePathname, useRouter } from 'next/navigation';
import styles from './BottomTabBar.module.css';
import { B2BIcon } from './B2BIcon';

const tabs = [
  { id: 'home', label: '홈', href: '/b2b/dashboard' },
  { id: 'manage', label: '부고', href: '/b2b/manage' },
  { id: 'wallet', label: '정산', href: '/b2b/wallet' },
  { id: 'settings', label: '설정', href: '/b2b/settings' },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className={styles.tabBar}>
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        const strokeWidth = active ? 1.8 : 1.5;

        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
          >
            <B2BIcon
              name={tab.id}
              size={22}
              strokeWidth={strokeWidth}
              className={styles.tabIcon}
            />
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
