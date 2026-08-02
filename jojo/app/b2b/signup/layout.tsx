import React from 'react';

export const metadata = {
  title: '부고온 파트너 회원가입',
  description: '부고온 B2B 파트너 전용 회원가입 및 추천인 혜택 안내',
  openGraph: {
    title: '부고온 파트너 회원가입',
    description: '부고온 B2B 파트너 전용 서비스 - 모바일 부고장 작성 및 정산 플랫폼',
    type: 'website',
    url: 'https://bugoon.maeumbugo.co.kr/b2b/signup',
    siteName: '부고온 B2B 파트너',
    locale: 'ko_KR',
    images: [
      {
        url: 'https://bugoon.maeumbugo.co.kr/og-bugoon.png',
        width: 1200,
        height: 630,
        alt: '부고온 B2B 파트너',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '부고온 파트너 회원가입',
    description: '부고온 B2B 파트너 전용 서비스',
    images: ['https://bugoon.maeumbugo.co.kr/og-bugoon.png'],
  },
};

export default function B2BSignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
