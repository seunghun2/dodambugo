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

  // [천재적 기법] 페이지 이동 직후(안착 시점) 현재 페이지의 HTML 스냅샷을 세션에 백업
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.getElementById('b2b-page-container');
      if (container) {
        // 이전 페이지의 마크업 상태를 통째로 보관 (뒤로가기 제스처 시 배경 레이어에 정적으로 노출하기 위함)
        sessionStorage.setItem('b2b_prev_html', container.innerHTML);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  // iOS 네이티브 쓸어넘기기(Swipe Back) 물리 제스처 직접 구현 (이전 페이지 스냅샷 노출 연동)
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    const handleTouchStart = (e: TouchEvent) => {
      const container = document.getElementById('b2b-page-container');
      const overlay = document.getElementById('swipe-overlay');

      // 화면 왼쪽 가장자리(45px 이내)에서 1점 터치 시작 시에만 감지
      if (e.touches.length === 1 && e.touches[0].clientX < 45 && container && overlay) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
        
        container.style.transition = 'none';
        overlay.style.transition = 'none';

        // 이전 페이지의 스냅샷 HTML을 백그라운드 오버레이에 주입
        const prevHtml = sessionStorage.getItem('b2b_prev_html');
        if (prevHtml) {
          overlay.innerHTML = prevHtml;
          overlay.style.opacity = '1';
          overlay.style.transform = 'scale(0.96)'; // iOS 감성의 원거리 3D 원근법
          overlay.style.filter = 'brightness(0.8)'; // 서서히 밝아지기 대기용 어두운 암막
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

      // 세로 스크롤 의도가 훨씬 크면 무효화
      if (Math.abs(diffY) > Math.abs(diffX) && diffX < 20) {
        isSwiping = false;
        container.style.transform = 'none';
        overlay.style.opacity = '0';
        overlay.innerHTML = '';
        return;
      }

      if (diffX > 0) {
        // 현재 페이지만 오른쪽으로 밀어줌
        container.style.transform = `translateX(${diffX}px)`;
        
        // 밀리는 정도에 따라 뒷배경 대기 페이지의 밝기(brightness)와 스케일(scale)을 1.0으로 복원 (네이티브 동기화)
        const scale = Math.min(1.0, 0.96 + (diffX / 800) * 0.04);
        const brightness = Math.min(1.0, 0.8 + (diffX / 800) * 0.2);
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

      if (diffX > 110) {
        // 뒤로가기 실행: 100% 밀어내고 router.back()
        container.style.transform = 'translateX(100%)';
        overlay.style.transform = 'scale(1)';
        overlay.style.filter = 'brightness(1)';
        
        setTimeout(() => {
          router.back();
          // 라우팅 완료 후 원복 및 리셋
          container.style.transition = 'none';
          container.style.transform = 'none';
          overlay.style.opacity = '0';
          overlay.innerHTML = '';
        }, 240);
      } else {
        // 복원: 제자리 복구
        container.style.transform = 'none';
        overlay.style.transform = 'scale(0.96)';
        overlay.style.filter = 'brightness(0.8)';
        
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
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', minHeight: '100vh', backgroundColor: '#000' }}>
      {/* 뒤로가기 시 뒷면에 생기는 이전 페이지 복제 오버레이 레이어 (인터랙션 연동) */}
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
        backgroundColor: '#fff',
        transformOrigin: 'center center'
      }} />

      {/* 오른쪽으로 물리 슬라이드되는 최상위 페이지 레이어 */}
      <div id="b2b-page-container" style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        zIndex: 2,
        backgroundColor: '#fff',
        boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.15)'
      }}>
        {children}
      </div>
      {showBottomBar && <BottomTabBar />}
    </div>
  );
}
