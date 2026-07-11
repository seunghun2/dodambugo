'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { BottomTabBar } from './BottomTabBar';

export function B2BLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // iOS/Android: 상태바가 WebView 영역 위로 얹어지게(오버레이) 설정하여 검은 띠 제거
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        StatusBar.setOverlaysWebView({ overlay: true });
        StatusBar.setStyle({ style: Style.Dark });
      }).catch(() => {
        // 플러그인 없으면 무시
      });
    }
  }, []);
  
  // 하단 탭바를 보여줄 유저용 B2B 경로 정의
  const showBottomBar = pathname && 
    pathname.startsWith('/b2b') && 
    pathname !== '/b2b' && 
    pathname !== '/b2b/' && 
    pathname !== '/b2b/login' && 
    pathname !== '/b2b/login/' && 
    !pathname.startsWith('/b2b/signup') && 
    !pathname.startsWith('/b2b/admin') &&
    !pathname.startsWith('/b2b/flower') && // 화환 주문/상세 페이지에서 숨김
    !pathname.startsWith('/b2b/view') &&   // 부고 조회 및 조문 관련 화면에서 숨김
    !pathname.startsWith('/b2b/create') && // 부고장 작성 화면에서 숨김
    !pathname.startsWith('/b2b/order') &&  // 추가: B2B 주문 확인 페이지에서 숨김
    !pathname.includes('/view') &&          // 추가: rewrite 전 /view 경로 대응
    !pathname.includes('/flower') &&        // 추가: rewrite 전 /flower 경로 대응
    !pathname.includes('/create') &&        // 추가: rewrite 전 /create 경로 대응
    !pathname.includes('/order');           // 추가: rewrite 전 /order 경로 대응

  return (
    <>
      {children}
      {showBottomBar && <BottomTabBar />}
    </>
  );
}
