import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import CardContent from '@/app/view/[id]/thanks/card/CardContent';
import '@/app/view/[id]/thanks/thanks.css';
import '@/app/view/[id]/thanks/card/card.css';

export const runtime = 'edge';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export const dynamic = 'force-dynamic';

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
    const title = deceasedName ? `故 ${deceasedName}님 감사장` : '감사장 | 부고온';
    const description = '감사의 마음을 전합니다.';

    return {
        title: `${title} | 부고온`,
        description,
        robots: { index: false, follow: false },
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://bugoon.maeumbugo.co.kr/view/${id}/thanks/card`,
            siteName: '부고온',
            locale: 'ko_KR',
            images: [{ url: 'https://bugoon.maeumbugo.co.kr/og-bugoon.png?v=2', width: 1200, height: 630, alt: title }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['https://bugoon.maeumbugo.co.kr/og-bugoon.png?v=2'],
        },
    };
}

export default async function B2BThanksCardPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = getSupabase();

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

    return <CardContent bugo={data} bugoId={id} isB2bPage={true} />;
}
