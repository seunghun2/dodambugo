import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@/components/b2b/common.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '부고온 파트너',
  description: '부고온 B2B 파트너 앱 - 화환 판매로 수익을 만드세요',
};

import { B2BLayoutClient } from '@/components/b2b/B2BLayoutClient';

export default function B2BLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // MainLayout(상단 네비바) 없이 children만 렌더링
  // 앱으로 래핑될 화면이므로 독립 레이아웃 사용
  return (
    <B2BLayoutClient>
      {children}
    </B2BLayoutClient>
  );
}
