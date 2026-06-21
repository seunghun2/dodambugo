'use client';

import { usePathname } from 'next/navigation';
import { BottomTabBar } from './BottomTabBar';

export function B2BLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 하단 탭바를 보여줄 유저용 B2B 경로 정의
  const showBottomBar = pathname && 
    pathname.startsWith('/b2b') && 
    pathname !== '/b2b' && 
    pathname !== '/b2b/' && 
    pathname !== '/b2b/login' && 
    pathname !== '/b2b/login/' && 
    !pathname.startsWith('/b2b/admin');

  return (
    <>
      {children}
      {showBottomBar && <BottomTabBar />}
    </>
  );
}
