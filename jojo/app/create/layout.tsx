import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '무료 모바일 부고장 만들기 - 3분 완성, 회원가입 불필요 | 마음부고',
    description: '모바일 부고장을 3분 만에 무료로 만드세요. 4가지 품격 있는 템플릿 중 선택하고, 정보만 입력하면 완성. 카카오톡으로 간편 공유, 광고 없음, 회원가입 불필요.',
    keywords: ['부고장 만들기', '모바일 부고장 만들기', '부고 제작', '부고 만들기', '무료 부고장', '모바일부고장', '온라인 부고장', '카카오톡 부고장', '부고장 무료'],
    openGraph: {
        title: '무료 모바일 부고장 만들기 - 3분 완성 | 마음부고',
        description: '4가지 품격 있는 템플릿으로 3분 만에 무료 모바일 부고장을 만드세요.',
        url: 'https://maeumbugo.co.kr/create',
        siteName: '마음부고',
        type: 'website',
        locale: 'ko_KR',
    },
    alternates: {
        canonical: 'https://maeumbugo.co.kr/create',
    },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
