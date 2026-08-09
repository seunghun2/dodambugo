'use client';

import { useEffect, useRef } from 'react';

interface UseSwipeTabOptions {
  onPrevTab?: () => void;
  onNextTab?: () => void;
  enabled?: boolean;
}

/**
 * 인위적인 DOM 트랜스폼/투명도 효과 없이
 * 손가락 좌우 스와이프 제스처만 깔끔하게 감지하여 탭을 전환하는 가벼운 훅
 */
export function useSwipeTab({ onPrevTab, onNextTab, enabled = true }: UseSwipeTabOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwipingTab = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX <= 30) return; // 엣지 뒤로가기 양보

      startX.current = touch.clientX;
      startY.current = touch.clientY;
      isSwipingTab.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipingTab.current || startX.current === 0) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      if (Math.abs(dx) > 25 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwipingTab.current || startX.current === 0) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      // 45px 이상 슥 밀었을 때 깔끔하게 탭 전환
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0 && onNextTab) {
          onNextTab();
        } else if (dx > 0 && onPrevTab) {
          onPrevTab();
        }
      }

      startX.current = 0;
      startY.current = 0;
      isSwipingTab.current = false;
    };

    // 마우스 드래그 지원 (개발자 도구용)
    const handleMouseDown = (e: MouseEvent) => {
      if (e.clientX <= 40) return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      isSwipingTab.current = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isSwipingTab.current || startX.current === 0) return;

      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;

      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0 && onNextTab) {
          onNextTab();
        } else if (dx > 0 && onPrevTab) {
          onPrevTab();
        }
      }

      startX.current = 0;
      startY.current = 0;
      isSwipingTab.current = false;
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
  }, [onPrevTab, onNextTab, enabled]);
}
