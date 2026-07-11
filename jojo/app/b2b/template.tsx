'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function B2BTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [direction, setDirection] = useState<'forward' | 'backward' | 'instant'>('instant');
  const [prevPath, setPrevPath] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const TAB_ROUTES = [
      '/b2b/dashboard',
      '/b2b/manage',
      '/b2b/wallet',
      '/b2b/settings'
    ];

    const prevTabIdx = TAB_ROUTES.indexOf(prevPath);
    const currTabIdx = TAB_ROUTES.indexOf(pathname);

    // 1. 둘 다 하단 탭바 영역 간의 전환인 경우: 복잡한 좌우 슬라이드 배제 (즉시 전환)
    if (prevTabIdx !== -1 && currTabIdx !== -1) {
      setDirection('instant');
    } else {
      // 2. 서브 페이지가 낀 진입/이탈 라우팅의 경우: 슬라이드 애니메이션 작동
      const historyStr = sessionStorage.getItem('b2b_route_history');
      let history: string[] = historyStr ? JSON.parse(historyStr) : [];

      if (history.length === 0) {
        history.push(pathname);
        sessionStorage.setItem('b2b_route_history', JSON.stringify(history));
        setDirection('instant');
        setPrevPath(pathname);
        return;
      }

      const lastIdx = history.length - 1;

      if (history[lastIdx] === pathname) {
        setPrevPath(pathname);
        return;
      }

      // 뒤로가기 판별 (스택의 바로 전 단계 페이지로 돌아간 경우)
      if (history.length > 1 && history[lastIdx - 1] === pathname) {
        setDirection('backward');
        history.pop();
      } else {
        // 앞으로 가기 판별 (새로운 페이지 진입)
        setDirection('forward');
        history.push(pathname);
      }

      sessionStorage.setItem('b2b_route_history', JSON.stringify(history));
    }

    setPrevPath(pathname);
  }, [pathname, prevPath]);

  // instant 일 때는 x축 밀림 없이 즉각 100% 투명도로 노출
  const startX = direction === 'instant' ? 0 : (direction === 'forward' ? '100%' : '-100%');
  const duration = direction === 'instant' ? 0 : 0.28;
  const initialOpacity = direction === 'instant' ? 1.0 : 0.95;

  return (
    <motion.div
      key={pathname}
      initial={{ x: startX, opacity: initialOpacity }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ 
        ease: [0.33, 1, 0.68, 1], // iOS 네이티브 스프링 감성의 속도 곡선
        duration: duration
      }}
      style={{ 
        width: '100%', 
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {children}
    </motion.div>
  );
}
