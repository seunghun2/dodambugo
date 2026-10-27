import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '부고 검색 - 부고장 조회 및 수정 | 마음부고',
    description: '마음부고에서 작성된 부고장을 검색하세요. 부고번호, 고인명, 상주명으로 빠르게 부고장을 찾고 수정할 수 있습니다.',
    keywords: ['부고 검색', '부고장 조회', '부고장 수정', '부고 확인', '마음부고 검색'],
    openGraph: {
        title: '부고 검색 - 부고장 조회 | 마음부고',
        description: '부고번호, 고인명, 상주명으로 부고장을 빠르게 검색하세요.',
        url: 'https://maeumbugo.co.kr/search',
        siteName: '마음부고',
        type: 'website',
        locale: 'ko_KR',
    },
    alternates: {
        canonical: 'https://maeumbugo.co.kr/search',
    },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
