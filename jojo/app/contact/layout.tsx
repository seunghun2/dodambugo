import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '제휴/문의 - 마음부고 서비스 문의 | 마음부고',
    description: '마음부고 서비스 제휴, 기술 지원, 서비스 문의를 남겨주세요. 빠른 시일 내에 답변드리겠습니다.',
    keywords: ['마음부고 문의', '마음부고 제휴', '부고장 서비스 문의'],
    openGraph: {
        title: '제휴/문의 | 마음부고',
        description: '마음부고 서비스 제휴 및 문의사항을 남겨주세요.',
        url: 'https://maeumbugo.co.kr/contact',
        siteName: '마음부고',
        type: 'website',
        locale: 'ko_KR',
    },
    alternates: {
        canonical: 'https://maeumbugo.co.kr/contact',
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
