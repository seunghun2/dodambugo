import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '모바일쿠폰 답례품',
    description: '전하고 싶은 마음을 담은 답례품, 감사의 순간에 정성을 더합니다.',
    robots: { index: false, follow: false },
    openGraph: {
        title: '모바일쿠폰 답례품',
        description: '전하고 싶은 마음을 담은 답례품, 감사의 순간에 정성을 더합니다.',
        type: 'website',
        siteName: '마음부고',
        locale: 'ko_KR',
        images: [
            {
                url: 'https://maeumbugo.co.kr/og-gift-v1.jpg',
                width: 1200,
                height: 600,
                alt: '모바일쿠폰 답례품',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '모바일쿠폰 답례품',
        description: '전하고 싶은 마음을 담은 답례품, 감사의 순간에 정성을 더합니다.',
        images: ['https://maeumbugo.co.kr/og-gift-v1.jpg'],
    },
};

export default function ThanksGiftLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
