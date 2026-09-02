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
    // 1. 모바일 브라우저를 위한 히스토리 앵커 삽입
    const anchorState = { appAnchor: true, path: pathname, t: Date.now() };
    window.history.pushState(anchorState, '', window.location.href);

    const handleBack = () => {
      const currentPath = window.location.pathname;

      // 1. 열려있는 모달/팝업이 있으면 모달 닫기
      const activeModalCloseBtn = document.querySelector(
        '.recipient-modal-overlay .btn-modal-close, .flower-modal-overlay .btn-modal-close, .modal-close, [data-modal-close="true"], .account-modal-close, .share-modal-close'
      ) as HTMLElement;

      if (activeModalCloseBtn) {
        window.history.pushState({ appAnchor: true }, '', window.location.href);
        activeModalCloseBtn.click();
        return;
      }

      // 2. 홈 / 대시보드 화면인 경우 (2회 누르면 종료)
      const isHome = currentPath === '/b2b/dashboard' || currentPath === '/b2b' || currentPath === '/b2b/' || currentPath === '/';
      if (isHome) {
        if (backPressedRef.current) {
          // 2번째 누름: 앱 정상 종료
          if (Capacitor.isNativePlatform()) {
            import('@capacitor/app').then(({ App }) => App.exitApp()).catch(() => {});
          } else {
            window.history.back();
          }
        } else {
          // 1번째 누름: 앱 꺼짐 차단 + 토스트 안내
          window.history.pushState({ appAnchor: true }, '', window.location.href);
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

      // 3. 부고 완료 화면 -> 부고 수정 화면으로 복귀
      if (currentPath.startsWith('/b2b/create/complete')) {
        const bugoNumber = currentPath.split('/').pop();
        window.history.pushState({ appAnchor: true }, '', `/b2b/create?edit=${bugoNumber}`);
        router.replace(`/b2b/create?edit=${bugoNumber}`);
        return;
      }

      // 4. 부고 제작/수정 화면
      if (currentPath.startsWith('/b2b/create')) {
        const search = window.location.search;
        if (search.includes('edit=')) {
          window.history.pushState({ appAnchor: true }, '', '/b2b/manage');
          router.replace('/b2b/manage');
        } else {
          window.history.pushState({ appAnchor: true }, '', '/b2b/dashboard');
          router.replace('/b2b/dashboard');
        }
        return;
      }

      // 5. B2B 서브 페이지들 (부고관리, 적립금, 설정, 제례의식, 공지사항, 문의 등)
      if (currentPath.startsWith('/b2b/')) {
        window.history.pushState({ appAnchor: true }, '', '/b2b/dashboard');
        router.replace('/b2b/dashboard');
        return;
      }

      // 6. 부고장 뷰어 화면 (/view/[id] 또는 /b2b/view/[id])
      if (currentPath.includes('/view/')) {
        // B2B 지도사 계정으로 로그인되어 있다면 대시보드로 이동
        const token = typeof window !== 'undefined' ? localStorage.getItem('b2b_token') : null;
        if (token) {
          window.history.pushState({ appAnchor: true }, '', '/b2b/dashboard');
          router.replace('/b2b/dashboard');
        } else {
          if (window.history.length > 2) {
            router.back();
          } else {
            router.replace('/');
          }
        }
        return;
      }

      // 7. 기타 기본 뒤로가기
      if (window.history.length > 2) {
        router.back();
      } else {
        router.replace('/');
      }
    };

    // 브라우저 popstate 이벤트 리스너
    const onPopState = (e: PopStateEvent) => {
      handleBack();
    };
    window.addEventListener('popstate', onPopState);

    // Capacitor Native Android 백버튼 리스너 등록 (앱 꺼짐 100% 방지)
    let removeNativeListener: (() => void) | null = null;
    const initCapacitorBack = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('backButton', () => {
          handleBack();
        });
        removeNativeListener = () => listener.remove();
      } catch {
        try {
          if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.App) {
            (window as any).Capacitor.Plugins.App.addListener('backButton', () => {
              handleBack();
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
