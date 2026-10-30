import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

type Props = {
    params: Promise<{ id: string }>;
};

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const supabase = getSupabase();
    const isUUID = id.includes('-') && id.length > 10;

    const selectCols = 'deceased_name, age, funeral_home, room_number, death_date, death_time';
    const result = isUUID
        ? await supabase.from('bugo').select(selectCols).eq('id', id).limit(1)
        : await supabase.from('bugo').select(selectCols).eq('bugo_number', id).limit(1);
    const data = result.data?.[0];

    const noIndex = {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false, noimageindex: true },
    };

    if (!data) {
        return {
            title: '부고장을 찾을 수 없습니다 | 부고온',
            description: '요청하신 부고장을 찾을 수 없습니다.',
            robots: noIndex,
        };
    }

    const formatDate = () => {
        if (!data.death_date) return '';
        const date = new Date(data.death_date);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        if (data.death_time) {
            const [hour, minute] = data.death_time.split(':');
            const ampm = parseInt(hour) < 12 ? '오전' : '오후';
            const h = parseInt(hour) % 12 || 12;
            return `${month}월 ${day}일 ${ampm} ${h}시 ${minute}분경`;
        }
        return `${month}월 ${day}일`;
    };

    const ageText = data.age && Number(data.age) > 0 ? `(향년 ${data.age}세)` : '';
    const title = `故 ${data.deceased_name}님 부고${ageText}`;
    const dateStr = formatDate();
    const description = data.funeral_home
        ? `${data.funeral_home}${data.room_number ? ' ' + data.room_number : ''}${dateStr ? ` | ${dateStr} 별세하셨음을 삼가 알려드립니다.` : ' | 삼가 고인의 명복을 빕니다.'}`
        : `${dateStr ? `${dateStr} ` : ''}별세하셨음을 삼가 알려드립니다.`;

    return {
        title: `${title} | 부고온`,
        description,
        robots: noIndex,
        alternates: {
            canonical: `https://bugoon.maeumbugo.co.kr/view/${id}`,
        },
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://bugoon.maeumbugo.co.kr/view/${id}`,
            siteName: '부고온',
            locale: 'ko_KR',
            images: [
                {
                    url: 'https://bugoon.maeumbugo.co.kr/og-bugoon.png?v=2',
                    width: 1200,
                    height: 630,
                    alt: `故 ${data.deceased_name}님 부고`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description: data.funeral_home
                ? `${data.funeral_home}${data.room_number ? ' ' + data.room_number : ''}`
                : '삼가 고인의 명복을 빕니다.',
            images: ['https://bugoon.maeumbugo.co.kr/og-bugoon.png?v=2'],
        },
    };
}

export default function B2BViewLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
