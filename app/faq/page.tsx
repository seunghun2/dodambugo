import { Metadata } from 'next';
import FAQContent from './FAQContent';

export const metadata: Metadata = {
    title: '자주 묻는 질문 - 모바일 부고장 무료 제작 FAQ | 마음부고',
    description: '마음부고 모바일 부고장에 대해 자주 묻는 질문을 정리했습니다. 무료 이용, 회원가입 불필요, 카카오톡 공유, 부고장 수정·삭제, 개인정보 보호 등 궁금한 점을 확인하세요.',
    keywords: ['모바일 부고장 무료', '부고장 만들기 FAQ', '마음부고 질문', '부고장 공유 방법', '부고장 수정', '부고장 삭제'],
    openGraph: {
        title: '자주 묻는 질문 - 모바일 부고장 FAQ | 마음부고',
        description: '마음부고 모바일 부고장에 대한 모든 궁금증을 해결해 드립니다.',
        url: 'https://maeumbugo.co.kr/faq',
        siteName: '마음부고',
        type: 'website',
        locale: 'ko_KR',
    },
    alternates: {
        canonical: 'https://maeumbugo.co.kr/faq',
    },
};

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: '모바일 부고장을 정말 무료로 만들 수 있나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '네, 마음부고에서 모바일 부고장을 만드는 것은 완전 무료입니다. 숨겨진 비용이나 유료 업그레이드 없이 모든 기능을 이용하실 수 있습니다.',
            },
        },
        {
            '@type': 'Question',
            name: '부고장 만들 때 회원가입이 필요한가요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '아닙니다. 별도의 회원가입 절차 없이 바로 부고장을 작성하실 수 있습니다. 간편하게 정보만 입력하시면 됩니다.',
            },
        },
        {
            '@type': 'Question',
            name: '앱 설치 없이도 모바일 부고장을 만들 수 있나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '네, 별도의 앱 설치가 필요 없습니다. 스마트폰, 태블릿, PC 등 모든 기기의 웹 브라우저에서 바로 이용하실 수 있습니다.',
            },
        },
        {
            '@type': 'Question',
            name: '만든 부고장은 어떻게 공유하나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '부고장 작성 완료 후 카카오톡, 문자 메시지, URL 복사 등 다양한 방법으로 손쉽게 공유하실 수 있습니다.',
            },
        },
        {
            '@type': 'Question',
            name: '부고장 내용을 수정할 수 있나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '네, 작성 시 입력한 비밀번호(휴대번호 뒷자리 4자리)를 통해 언제든지 수정하실 수 있습니다.',
            },
        },
        {
            '@type': 'Question',
            name: '부고장은 언제까지 유지되나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '부고장은 발인일로부터 2주 후 자동으로 삭제됩니다. 삭제 전 별도 연장 요청을 하시면 유지 기간을 늘릴 수 있습니다.',
            },
        },
        {
            '@type': 'Question',
            name: '부고장 삭제는 어떻게 하나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '부고장 삭제를 원하시면 고객센터로 연락 주시거나, 부고장 수정 페이지에서 삭제 요청을 해주시면 됩니다.',
            },
        },
        {
            '@type': 'Question',
            name: '개인정보는 안전하게 보호되나요?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: '네, 입력하신 개인정보는 부고장 표시 목적으로만 사용되며, 제3자에게 제공하거나 별도로 수집하지 않습니다.',
            },
        },
    ],
};

export default function FAQPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <FAQContent />
        </>
    );
}
