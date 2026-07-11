'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function B2BTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ x: '12%', opacity: 0.9 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ 
        ease: [0.33, 1, 0.68, 1], // iOS 네이티브 감성의 cubic-bezier 곡선
        duration: 0.24
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
