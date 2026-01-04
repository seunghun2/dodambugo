import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    // 부고 데이터 조회
    let bugo = null;
    const isUUID = id.includes('-') && id.length > 10;

    if (isUUID) {
        const { data } = await supabase.from('bugo').select('*').eq('id', id).limit(1);
        bugo = data?.[0] || null;
    } else {
        const { data } = await supabase.from('bugo').select('*').eq('bugo_number', id).limit(1);
        bugo = data?.[0] || null;
    }

    if (!bugo) {
        return {
            title: '부고장을 찾을 수 없습니다 | 도담부고',
            description: '요청하신 부고장을 찾을 수 없습니다.',
        };
    }

    const title = `故 ${bugo.deceased_name}님 부고`;
    const description = bugo.funeral_home
        ? `${bugo.funeral_home} | 삼가 고인의 명복을 빕니다.`
        : '삼가 고인의 명복을 빕니다.';

    return {
        title: `${title} | 도담부고`,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://dodambugo.com/view/${id}`,
            siteName: '도담부고',
            locale: 'ko_KR',
            images: [
                {
                    url: 'https://dodambugo.com/og-bugo.png',
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['https://dodambugo.com/og-bugo.png'],
        },
    };
}

export default function ViewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
