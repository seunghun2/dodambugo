'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function B2BTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // B2B 어드민 페이지(/b2b/admin/...)는 사이드바 레이아웃 형태이므로 전체 슬라이딩 애니메이션에서 제외
  const isAdminPage = pathname?.startsWith('/b2b/admin');

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        ease: 'easeInOut', 
        duration: 0.15 
      }}
      style={{ 
        width: '100%', 
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {children}
    </motion.div>
  );
}
