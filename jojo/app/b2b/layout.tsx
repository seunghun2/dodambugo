import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@/components/b2b/common.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '부고온 파트너 - B2B 파트너 서비스',
  description: '부고온 B2B 파트너 서비스 - 장례지도사 및 파트너사를 위한 모바일 부고 플랫폼',
  openGraph: {
    title: '부고온 파트너 - B2B 파트너 회원가입',
    description: '부고온 B2B 파트너 전용 서비스 - 모바일 부고장 작성 및 정산 플랫폼',
    type: 'website',
    url: 'https://bugoon.maeumbugo.co.kr',
    siteName: '부고온 B2B 파트너',
    locale: 'ko_KR',
    images: [
      {
        url: 'https://bugoon.maeumbugo.co.kr/b2b-og-card.png',
        width: 1024,
        height: 500,
        alt: '부고온 B2B 파트너',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '부고온 파트너 - B2B 파트너 서비스',
    description: '부고온 B2B 파트너 전용 서비스',
    images: ['https://bugoon.maeumbugo.co.kr/b2b-og-card.png'],
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
