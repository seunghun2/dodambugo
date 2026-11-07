'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { BottomTabBar } from './BottomTabBar';
import { useSwipeBack } from '@/hooks/useSwipeBack';

export function B2BLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useSwipeBack();

  // iOS/Android: 상태바가 WebView 영역 위로 얹어지게(오버레이) 설정하여 검은 띠 제거
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        StatusBar.setOverlaysWebView({ overlay: true });
        StatusBar.setStyle({ style: Style.Light });
      }).catch(() => {
        // 플러그인 없으면 무시
      });
    }
  }, []);

  // iOS 네이티브 스와이프 뒤로가기는 Capacitor의 backButtonGestures: true 설정으로
  // WKWebView가 자체적으로 처리합니다. (capacitor.config.ts → ios.backButtonGestures)
  // JS에서 별도로 구현하면 "죽은 캡처" 문제가 발생하므로 네이티브에 위임합니다.

  // bugoon.maeumbugo.co.kr 서브도메인 접속 시 /b2b 접두사가 생략된 경로(/signup, /dashboard 등)를 /b2b/... 형태로 정규화
  const normPath = pathname
    ? (pathname.startsWith('/b2b') ? pathname : `/b2b${pathname === '/' ? '' : pathname}`)
    : '';

  // 하단 탭바를 보여줄 B2B 경로 정의
  const showBottomBar = normPath && 
    normPath.startsWith('/b2b') && 
    normPath !== '/b2b' && 
    normPath !== '/b2b/' && 
    normPath !== '/b2b/login' && 
    normPath !== '/b2b/login/' && 
    !normPath.startsWith('/b2b/login/') &&
    !normPath.startsWith('/b2b/intro') &&
    !normPath.startsWith('/b2b/signup') && 
    !normPath.startsWith('/b2b/privacy') &&
    !normPath.startsWith('/b2b/terms') &&
    !normPath.startsWith('/b2b/income-tax') &&
    !normPath.startsWith('/b2b/delete-account') &&
    !normPath.startsWith('/b2b/admin') &&
    !normPath.startsWith('/b2b/company') && 
    !normPath.startsWith('/b2b/flower') && 
    !normPath.startsWith('/b2b/view') &&   
    !normPath.startsWith('/b2b/create') && 
    !normPath.startsWith('/b2b/order') &&  
    !normPath.startsWith('/b2b/review') &&  
    !normPath.includes('/view') &&          
    !normPath.includes('/flower') &&        
    !normPath.includes('/create') &&        
    !normPath.includes('/order');           

  const isAdmin = normPath && (
    normPath.startsWith('/b2b/admin') || 
    normPath.startsWith('/b2b/company') ||
    pathname?.startsWith('/admin')
  );

  // 조문객 대상 페이지 (부고장, 주문, 리뷰 등)는 래퍼 스타일 최소화
  const isViewerPage = normPath && (
    normPath.startsWith('/b2b/view') ||
    normPath.startsWith('/b2b/order') ||
    normPath.startsWith('/b2b/review')
  );

  const isIntroPage = normPath && (
    normPath === '/b2b/intro' ||
    normPath.startsWith('/b2b/intro') ||
    pathname === '/intro'
  );

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: isIntroPage ? '#faf8f4' : (isViewerPage ? 'transparent' : (isAdmin ? '#f8fafc' : '#f8f9fa')) }}>
      {/* 메인 콘텐츠 뷰 */}
      <div id="b2b-page-container" style={isIntroPage ? {
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'transparent',
      } : isAdmin ? {
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      } : isViewerPage ? {
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'transparent',
      } : {
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#fff',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.03)',
      }}>
        {children}
      </div>
      {showBottomBar && <BottomTabBar />}
    </div>
  );
}
