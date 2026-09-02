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

  // 📱 안드로이드 네비게이션 바 (<) 뒤로가기 전역 제어 및 이탈 방지
  useEffect(() => {
    // 뷰어 및 관리자 페이지는 제외
    const isViewer = pathname && (pathname.startsWith('/b2b/view') || pathname.startsWith('/b2b/order') || pathname.startsWith('/b2b/review'));
    const isAdm = pathname && (pathname.startsWith('/b2b/admin') || pathname.startsWith('/b2b/company') || pathname.startsWith('/admin'));
    if (isViewer || isAdm) return;

    // 히스토리 앵커 삽입
    window.history.pushState({ b2bAnchor: pathname }, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // 1. 열려있는 모달/팝업이 있으면 모달 닫기
      const activeModalCloseBtn = document.querySelector('.recipient-modal-overlay .btn-modal-close, .modal-close, [data-modal-close="true"]') as HTMLElement;
      if (activeModalCloseBtn) {
        window.history.pushState({ b2bAnchor: pathname }, '', window.location.href);
        activeModalCloseBtn.click();
        return;
      }

      // 2. 대시보드(홈) 화면인 경우: 2회 뒤로가기 종료 처리
      if (isDashboard) {
        if (backPressedRef.current) {
          if (Capacitor.isNativePlatform()) {
            import('@capacitor/app').then(({ App }) => App.exitApp());
          } else {
            window.history.back();
          }
        } else {
          // 1번째 누름: 즉시 현재 페이지(대시보드)로 URL 복원 & 토스트
          window.history.pushState({ b2bAnchor: pathname }, '', '/b2b/dashboard');
          backPressedRef.current = true;
          setToastMessage('뒤로가기 버튼을 한 번 더 누르면 종료됩니다.');
          setTimeout(() => {
            backPressedRef.current = false;
            setToastMessage(null);
          }, 2000);
        }
        return;
      }

      // 3. 서브 페이지인 경우: 밖으로 튕기지 않고 직전 화면 또는 대시보드(홈)로 이동
      if (pathname.startsWith('/b2b/create/complete')) {
        const bugoNumber = pathname.split('/').pop();
        window.history.pushState({ b2bAnchor: '/b2b/create' }, '', `/b2b/create?edit=${bugoNumber}`);
        router.replace(`/b2b/create?edit=${bugoNumber}`);
      } else if (pathname.startsWith('/b2b/create')) {
        const search = window.location.search;
        if (search.includes('edit=')) {
          window.history.pushState({ b2bAnchor: '/b2b/manage' }, '', '/b2b/manage');
          router.replace('/b2b/manage');
        } else {
          window.history.pushState({ b2bAnchor: '/b2b/dashboard' }, '', '/b2b/dashboard');
          router.replace('/b2b/dashboard');
        }
      } else {
        window.history.pushState({ b2bAnchor: '/b2b/dashboard' }, '', '/b2b/dashboard');
        router.replace('/b2b/dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Capacitor Native Android 백버튼 연동
    let nativeListener: any = null;
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('backButton', () => {
          handlePopState({} as PopStateEvent);
        }).then(listener => {
          nativeListener = listener;
        });
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (nativeListener && typeof nativeListener.remove === 'function') {
        nativeListener.remove();
      }
    };
  }, [pathname, isDashboard, router]);

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
