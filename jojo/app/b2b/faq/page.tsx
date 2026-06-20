'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function B2BFAQRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // 설정 페이지의 FAQ 뷰로 리다이렉트 처리하여 레이아웃 불일치를 방지합니다.
    router.replace('/b2b/settings?view=faq');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <p style={{ color: '#8E94A0', fontSize: '14px' }}>로딩 중...</p>
    </div>
  );
}
