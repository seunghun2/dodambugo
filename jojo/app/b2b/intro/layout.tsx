import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
    title: '부고온 | 부고온플러스 - 장례지도사를 위한 모바일 부고 솔루션',
    description: '부고장 작성 1분, 카카오톡 즉시 발송, 당일 개인계좌 정산, 가입비·월 이용료 영구 0원. 장례지도사·상조사를 위한 공식 모바일 부고 솔루션 부고온플러스.',
    keywords: '부고온, 부고온플러스, 부고온 플러스, 모바일 부고장, 장례지도사 부고장, 상조회사, 장례식장, 모바일부고, 부고장 솔루션, 부고장 앱, 부고드림',
    alternates: {
        canonical: 'https://bugoon.maeumbugo.co.kr/intro',
    },
    openGraph: {
        title: '부고온 | 부고온플러스 - 장례지도사를 위한 모바일 부고 솔루션',
        description: '부고장은 1분, 당일 개인계좌 정산, 가입비 영구 0원. 앱과 웹 모두 지원.',
        type: 'website',
        url: 'https://bugoon.maeumbugo.co.kr/intro',
        siteName: '부고온플러스',
        locale: 'ko_KR',
        images: [
            {
                url: 'https://maeumbugo.co.kr/og-bugoon.png',
                width: 1200,
                height: 630,
                alt: '부고온플러스',
            },
        ],
    },
    verification: {
        google: '19Py1zFue07o3TzDBzUlkuiJ_D7fwRBOqh44i21eK10',
        other: {
            'naver-site-verification': '66a39b07b836fb9f07add3bdca299036b4b002fc',
        },
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '부고온',
    alternateName: ['부고온플러스', '부고온 플러스', 'Bugoon', 'Bugoon Plus'],
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Android, iOS, Web',
    downloadUrl: 'https://play.google.com/store/apps/details?id=kr.co.maeumbugo.bugoon',
    installUrl: 'https://play.google.com/store/apps/details?id=kr.co.maeumbugo.bugoon',
    url: 'https://bugoon.maeumbugo.co.kr/intro',
    description: '장례지도사·상조사·장례식장을 위한 1분 모바일 부고 솔루션 부고온플러스. 부고 작성, 카카오톡 공유, 화환 주문 및 당일 정산 지원.',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
    },
    publisher: {
        '@type': 'Organization',
        name: '마음부고',
        url: 'https://maeumbugo.co.kr',
    },
};

export default function BugoonB2BIntroLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Script
                id="bugoon-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}

