import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '개인정보처리방침 | 마음부고',
    description: '마음부고의 개인정보처리방침입니다. 개인정보 수집 항목, 이용 목적, 보유 기간, 파기 절차 등을 안내합니다.',
    alternates: {
        canonical: 'https://maeumbugo.co.kr/privacy',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
