'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * 화면이 흔들리거나 전체 화면이 꿀렁거리며 움직이지 않고,
 * 손가락 좌측 가장자리 스와이프 제스처만 깔끔하게 감지하여 뒤로가는 훅
 */
export function useSwipeBack() {
  const router = useRouter();
  const pathname = usePathname();
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwiping = useRef(false);

  useEffect(() => {
    // 메인 루트/로그인 페이지에서는 뒤로가기 스와이프 비활성화
    const isNoSwipe = pathname === '/b2b' || pathname === '/b2b/' || pathname === '/b2b/dashboard' || pathname === '/b2b/login';
    if (isNoSwipe) return;

    // 터치 시작: 화면 좌측 80px 이내 (또는 화면 너비의 20%) 영역에서 감지
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const maxEdge = Math.min(window.innerWidth * 0.25, 80);
      if (touch.clientX > maxEdge) return;

      startX.current = touch.clientX;
      startY.current = touch.clientY;
      isSwiping.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current || startX.current === 0) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      // 우측 수평 이동 시 브라우저 기본 이동 및 오버스크롤 방지
      if (dx > 15 && dx > Math.abs(dy)) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping.current || startX.current === 0) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      // 오른쪽으로 40px 이상 밀고 수평 이동이 우세할 때 뒤로가기 실행
      if (dx > 40 && dx > Math.abs(dy)) {
        router.back();
      }

      startX.current = 0;
      isSwiping.current = false;
    };

    // 마우스 테스트 지원 (PC 브라우저 에뮬레이션 시)
    const handleMouseDown = (e: MouseEvent) => {
      const maxEdge = Math.min(window.innerWidth * 0.25, 80);
      if (e.clientX > maxEdge) return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      isSwiping.current = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isSwiping.current || startX.current === 0) return;

      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;

      if (dx > 40 && dx > Math.abs(dy)) {
        router.back();
      }

      startX.current = 0;
      isSwiping.current = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [pathname, router]);
}
