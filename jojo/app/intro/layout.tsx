import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '부고온플러스 - 장례지도사 & 상조사를 위한 B2B 모바일 부고 솔루션',
    description: '화환 판매 1건당 최대 65,000원 적립, 동료 추천 시 평생 건당 3,500원 연금 보너스! 앱 설치 없이 10초 만에 시작하는 대한민국 1등 장례지도사 전용 부고 솔루션.',
    keywords: '부고온, 부고온플러스, 장례지도사, 상조회사, 모바일부고장, 근조화환수당, 부고장정산, 장례식장부고, 장례지도사수수료',
    alternates: {
        canonical: 'https://bugoonplus.maeumbugo.co.kr',
    },
    openGraph: {
        title: '부고온플러스 - 장례지도사 & 상조사를 위한 1등 부고 솔루션',
        description: '화환 판매 1건당 최대 65,000원 즉시 출금! 앱 설치 없는 10초 부고장 제작 및 상조 본사 정산서 자동화.',
        type: 'website',
        url: 'https://bugoonplus.maeumbugo.co.kr',
        siteName: '부고온플러스',
        locale: 'ko_KR',
        images: [
            {
                url: 'https://maeumbugo.co.kr/og-maeumbugo.png',
                width: 1200,
                height: 630,
                alt: '부고온플러스 - 장례지도사의 든든한 파트너',
            },
        ],
    },
};

export default function IntroLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
