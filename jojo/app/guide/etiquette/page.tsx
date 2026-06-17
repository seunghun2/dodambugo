import { Metadata } from 'next';
import EtiquetteContent from './EtiquetteContent';

export const metadata: Metadata = {
    title: '장례 예절 가이드 - 조문 복장, 절하는 법, 부의금 | 마음부고',
    description: '처음 조문가는 분을 위한 장례 예절 완벽 가이드. 조문객 복장, 상주 복장, 절하는 방법, 부의금 봉투 쓰는 법, 위로의 말까지 현대적인 조문 예절을 알려드립니다.',
    keywords: ['장례 예절', '조문 예절', '조문 복장', '장례식 복장', '절하는 법', '부의금 봉투', '부의금 쓰는 법', '조문 인사말', '상주 복장', '장례식 예절'],
    openGraph: {
        title: '장례 예절 가이드 - 조문 복장, 절하는 법, 부의금 | 마음부고',
        description: '처음 조문가는 분을 위한 장례 예절 완벽 가이드. 복장부터 인사말까지 한번에 알아보세요.',
        url: 'https://maeumbugo.co.kr/guide/etiquette',
        siteName: '마음부고',
        type: 'article',
        locale: 'ko_KR',
    },
    alternates: {
        canonical: 'https://maeumbugo.co.kr/guide/etiquette',
    },
};

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: '장례식 조문할 때 어떤 옷을 입어야 하나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '남성은 어두운 색 정장이나 깔끔한 캐주얼, 여성은 검정·남색·회색 등 차분한 색상의 옷이면 됩니다. 요즘은 넥타이 필수가 아니며, 깔끔한 운동화도 괜찮습니다.',
            },
        },
        {
            '@type': 'Question',
            name: '조문 순서는 어떻게 되나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '1. 접수대에서 방명록 작성 및 부의금 전달 2. 영정 앞에서 분향 또는 헌화 3. 절 2번 4. 상주에게 가볍게 절하고 위로의 말 5. 식사 권유 시 함께하거나 인사 후 퇴장',
            },
        },
        {
            '@type': 'Question',
            name: '부의금 봉투에 뭐라고 쓰나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '봉투 앞면에 "부의(賻儀)" 또는 "근조(謹弔)"라고 쓰고, 뒷면 왼쪽 하단에 본인 이름을 세로로 씁니다. 장례식장 봉투에 이미 인쇄된 경우가 많습니다.',
            },
        },
        {
            '@type': 'Question',
            name: '장례식에서 절은 몇 번 하나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '영정 앞에서 절을 2번 합니다. 종교가 다르면 묵념이나 기도로 대신해도 전혀 문제없습니다.',
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
        { '@type': 'ListItem', position: 3, name: '장례 예절', item: 'https://maeumbugo.co.kr/guide/etiquette' },
    ],
};

export default function EtiquettePage() {
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
            <EtiquetteContent />
        </>
    );
}
