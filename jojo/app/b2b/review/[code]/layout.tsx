import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '장지 시설 후기 작성 | 부고온',
    description: '이용하신 장지 시설에 대한 소중한 후기를 남겨주세요.',
    robots: { index: false, follow: false },
    openGraph: {
        title: '장지 시설 후기 작성 | 부고온',
        description: '이용하신 장지 시설에 대한 소중한 후기를 남겨주세요.',
        siteName: '부고온',
        locale: 'ko_KR',
        images: [{ url: 'https://bugoon.maeumbugo.co.kr/og-bugoon.png?v=2', width: 1200, height: 630, alt: '부고온' }],
    },
};

export default function B2BReviewLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
