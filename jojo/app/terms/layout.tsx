import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '이용약관 | 마음부고',
    description: '마음부고 모바일 부고장 서비스 이용약관입니다.',
    alternates: {
        canonical: 'https://maeumbugo.co.kr/terms',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
