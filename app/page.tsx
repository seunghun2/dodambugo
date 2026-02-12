import { Metadata } from 'next';
import HomeContent from './HomeContent';

export const metadata: Metadata = {
    title: '마음부고 - 무료 모바일 부고장 만들기 | 3분 완성, 카카오톡 공유',
    description: '무료 모바일 부고장을 3분 만에 만드세요. 4가지 품격 있는 템플릿, 카카오톡 간편 공유, 광고 없음, 회원가입 불필요. 장례 절차·비용·예절 가이드와 전국 장례식장 검색까지.',
    keywords: '모바일 부고장, 무료 부고장, 부고장 만들기, 부고 제작, 부고 만들기, 모바일부고, 부고문자, 카카오톡 부고장, 온라인 부고장, 장례식장, 장례 비용, 장례 절차',
    alternates: {
        canonical: 'https://maeumbugo.co.kr',
    },
    openGraph: {
        title: '마음부고 - 무료 모바일 부고장 만들기',
        description: '3분 만에 만드는 품격 있는 무료 모바일 부고장. 카카오톡 공유, 광고 없음.',
        type: 'website',
        url: 'https://maeumbugo.co.kr',
        siteName: '마음부고',
        locale: 'ko_KR',
        images: [
            {
                url: 'https://maeumbugo.co.kr/og-maeumbugo.png',
                width: 1200,
                height: 630,
                alt: '마음부고 - 무료 모바일 부고장 만들기',
            },
        ],
    },
};

// Organization + WebSite + WebApplication 구조화 데이터
const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Organization',
            '@id': 'https://maeumbugo.co.kr/#organization',
            name: '마음부고',
            url: 'https://maeumbugo.co.kr',
            logo: {
                '@type': 'ImageObject',
                url: 'https://maeumbugo.co.kr/og-maeumbugo.png',
            },
            description: '무료 모바일 부고장 제작 서비스. 3분 만에 품격 있는 부고장을 만들고 카카오톡으로 공유하세요.',
            contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                availableLanguage: 'Korean',
            },
        },
        {
            '@type': 'WebSite',
            '@id': 'https://maeumbugo.co.kr/#website',
            url: 'https://maeumbugo.co.kr',
            name: '마음부고',
            description: '무료 모바일 부고장 만들기 - 3분 완성, 카카오톡 공유',
            publisher: { '@id': 'https://maeumbugo.co.kr/#organization' },
            potentialAction: {
                '@type': 'SearchAction',
                target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://maeumbugo.co.kr/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
            },
        },
        {
            '@type': 'WebApplication',
            '@id': 'https://maeumbugo.co.kr/#app',
            name: '마음부고 - 모바일 부고장 만들기',
            url: 'https://maeumbugo.co.kr/create',
            applicationCategory: 'LifestyleApplication',
            operatingSystem: 'Web',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'KRW',
            },
            description: '무료 모바일 부고장 제작 도구. 회원가입 없이 3분 만에 부고장을 만들고 카카오톡, 문자로 공유할 수 있습니다.',
            featureList: [
                '무료 모바일 부고장 제작',
                '4가지 프리미엄 템플릿',
                '카카오톡 간편 공유',
                '장례식장 지도 안내',
                '실시간 조문 메시지',
                '광고 없음, 회원가입 불필요',
            ],
        },
    ],
};

export default function Page() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
            />
            <HomeContent />
        </>
    );
}
