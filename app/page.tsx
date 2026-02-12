import { Metadata } from 'next';
import HomeContent from './HomeContent';

export const metadata: Metadata = {
    title: '마음부고 - 무료 모바일 부고장 만들기 | 3분 완성, 카카오톡 공유',
    description: '무료 모바일 부고장을 3분 만에 만드세요. 4가지 품격 있는 템플릿, 카카오톡 간편 공유, 광고 없음, 회원가입 불필요. 장례 절차·비용·예절 가이드와 전국 장례식장 검색까지.',
    keywords: '모바일 부고장, 무료 부고장, 부고장 만들기, 모바일부고, 부고문자, 카카오톡 부고장, 온라인 부고장, 장례식장, 장례 비용, 장례 절차',
    alternates: {
        canonical: 'https://maeumbugo.co.kr',
    },
    openGraph: {
        title: '마음부고 - 무료 모바일 부고장 만들기',
        description: '3분 만에 만드는 품격 있는 무료 모바일 부고장. 카카오톡 공유, 광고 없음.',
        type: 'website',
        url: 'https://maeumbugo.co.kr',
        siteName: '마음부고',
        locale: 'ko_KR',
        images: [
            {
                url: 'https://maeumbugo.co.kr/og-maeumbugo.png',
                width: 1200,
                height: 630,
                alt: '마음부고 - 무료 모바일 부고장 만들기',
            },
        ],
    },
};

export default function Page() {
    return <HomeContent />;
}
