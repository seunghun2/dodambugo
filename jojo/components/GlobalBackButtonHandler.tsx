'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export default function GlobalBackButtonHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const backPressedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. 열려있는 모달/팝업 닫기 함수
    const closeModalIfOpen = (): boolean => {
      const activeModalCloseBtn = document.querySelector(
        '.recipient-modal-overlay .btn-modal-close, .flower-modal-overlay .btn-modal-close, .modal-close, [data-modal-close="true"], .account-modal-close, .share-modal-close, .facility-modal-close'
      ) as HTMLElement;

      if (activeModalCloseBtn) {
        activeModalCloseBtn.click();
        return true;
      }
      return false;
    };

    // 2. 안드로이드 하드웨어 백버튼 / 네이티브 뒤로가기 핸들러
    const handleNativeBack = () => {
      // 1순위: 열려있는 모달이 있으면 모달 닫기
      if (closeModalIfOpen()) return;

      const currentPath = window.location.pathname;

      // 2순위: 최상위 홈/대시보드 화면인 경우 (2회 연속 누르면 앱 종료)
      const isHome = currentPath === '/b2b/dashboard' || currentPath === '/b2b' || currentPath === '/b2b/' || currentPath === '/' || currentPath === '/b2b/login' || currentPath === '/b2b/login/';
      if (isHome) {
        if (backPressedRef.current) {
          if (Capacitor.isNativePlatform()) {
            import('@capacitor/app').then(({ App }) => App.exitApp()).catch(() => {});
          } else {
            window.history.back();
          }
        } else {
          backPressedRef.current = true;
          setToastMessage('뒤로가기 버튼을 한 번 더 누르면 종료됩니다.');

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            backPressedRef.current = false;
            setToastMessage(null);
          }, 2000);
        }
        return;
      }

      // 3순위: 부고 생성 완료 화면 -> 부고 관리 목록으로 안전하게 복귀
      if (currentPath.startsWith('/b2b/create/complete')) {
        router.replace('/b2b/manage');
        return;
      }

      // 4순위: 그 외 모든 일반 화면은 브라우저 히스토리 직전 페이지로 즉시 복귀!
      router.back();
    };

    // 3. 브라우저 popstate (모달 닫기 연동)
    const onPopState = () => {
      closeModalIfOpen();
    };
    window.addEventListener('popstate', onPopState);

    // 4. Capacitor Native Android 백버튼 리스너 등록
    let removeNativeListener: (() => void) | null = null;
    const initCapacitorBack = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('backButton', () => {
          handleNativeBack();
        });
        removeNativeListener = () => listener.remove();
      } catch {
        try {
          if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.App) {
            (window as any).Capacitor.Plugins.App.addListener('backButton', () => {
              handleNativeBack();
            });
          }
        } catch {}
      }
    };
    initCapacitorBack();

    return () => {
      window.removeEventListener('popstate', onPopState);
      if (removeNativeListener) removeNativeListener();
    };
  }, [pathname, router]);

  if (!toastMessage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '28px',
        fontSize: '14px',
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 500,
        zIndex: 999999,
        pointerEvents: 'none',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        whiteSpace: 'nowrap',
        letterSpacing: '-0.3px',
      }}
    >
      {toastMessage}
    </div>
  );
}
