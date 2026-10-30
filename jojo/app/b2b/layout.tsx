import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@/components/b2b/common.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '부고온 - 모바일 부고장 서비스',
  description: '정중하고 품격 있는 모바일 부고장 서비스 부고온',
  openGraph: {
    title: '부고온 - 모바일 부고장 서비스',
    description: '정중하고 품격 있는 모바일 부고장 서비스 부고온',
    type: 'website',
    url: 'https://bugoon.maeumbugo.co.kr',
    siteName: '부고온',
    locale: 'ko_KR',
    images: [
      {
        url: 'https://bugoon.maeumbugo.co.kr/og-bugoon.png?v=2',
        width: 1200,
        height: 630,
        alt: '부고온',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '부고온 - 모바일 부고장 서비스',
    description: '정중하고 품격 있는 모바일 부고장 서비스 부고온',
    images: ['https://bugoon.maeumbugo.co.kr/og-bugoon.png?v=2'],
  },
  verification: {
    google: '19Py1zFue07o3TzDBzUlkuiJ_D7fwRBOqh44i21eK10',
    other: {
      'naver-site-verification': '66a39b07b836fb9f07add3bdca299036b4b002fc',
    },
  },
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
