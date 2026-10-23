import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '주문 내역 확인 | 마음부고',
    description: '마음부고 주문 및 발송 내역을 확인하실 수 있습니다.',
    robots: { index: false, follow: false },
    openGraph: {
        title: '주문 내역 확인 | 마음부고',
        description: '마음부고 주문 및 발송 내역을 확인하실 수 있습니다.',
        siteName: '마음부고',
        locale: 'ko_KR',
        images: [{ url: 'https://maeumbugo.co.kr/og-maeumbugo.png', width: 1024, height: 1024, alt: '마음부고' }],
    },
};

export default function OrderDetailLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
