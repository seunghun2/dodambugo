import { Metadata } from 'next';
import ProcedureContent from './ProcedureContent';

export const metadata: Metadata = {
    title: '장례 절차 가이드 - 임종부터 발인까지 3일장 안내 | 마음부고',
    description: '3일장 장례 절차를 1일차부터 3일차까지 상세하게 안내합니다. 임종 후 해야 할 일, 사망진단서 발급, 장례식장 선택, 염습, 조문 접수, 발인, 화장 및 봉안까지 모든 과정을 알려드립니다.',
    keywords: ['장례 절차', '3일장 절차', '장례 순서', '임종 후 절차', '사망신고', '발인 절차', '화장 절차', '장례 준비', '장례식 순서', '장례 가이드'],
    openGraph: {
        title: '장례 절차 가이드 - 3일장 완벽 안내 | 마음부고',
        description: '임종부터 발인까지, 3일간의 장례 절차를 한눈에. 처음 상을 치르는 분들을 위한 상세 가이드.',
        url: 'https://maeumbugo.co.kr/guide/procedure',
        siteName: '마음부고',
        type: 'article',
        locale: 'ko_KR',
    },
    alternates: {
        canonical: 'https://maeumbugo.co.kr/guide/procedure',
    },
};

const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '3일장 장례 절차 가이드',
    description: '임종부터 발인까지 3일간의 장례 절차를 단계별로 안내합니다.',
    step: [
        {
            '@type': 'HowToStep',
            name: '1일차 - 임종 및 장례 준비',
            text: '사망진단서 발급, 장례식장 선정 및 이동, 장의사 계약, 안치, 부고 알림 등을 진행합니다.',
            position: 1,
        },
        {
            '@type': 'HowToStep',
            name: '2일차 - 염습 및 조문 접수',
            text: '고인의 염습과 입관을 진행하고, 조문객을 맞이하며 방명록 접수와 부의금을 관리합니다.',
            position: 2,
        },
        {
            '@type': 'HowToStep',
            name: '3일차 - 발인 및 장지',
            text: '발인제를 진행하고, 영구차로 화장장 또는 장지로 이동하여 화장 및 봉안 또는 매장을 합니다.',
            position: 3,
        },
        {
            '@type': 'HowToStep',
            name: '사후 처리',
            text: '사망신고, 보험 및 연금 청구, 재산 정리, 49재 등 추가 절차를 진행합니다.',
            position: 4,
        },
    ],
};

export default function ProcedurePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
            />
            <ProcedureContent />
        </>
    );
}
