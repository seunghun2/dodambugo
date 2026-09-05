'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from './BottomTabBar.module.css';
import { B2BIcon } from './B2BIcon';

const tabs = [
  { id: 'home', label: '홈', href: '/b2b/dashboard' },
  { id: 'manage', label: '부고', href: '/b2b/manage' },
  { id: 'wallet', label: '적립', href: '/b2b/wallet' },
  { id: 'settings', label: '설정', href: '/b2b/settings' },
] as const;

function BottomTabBarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectMode = searchParams ? searchParams.get('select') : null;

  return (
    <nav className={styles.tabBar}>
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href) && !(tab.id === 'manage' && selectMode);
        const strokeWidth = active ? 1.8 : 1.5;

        return (
          <button
            key={tab.href}
            onClick={() => {
              if (pathname !== tab.href) {
                router.replace(tab.href);
              }
            }}
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

export function BottomTabBar() {
  return (
    <Suspense fallback={null}>
      <BottomTabBarContent />
    </Suspense>
  );
}
