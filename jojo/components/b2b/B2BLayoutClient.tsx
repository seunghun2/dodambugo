'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { BottomTabBar } from './BottomTabBar';
import { useSwipeBack } from '@/hooks/useSwipeBack';

export function B2BLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const backPressedRef = useRef(false);
  useSwipeBack();

  const isDashboard = pathname === '/b2b/dashboard' || pathname === '/b2b' || pathname === '/b2b/';

  // 📱 안드로이드 네비게이션 바 (<) 뒤로가기 시 밖으로 튕김 방지
  useEffect(() => {
    // 뷰어 및 관리자 페이지는 제외
    const isViewer = pathname && (pathname.startsWith('/b2b/view') || pathname.startsWith('/b2b/order') || pathname.startsWith('/b2b/review'));
    const isAdm = pathname && (pathname.startsWith('/b2b/admin') || pathname.startsWith('/b2b/company') || pathname.startsWith('/admin'));
    if (isViewer || isAdm) return;

    window.history.pushState({ b2bNavPath: pathname }, '');

    const handlePopState = () => {
      if (isDashboard) {
        if (backPressedRef.current) {
          // 2번째 누름: 종료 허용
          window.history.back();
        } else {
          // 1번째 누름: 밖으로 튕기지 않고 토스트 표시
          window.history.pushState({ b2bNavPath: pathname }, '');
          backPressedRef.current = true;
          setToastMessage('뒤로가기 버튼을 한 번 더 누르면 종료됩니다.');
          setTimeout(() => {
            backPressedRef.current = false;
            setToastMessage(null);
          }, 2000);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, isDashboard]);

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

  // 하단 탭바를 보여줄 B2B 경로 정의
  const showBottomBar = pathname && 
    pathname.startsWith('/b2b') && 
    pathname !== '/b2b' && 
    pathname !== '/b2b/' && 
    pathname !== '/b2b/login' && 
    pathname !== '/b2b/login/' && 
    !pathname.startsWith('/b2b/signup') && 
    !pathname.startsWith('/b2b/admin') &&
    !pathname.startsWith('/b2b/company') && 
    !pathname.startsWith('/b2b/flower') && 
    !pathname.startsWith('/b2b/view') &&   
    !pathname.startsWith('/b2b/create') && 
    !pathname.startsWith('/b2b/order') &&  
    !pathname.startsWith('/b2b/review') &&  
    !pathname.includes('/view') &&          
    !pathname.includes('/flower') &&        
    !pathname.includes('/create') &&        
    !pathname.includes('/order');           

  const isAdmin = pathname && (
    pathname.startsWith('/b2b/admin') || 
    pathname.startsWith('/b2b/company') ||
    pathname.startsWith('/admin')
  );

  // 조문객 대상 페이지 (부고장, 주문, 리뷰 등)는 래퍼 스타일 최소화
  const isViewerPage = pathname && (
    pathname.startsWith('/b2b/view') ||
    pathname.startsWith('/b2b/order') ||
    pathname.startsWith('/b2b/review')
  );

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: isViewerPage ? 'transparent' : (isAdmin ? '#f8fafc' : '#f8f9fa') }}>
      {/* 메인 콘텐츠 뷰 */}
      <div id="b2b-page-container" style={isAdmin ? {
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
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: showBottomBar ? '80px' : '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '24px',
          fontSize: '14px',
          fontFamily: "'Pretendard', -apple-system, sans-serif",
          fontWeight: 500,
          zIndex: 99999,
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
