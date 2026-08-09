'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * 화면 왼쪽 가장자리에서 오른쪽으로 스와이프하면
 * 손가락을 따라 화면이 밀리면서 뒤로가기 실행
 * + 뒤에 어두운 배경 깊이감 처리
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
    // 메인 탭 페이지에서는 뒤로갈 곳이 없으므로 스와이프 비활성화
    const noSwipePaths = ['/b2b/dashboard', '/b2b/login', '/b2b'];
    if (noSwipePaths.includes(pathname)) return;

    const getContainer = () => document.getElementById('b2b-page-container');

    // 어두운 배경 오버레이 생성
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

      // 페이지 컨테이너를 오버레이 위에 올림
      container.style.position = 'relative';
      container.style.zIndex = '100';
    };

    // 오버레이 제거
    const removeOverlay = () => {
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
    };

    // 터치 시작: 왼쪽 가장자리(30px 이내)에서만 스와이프 시작
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX > 30) return;

      startX.current = touch.clientX;
      startY.current = touch.clientY;
      currentX.current = 0;
      isSwiping.current = false;

      const container = getContainer();
      if (container) {
        container.style.transition = 'none';
      }
    };

    // 터치 이동: 손가락 따라 화면이 오른쪽으로 밀림
    const handleTouchMove = (e: TouchEvent) => {
      if (startX.current === 0) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      // 처음 움직임: 수평 vs 수직 판단
      if (!isSwiping.current) {
        if (Math.abs(dy) > Math.abs(dx)) {
          startX.current = 0;
          return;
        }
        if (dx < 0) {
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

      // 배경 오버레이: 밀수록 점점 밝아짐 (최대 0.4 → 0)
      if (overlayRef.current) {
        const progress = Math.min(currentX.current / window.innerWidth, 1);
        overlayRef.current.style.opacity = `${0.4 * (1 - progress)}`;
      }

      if (dx > 10 && e.cancelable) {
        e.preventDefault();
      }
    };

    // 터치 끝: 충분히 밀었으면 뒤로가기, 아니면 원래 위치로 복귀
    const handleTouchEnd = () => {
      if (!isSwiping.current) {
        startX.current = 0;
        return;
      }

      const container = getContainer();
      const threshold = window.innerWidth * 0.3;

      if (container) {
        container.style.transition = 'transform 0.25s ease-out';

        if (currentX.current > threshold) {
          // 뒤로가기 실행: 화면 밖으로 완전히 밀어냄
          container.style.transform = `translateX(${window.innerWidth}px)`;

          if (overlayRef.current) {
            overlayRef.current.style.transition = 'opacity 0.25s ease-out';
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
          }, 200);
        } else {
          // 원래 위치로 스르륵 복귀
          container.style.transform = '';

          if (overlayRef.current) {
            overlayRef.current.style.transition = 'opacity 0.25s ease-out';
            overlayRef.current.style.opacity = '0';
          }

          setTimeout(() => {
            removeOverlay();
            if (container) {
              container.style.zIndex = '';
            }
          }, 250);
        }
      }

      startX.current = 0;
      currentX.current = 0;
      isSwiping.current = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
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
