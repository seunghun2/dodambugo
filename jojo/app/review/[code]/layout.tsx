import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '장지 시설 후기 작성 | 마음부고',
    description: '이용하신 장지 시설에 대한 소중한 후기를 남겨주세요.',
    robots: { index: false, follow: false },
    openGraph: {
        title: '장지 시설 후기 작성 | 마음부고',
        description: '이용하신 장지 시설에 대한 소중한 후기를 남겨주세요.',
        siteName: '마음부고',
        locale: 'ko_KR',
        images: [{ url: 'https://maeumbugo.co.kr/og-maeumbugo.png', width: 1024, height: 1024, alt: '마음부고' }],
    },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
