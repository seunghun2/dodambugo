import { Metadata } from 'next';
import GuideContent from './GuideContent';

export const metadata: Metadata = {
    title: '장례 가이드 - 절차, 비용, 예절, 장례식장 검색 | 마음부고',
    description: '갑작스러운 이별에 당황하지 않도록, 장례 절차·비용·예절·장례식장 찾기까지 장례의 모든 것을 안내합니다. 처음 장례를 치르는 분들을 위한 실용적인 가이드.',
    keywords: ['장례 가이드', '장례 절차', '장례 비용', '장례 예절', '장례식장 찾기', '조문 예절', '3일장', '장례 준비'],
    openGraph: {
        title: '장례 가이드 - 장례의 모든 것 | 마음부고',
        description: '장례 절차, 비용, 예절, 장례식장 찾기까지. 마음부고가 장례의 모든 것을 안내합니다.',
        url: 'https://maeumbugo.co.kr/guide',
        siteName: '마음부고',
        type: 'website',
        locale: 'ko_KR',
    },
    alternates: {
        canonical: 'https://maeumbugo.co.kr/guide',
    },
};

const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '마음부고 장례 가이드 목록',
    description: '장례에 필요한 모든 정보를 한눈에',
    itemListElement: [
        {
            '@type': 'ListItem',
            position: 1,
            name: '모바일 부고장',
            url: 'https://maeumbugo.co.kr/guide/mobile-bugo',
        },
        {
            '@type': 'ListItem',
            position: 2,
            name: '장례 절차 가이드',
            url: 'https://maeumbugo.co.kr/guide/procedure',
        },
        {
            '@type': 'ListItem',
            position: 3,
            name: '장례 비용 가이드',
            url: 'https://maeumbugo.co.kr/guide/cost',
        },
        {
            '@type': 'ListItem',
            position: 4,
            name: '장례 예절 가이드',
            url: 'https://maeumbugo.co.kr/guide/etiquette',
        },
        {
            '@type': 'ListItem',
            position: 5,
            name: '장례식장 찾기',
            url: 'https://maeumbugo.co.kr/guide/funeral-home',
        },
    ],
};

export default function GuidePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />
            <GuideContent />
        </>
    );
}
