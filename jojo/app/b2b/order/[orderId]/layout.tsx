import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '주문 내역 확인 | 부고온',
    description: '부고온 주문 및 발송 내역을 확인하실 수 있습니다.',
    robots: { index: false, follow: false },
    openGraph: {
        title: '주문 내역 확인 | 부고온',
        description: '부고온 주문 및 발송 내역을 확인하실 수 있습니다.',
        siteName: '부고온',
        locale: 'ko_KR',
        images: [{ url: 'https://bugoon.maeumbugo.co.kr/og-bugoon.png?v=2', width: 1200, height: 630, alt: '부고온' }],
    },
};

export default function B2BOrderDetailLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
