'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * 손가락 좌측 가장자리(80px) 스와이프 시 1:1 손가락 추종 + 배경 딤드 깊이감 +
 * 손을 떼면 화면 밖으로 스르륵 0.2초 슬라이드되며 뒤로가는 네이티브 모션 훅
 */
export function useSwipeBack() {
  const router = useRouter();
  const pathname = usePathname();
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isSwiping = useRef(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 메인 루트/로그인/대시보드 페이지에서는 뒤로가기 비활성화
    const isNoSwipe = pathname === '/b2b' || pathname === '/b2b/' || pathname === '/b2b/dashboard' || pathname === '/b2b/login';
    if (isNoSwipe) return;

    const getContainer = () => document.getElementById('b2b-page-container');

    // 뒤에 어두운 배경 반투명 막(Dimmed Overlay) 생성
    const createOverlay = () => {
      if (overlayRef.current) return;
      const container = getContainer();
      if (!container || !container.parentElement) return;

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: #000;
        opacity: 0;
        z-index: 99;
        pointer-events: none;
        transition: none;
      `;
      container.parentElement.insertBefore(overlay, container);
      overlayRef.current = overlay;

      container.style.position = 'relative';
      container.style.zIndex = '100';
    };

    // 오버레이 안전 제거
    const removeOverlay = () => {
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
    };

    // 터치 시작: 좌측 80px (또는 25%) 터치만 감지
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const maxEdge = Math.min(window.innerWidth * 0.25, 80);
      if (touch.clientX > maxEdge) return;

      startX.current = touch.clientX;
      startY.current = touch.clientY;
      currentX.current = 0;
      isSwiping.current = false;

      const container = getContainer();
      if (container) {
        container.style.transition = 'none';
      }
    };

    // 터치 이동: 손가락 따라 실시간 화면 밀림 (1:1 Drag)
    const handleTouchMove = (e: TouchEvent) => {
      if (startX.current === 0) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      // 수직 이동이 수평 이동보다 크거나 음수 이동이면 스와이프 취소
      if (!isSwiping.current) {
        if (Math.abs(dy) > Math.abs(dx) || dx < 0) {
          startX.current = 0;
          return;
        }
        isSwiping.current = true;
        createOverlay();
      }

      currentX.current = Math.max(0, dx);

      const container = getContainer();
      if (container) {
        container.style.transform = `translateX(${currentX.current}px)`;
      }

      // 화면 밀릴 때 어두운 배경 서서히 옅어짐 (깊이감 효과)
      if (overlayRef.current) {
        const progress = Math.min(currentX.current / window.innerWidth, 1);
        overlayRef.current.style.opacity = `${0.35 * (1 - progress)}`;
      }

      if (dx > 10 && e.cancelable) {
        e.preventDefault();
      }
    };

    // 터치 끝: 임계값(50px) 넘기면 0.2초 화면 밖 슬라이드 후 router.back(), 미만이면 탄성 복귀
    const handleTouchEnd = () => {
      if (!isSwiping.current) {
        startX.current = 0;
        return;
      }

      const container = getContainer();
      const threshold = 50; // 50px 이상 밀면 뒤로가기 확정

      if (container) {
        container.style.transition = 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)';

        if (currentX.current > threshold) {
          // 화면 오른쪽 밖으로 스르륵 0.2초 슬라이드 아웃
          container.style.transform = `translateX(100vw)`;

          if (overlayRef.current) {
            overlayRef.current.style.transition = 'opacity 0.2s ease-out';
            overlayRef.current.style.opacity = '0';
          }

          setTimeout(() => {
            router.back();
            setTimeout(() => {
              if (container) {
                container.style.transition = 'none';
                container.style.transform = '';
                container.style.zIndex = '';
              }
              removeOverlay();
            }, 50);
          }, 180);
        } else {
          // 50px 미만: 제자리 부드러운 탄성 복귀
          container.style.transform = '';

          if (overlayRef.current) {
            overlayRef.current.style.transition = 'opacity 0.2s ease-out';
            overlayRef.current.style.opacity = '0';
          }

          setTimeout(() => {
            removeOverlay();
            if (container) {
              container.style.zIndex = '';
            }
          }, 200);
        }
      } else {
        if (currentX.current > threshold) {
          router.back();
        }
      }

      startX.current = 0;
      currentX.current = 0;
      isSwiping.current = false;
    };

    // PC 브라우저 마우스 테스트 지원
    const handleMouseDown = (e: MouseEvent) => {
      const maxEdge = Math.min(window.innerWidth * 0.25, 80);
      if (e.clientX > maxEdge) return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      currentX.current = 0;
      isSwiping.current = false;
      const container = getContainer();
      if (container) container.style.transition = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (startX.current === 0) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;

      if (!isSwiping.current) {
        if (Math.abs(dy) > Math.abs(dx) || dx < 0) {
          startX.current = 0;
          return;
        }
        isSwiping.current = true;
        createOverlay();
      }

      currentX.current = Math.max(0, dx);
      const container = getContainer();
      if (container) container.style.transform = `translateX(${currentX.current}px)`;
      if (overlayRef.current) {
        const progress = Math.min(currentX.current / window.innerWidth, 1);
        overlayRef.current.style.opacity = `${0.35 * (1 - progress)}`;
      }
    };

    const handleMouseUp = () => {
      handleTouchEnd();
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      removeOverlay();
      const container = getContainer();
      if (container) {
        container.style.transition = '';
        container.style.transform = '';
        container.style.zIndex = '';
      }
    };
  }, [pathname, router]);
}
