import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import FuneralHomeClient from './FuneralHomeClient';

export const metadata: Metadata = {
    title: '장례식장 찾기 - 전국 1,100여개 장례식장 정보 | 마음부고',
    description: '전국 장례식장을 지역별로 빠르게 검색하세요. 서울, 경기, 인천, 부산 등 전국 1,100여개 장례식장의 주소, 전화번호, 위치 정보를 제공합니다. 장례식장 선택 후 바로 모바일 부고장을 만들 수 있습니다.',
    keywords: ['장례식장 찾기', '장례식장 검색', '서울 장례식장', '경기 장례식장', '부산 장례식장', '장례식장 목록', '장례식장 전화번호', '모바일 부고장'],
    openGraph: {
        title: '장례식장 찾기 - 전국 장례식장 검색 | 마음부고',
        description: '전국 1,100여개 장례식장을 지역별로 빠르게 검색하고, 바로 모바일 부고장을 만들어 보세요.',
        url: 'https://maeumbugo.co.kr/guide/funeral-home',
        siteName: '마음부고',
        type: 'website',
        locale: 'ko_KR',
    },
    alternates: {
        canonical: 'https://maeumbugo.co.kr/guide/funeral-home',
    },
};

const funeralHomeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '전국 장례식장 목록',
    description: '전국 1,100여개 장례식장의 주소, 전화번호, 위치 정보를 제공합니다.',
    url: 'https://maeumbugo.co.kr/guide/funeral-home',
    numberOfItems: 1100,
    itemListOrder: 'https://schema.org/ItemListUnordered',
};

const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        {
            '@type': 'ListItem',
            position: 1,
            name: '마음부고',
            item: 'https://maeumbugo.co.kr',
        },
        {
            '@type': 'ListItem',
            position: 2,
            name: '장례가이드',
            item: 'https://maeumbugo.co.kr/guide',
        },
        {
            '@type': 'ListItem',
            position: 3,
            name: '장례식장 찾기',
            item: 'https://maeumbugo.co.kr/guide/funeral-home',
        },
    ],
};

// 서버에서 초기 데이터 가져오기 (SEO용)
async function getInitialFacilities() {
    try {
        const { data, error } = await supabase
            .from('facilities')
            .select('id, name, address, phone')
            .order('name')
            .limit(50);

        if (error) {
            console.error('Facilities fetch error:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('Facilities fetch exception:', err);
        return [];
    }
}

export default async function FuneralHomePage() {
    const initialData = await getInitialFacilities();

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(funeralHomeJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <FuneralHomeClient initialData={initialData} />
        </>
    );
}
