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

    // 날짜/시간 포맷
    const formatDate = () => {
        if (!bugo.death_date) return '';
        const date = new Date(bugo.death_date);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        if (bugo.death_time) {
            const [hour, minute] = bugo.death_time.split(':');
            const ampm = parseInt(hour) < 12 ? '오전' : '오후';
            const h = parseInt(hour) % 12 || 12;
            return `${month}월 ${day}일 ${ampm} ${h}시 ${minute}분경`;
        }
        return `${month}월 ${day}일`;
    };

    const title = `故${bugo.deceased_name}님께서 ${formatDate()}별세하셨음을 삼가 알려 드립니...`;
    const description = bugo.funeral_home
        ? `${bugo.funeral_home}${bugo.room_number ? ' ' + bugo.room_number : ''}`
        : '';

    return {
        title: `故 ${bugo.deceased_name}님 부고 | 도담부고`,
        description: title,
        openGraph: {
            title,
            description: bugo.funeral_home
                ? `${bugo.funeral_home}${bugo.room_number ? ' ' + bugo.room_number : ''}`
                : '삼가 고인의 명복을 빕니다.',
            type: 'article',
            url: `https://dodambugo.com/view/${id}`,
            siteName: '도담부고',
            locale: 'ko_KR',
            images: [
                {
                    url: 'https://dodambugo.com/og-bugo-v4.png',
                    width: 1200,
                    height: 630,
                    alt: `故 ${bugo.deceased_name}님 부고`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description: bugo.funeral_home
                ? `${bugo.funeral_home}${bugo.room_number ? ' ' + bugo.room_number : ''}`
                : '삼가 고인의 명복을 빕니다.',
            images: ['https://dodambugo.com/og-bugo-v4.png'],
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
