import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '부고온 - 장례지도사·상조사·장례식장을 위한 모바일 부고 솔루션',
    description: '부고장 작성 1분, 카카오톡 발송, 부고장 안에서 화환 주문, 주문마다 페이백 적립. 앱 설치 없이 가입비·월 이용료 0원.',
    keywords: '부고온, 모바일부고장, 장례지도사, 상조회사, 장례식장, 부고장, 근조화환',
    alternates: {
        canonical: 'https://bugoon.maeumbugo.co.kr/intro',
    },
    openGraph: {
        title: '부고는 1분, 나머지는 부고온이 챙깁니다',
        description: '장례지도사·상조사·장례식장을 위한 모바일 부고 솔루션. 가입비·월 이용료 0원.',
        type: 'website',
        url: 'https://bugoon.maeumbugo.co.kr/intro',
        siteName: '부고온',
        locale: 'ko_KR',
        images: [
            {
                url: 'https://maeumbugo.co.kr/og-bugoon.png',
                width: 1200,
                height: 630,
                alt: '부고온',
            },
        ],
    },
};

export default function BugoonB2BIntroLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
