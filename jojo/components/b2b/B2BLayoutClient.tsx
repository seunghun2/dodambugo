'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { BottomTabBar } from './BottomTabBar';

export function B2BLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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

  // [초정밀 스냅샷 백업] 페이지 이탈 직전의 스크롤 위치와 HTML을 통째로 세션에 저장
  useEffect(() => {
    const handleSaveSnapshot = () => {
      const container = document.getElementById('b2b-page-container');
      if (container) {
        sessionStorage.setItem('b2b_prev_html', container.innerHTML);
        sessionStorage.setItem('b2b_prev_scroll', String(window.scrollY || 0));
      }
    };

    // 마운트 시 및 언마운트(이동 직전)에 지속적으로 스냅샷 최신화
    const interval = setInterval(handleSaveSnapshot, 800);

    return () => {
      handleSaveSnapshot();
      clearInterval(interval);
    };
  }, [pathname]);

  // iOS 스타일 무신사 1:1 슬라이드 뒤로가기 (Swipe Back) 정교화 물리 엔진 구현
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    const handleTouchStart = (e: TouchEvent) => {
      const container = document.getElementById('b2b-page-container');
      const overlay = document.getElementById('swipe-overlay');

      // 화면 왼쪽 엣지 45px 이내에서 터치 시작 시에만 감지
      if (e.touches.length === 1 && e.touches[0].clientX < 45 && container && overlay) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
        
        container.style.transition = 'none';
        overlay.style.transition = 'none';

        // 이전 페이지 스냅샷 HTML 복원
        const prevHtml = sessionStorage.getItem('b2b_prev_html');
        const prevScroll = Number(sessionStorage.getItem('b2b_prev_scroll') || 0);
        
        if (prevHtml) {
          overlay.innerHTML = prevHtml;
          overlay.style.opacity = '1';
          overlay.style.transform = 'scale(0.96)'; // 멀어지는 입체감 효과
          overlay.style.filter = 'brightness(0.9)'; // 서서히 밝아지는 톤
          // 이전 스크롤 높이 복구하여 화면 덜컥거림 원천 차단
          overlay.scrollTop = prevScroll;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;

      const container = document.getElementById('b2b-page-container');
      const overlay = document.getElementById('swipe-overlay');
      if (!container || !overlay) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - startX;
      const diffY = currentY - startY;

      // 세로 제스처가 우세하면 즉각 취소
      if (Math.abs(diffY) > Math.abs(diffX) && diffX < 20) {
        isSwiping = false;
        container.style.transform = 'none';
        overlay.style.opacity = '0';
        overlay.innerHTML = '';
        return;
      }

      if (diffX > 0) {
        // 무신사 스타일로 현재 페이지만 오른쪽으로 밀림
        container.style.transform = `translateX(${diffX}px)`;
        
        // 뒷배경 스케일 및 밝기 동기화 (1.0으로 수렴)
        const scale = Math.min(1.0, 0.96 + (diffX / 800) * 0.04);
        const brightness = Math.min(1.0, 0.9 + (diffX / 800) * 0.1);
        overlay.style.transform = `scale(${scale})`;
        overlay.style.filter = `brightness(${brightness})`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return;
      isSwiping = false;

      const container = document.getElementById('b2b-page-container');
      const overlay = document.getElementById('swipe-overlay');
      if (!container || !overlay) return;

      const endX = e.changedTouches[0].clientX;
      const diffX = endX - startX;

      container.style.transition = 'transform 0.24s cubic-bezier(0.33, 1, 0.68, 1)';
      overlay.style.transition = 'all 0.24s cubic-bezier(0.33, 1, 0.68, 1)';

      // 110px 이상 우측으로 당기면 뒤로가기(router.back()) 실행
      if (diffX > 110) {
        container.style.transform = 'translateX(100%)';
        overlay.style.transform = 'scale(1)';
        overlay.style.filter = 'brightness(1)';
        
        setTimeout(() => {
          router.back();
          container.style.transition = 'none';
          container.style.transform = 'none';
          overlay.style.opacity = '0';
          overlay.innerHTML = '';
        }, 240);
      } else {
        // 우측 당기다 멈춘 경우 원복
        container.style.transform = 'none';
        overlay.style.transform = 'scale(0.96)';
        overlay.style.filter = 'brightness(0.9)';
        
        setTimeout(() => {
          container.style.transition = 'none';
          overlay.style.transition = 'none';
          overlay.style.opacity = '0';
          overlay.innerHTML = '';
        }, 240);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router]);

  // 하단 탭바를 보여줄 B2B 경로 정의
  const showBottomBar = pathname && 
    pathname.startsWith('/b2b') && 
    pathname !== '/b2b' && 
    pathname !== '/b2b/' && 
    pathname !== '/b2b/login' && 
    pathname !== '/b2b/login/' && 
    !pathname.startsWith('/b2b/signup') && 
    !pathname.startsWith('/b2b/admin') &&
    !pathname.startsWith('/b2b/flower') && 
    !pathname.startsWith('/b2b/view') &&   
    !pathname.startsWith('/b2b/create') && 
    !pathname.startsWith('/b2b/order') &&  
    !pathname.includes('/view') &&          
    !pathname.includes('/flower') &&        
    !pathname.includes('/create') &&        
    !pathname.includes('/order');           

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* 뒤로가기 제스처 시 뒷면에 노출될 이전 화면 정적 복제본 (검은화면 방지 백그라운드) */}
      <div id="swipe-overlay" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        opacity: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: '#f8f9fa',
        transformOrigin: 'center center'
      }} />

      {/* 실시간으로 움직이는 최상위 뷰 */}
      <div id="b2b-page-container" style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        zIndex: 2,
        backgroundColor: '#fff',
        boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.08)'
      }}>
        {children}
      </div>
      {showBottomBar && <BottomTabBar />}
    </div>
  );
}
