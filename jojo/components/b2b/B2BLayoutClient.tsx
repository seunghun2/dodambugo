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

  // iOS 네이티브 쓸어넘기기(Swipe Back) 물리 제스처 직접 구현 (화면 드래그 밀림 연동)
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isSwiping = false;
    const body = document.body;

    const handleTouchStart = (e: TouchEvent) => {
      // 화면 왼쪽 가장자리(45px 이내)에서 1점 터치 시작 시에만 감지
      if (e.touches.length === 1 && e.touches[0].clientX < 45) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
        
        // 터치 즉각 반응을 위해 과도기 트랜지션 해제
        body.style.transition = 'none';
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - startX;
      const diffY = currentY - startY;

      // 세로 스크롤 왜곡이 훨씬 크면 제스처 무효화
      if (Math.abs(diffY) > Math.abs(diffX) && diffX < 20) {
        isSwiping = false;
        body.style.transform = 'none';
        return;
      }

      if (diffX > 0) {
        // 손가락 드래그 거리만큼 전체 화면을 오른쪽으로 밀어줌 (iOS 네이티브 감각)
        body.style.transform = `translateX(${diffX}px)`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return;
      isSwiping = false;

      const endX = e.changedTouches[0].clientX;
      const diffX = endX - startX;

      // 제자리 복귀 또는 이탈용 트랜지션 곡선 주입
      body.style.transition = 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1)';

      if (diffX > 120) {
        // 임계값 초과 시 화면을 끝까지 100% 밀어낸 뒤 뒤로가기 실행
        body.style.transform = 'translateX(100%)';
        setTimeout(() => {
          router.back();
          // 라우터 복귀 후 원래대로 위치 원복
          body.style.transition = 'none';
          body.style.transform = 'none';
        }, 250);
      } else {
        // 임계값 미만 시 0px로 튕겨서 복원
        body.style.transform = 'none';
        setTimeout(() => {
          body.style.transition = 'none';
        }, 250);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      body.style.transform = 'none';
      body.style.transition = 'none';
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
    <>
      {children}
      {showBottomBar && <BottomTabBar />}
    </>
  );
}
