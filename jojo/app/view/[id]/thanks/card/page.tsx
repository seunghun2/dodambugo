import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import CardContent from './CardContent';
import '../thanks.css';
import './card.css';

// Edge Runtime - Cold Start 최소화
export const runtime = 'edge';

// 서버 사이드 Supabase 클라이언트
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// ISR: 60초마다 재생성
export const revalidate = 60;

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const supabase = getSupabase();
    const isUUID = id.includes('-') && id.length > 10;
    const { data } = await supabase
        .from('bugo')
        .select('deceased_name')
        .eq(isUUID ? 'id' : 'bugo_number', id)
        .limit(1);
    const deceasedName = data?.[0]?.deceased_name;
    const title = deceasedName ? `故 ${deceasedName}님 감사장` : '장례 감사장';
    const description = '따뜻한 위로와 조문에 머리 숙여 감사드립니다.';

    return {
        title: `${title} | 마음부고`,
        description,
        robots: { index: false, follow: false },
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://maeumbugo.co.kr/view/${id}/thanks/card`,
            siteName: '마음부고',
            locale: 'ko_KR',
            images: [{ url: 'https://maeumbugo.co.kr/og-thanks-v1.png', width: 1024, height: 512, alt: title }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['https://maeumbugo.co.kr/og-thanks-v1.png'],
        },
    };
}

export default async function ThanksCardPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = getSupabase();

    // 데이터 조회
    const isUUID = id.includes('-') && id.length > 10;
    let data = null;

    if (isUUID) {
        const result = await supabase
            .from('bugo')
            .select('id, deceased_name, mourner_name, religion, funeral_date, thanks_message, thanks_religion')
            .eq('id', id)
            .single();
        data = result.data;
    } else {
        const result = await supabase
            .from('bugo')
            .select('id, deceased_name, mourner_name, religion, funeral_date, thanks_message, thanks_religion')
            .eq('bugo_number', id)
            .single();
        data = result.data;
    }

    if (!data) {
        notFound();
    }

    return <CardContent bugo={data} bugoId={id} />;
}
