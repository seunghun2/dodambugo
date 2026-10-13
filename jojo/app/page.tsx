import { Metadata } from 'next';
import HomeContent from './HomeContent';

export const metadata: Metadata = {
    title: '마음부고 - 무료 모바일 부고장 만들기 | 3분 완성 부고장 양식·카카오톡 공유',
    description: '부고장·모바일 부고장을 3분 만에 무료로 만드세요. 회원가입·앱 설치·광고 없이 4가지 품격 있는 부고장 양식 제공, 카카오톡·문자 간편 공유, 장례 절차·비용·예절 가이드와 전국 장례식장 검색까지.',
    keywords: '부고장, 마음부고, 모바일 부고장, 무료 부고장, 부고장 만들기, 모바일부고장, 부고장 양식, 부고장 예시, 부고 제작, 부고 만들기, 모바일부고, 부고문자, 카카오톡 부고장, 온라인 부고장, 디지털 부고장, 장례식장, 장례 비용, 장례 절차',
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

// 통합 구조화 데이터 (SSR 단계에서 단일 출력, 화면 FAQ 텍스트와 100% 일치)
const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Organization',
            '@id': 'https://maeumbugo.co.kr/#organization',
            name: '마음부고',
            url: 'https://maeumbugo.co.kr',
            logo: 'https://maeumbugo.co.kr/images/logo.png',
            contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                url: 'https://maeumbugo.co.kr/contact',
            },
            address: {
                '@type': 'PostalAddress',
                addressLocality: '서울특별시',
                addressRegion: '강남구',
                streetAddress: '압구정로 306',
                addressCountry: 'KR',
            },
        },
        {
            '@type': 'WebSite',
            '@id': 'https://maeumbugo.co.kr/#website',
            url: 'https://maeumbugo.co.kr',
            name: '마음부고',
            alternateName: ['마음부고 부고장', '마음부고 모바일 부고장'],
            description: '3분 만에 만드는 품격 있는 무료 모바일 부고장',
            publisher: {
                '@id': 'https://maeumbugo.co.kr/#organization',
            },
            potentialAction: {
                '@type': 'SearchAction',
                target: 'https://maeumbugo.co.kr/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
            },
            inLanguage: 'ko-KR',
        },
        {
            '@type': 'WebApplication',
            '@id': 'https://maeumbugo.co.kr/#app',
            name: '마음부고 - 무료 모바일 부고장 만들기',
            url: 'https://maeumbugo.co.kr/create',
            applicationCategory: 'LifestyleApplication',
            operatingSystem: 'Web',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'KRW',
            },
            description: '무료 모바일 부고장 제작 서비스. 회원가입 없이 3분 만에 부고장을 만들고 카카오톡, 문자로 공유할 수 있습니다.',
            featureList: [
                '무료 모바일 부고장 제작',
                '4가지 품격 있는 부고장 템플릿',
                '카카오톡·문자 간편 공유',
                '전국 장례식장 지도·내비게이션 연동',
                '부의금 계좌 안내 및 근조화환 전달',
                '광고 없음, 회원가입 불필요',
            ],
            inLanguage: 'ko-KR',
        },
        {
            '@type': 'FAQPage',
            '@id': 'https://maeumbugo.co.kr/#faq',
            mainEntity: [
                {
                    '@type': 'Question',
                    name: '회원가입 없이 이용 가능한가요?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: '네, 회원가입이나 로그인 없이 바로 부고장을 만들 수 있습니다. 간단한 정보 입력만으로 완성됩니다.',
                    },
                },
                {
                    '@type': 'Question',
                    name: '앱 설치 없이도 사용할 수 있나요?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: '네, 별도의 앱 설치 없이 모바일 웹에서 바로 이용 가능합니다. 카카오톡, 문자, 밴드로 공유하세요.',
                    },
                },
                {
                    '@type': 'Question',
                    name: '부고장은 언제까지 유지되나요?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: '개인정보 보호를 위해 발인 후 30일까지 열람 가능합니다. 이후에는 자동으로 비공개 처리됩니다.',
                    },
                },
                {
                    '@type': 'Question',
                    name: '서비스 이용 중 문의는 어떻게 하나요?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: '문의는 제휴/문의 페이지를 통해 가능합니다. 빠른 시간 내에 답변 드리겠습니다.',
                    },
                },
            ],
        },
    ],
};

export default function Page() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
            />
            <HomeContent />
        </>
    );
}
