import { Metadata } from 'next';
import CostContent from './CostContent';

export const metadata: Metadata = {
    title: '장례 비용 가이드 - 항목별 예상 비용 총정리 | 마음부고',
    description: '장례 비용을 항목별로 상세하게 안내합니다. 장례식장 빈소 비용, 장례 용품, 화장·봉안·자연장 비용, 상조 서비스 비교, 비용 절약 팁까지. 3일장 평균 1,000~1,500만원의 구체적인 내역을 확인하세요.',
    keywords: ['장례 비용', '장례식 비용', '장례식장 비용', '화장 비용', '봉안당 비용', '자연장 비용', '상조 서비스 비용', '장례 용품 가격', '장례 비용 절약', '3일장 비용'],
    openGraph: {
        title: '장례 비용 가이드 - 항목별 예상 비용 | 마음부고',
        description: '3일장 평균 1,000~1,500만원. 장례식장, 용품, 장지 등 항목별 예상 비용을 확인해 보세요.',
        url: 'https://maeumbugo.co.kr/guide/cost',
        siteName: '마음부고',
        type: 'article',
        locale: 'ko_KR',
    },
    alternates: {
        canonical: 'https://maeumbugo.co.kr/guide/cost',
    },
};

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: '장례 비용은 평균 얼마나 드나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '일반적인 3일장 기준으로 평균 약 1,000만~1,500만원 정도 소요됩니다. 장례식장(150~400만원), 장례 용품(150~500만원), 화장/봉안(50~300만원), 음식/접대(200~400만원), 기타(100~200만원) 등으로 구성됩니다.',
            },
        },
        {
            '@type': 'Question',
            name: '장례식장 빈소 비용은 얼마인가요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '병원 장례식장은 1일 30~60만원, 전문 장례식장은 50~100만원 정도이며, 3일장 기준 총 150~400만원 수준입니다. 빈소 공간, 제단 장식, 식사, 주차장 포함 여부에 따라 달라집니다.',
            },
        },
        {
            '@type': 'Question',
            name: '화장 비용은 얼마인가요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '공설 화장장의 경우 자치구민은 1~5만원, 타지역은 10~30만원 수준입니다. 봉안당 안치 비용은 50~300만원, 자연장은 30~100만원 정도입니다.',
            },
        },
        {
            '@type': 'Question',
            name: '상조 서비스를 이용하면 장례 비용이 줄어드나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '상조 서비스는 월 납부금으로 장례 용품과 서비스를 패키지로 제공받는 형태입니다. 일시적인 비용 부담은 줄지만, 총합계로 보면 개별 구매보다 비쌀 수 있으므로 계약 전 비교가 필요합니다.',
            },
        },
    ],
};

const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: '마음부고', item: 'https://maeumbugo.co.kr' },
        { '@type': 'ListItem', position: 2, name: '장례가이드', item: 'https://maeumbugo.co.kr/guide' },
        { '@type': 'ListItem', position: 3, name: '장례 비용', item: 'https://maeumbugo.co.kr/guide/cost' },
    ],
};

export default function CostPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <CostContent />
        </>
    );
}
