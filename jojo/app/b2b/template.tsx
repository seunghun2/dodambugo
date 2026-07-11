'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function B2BTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
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

    // 1. 둘 다 하단 탭 메뉴 영역인 경우: 배치 순서(인덱스) 크기로 슬라이딩 방향 결정
    if (prevTabIdx !== -1 && currTabIdx !== -1) {
      if (currTabIdx < prevTabIdx) {
        setDirection('backward');
      } else {
        setDirection('forward');
      }
    } else {
      // 2. 서브 페이지가 끼어 있는 일반 라우팅의 경우: 브라우저 히스토리 스택 추적
      const historyStr = sessionStorage.getItem('b2b_route_history');
      let history: string[] = historyStr ? JSON.parse(historyStr) : [];

      if (history.length === 0) {
        history.push(pathname);
        sessionStorage.setItem('b2b_route_history', JSON.stringify(history));
        setDirection('forward');
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

  // 네이티브 앱 조작감: 앞으로 갈 때는 오른쪽(30%)에서, 뒤로 갈 때는 왼쪽(-30%)에서 등장
  const startX = direction === 'forward' ? '30%' : '-30%';

  return (
    <motion.div
      key={pathname}
      initial={{ x: startX, opacity: 0.95 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ 
        ease: [0.33, 1, 0.68, 1], // iOS 네이티브 스프링 감성의 속도 곡선
        duration: 0.28
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
