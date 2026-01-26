import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
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

// 동적 메타데이터 생성 (감사장 전용)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = getSupabase();

    const isUUID = id.includes('-') && id.length > 10;
    let data = null;

    if (isUUID) {
        const { data: result } = await supabase
            .from('bugo')
            .select('deceased_name, mourner_name')
            .eq('id', id)
            .single();
        data = result;
    } else {
        const { data: result } = await supabase
            .from('bugo')
            .select('deceased_name, mourner_name')
            .eq('bugo_number', id)
            .single();
        data = result;
    }

    const deceasedName = data?.deceased_name || '고인';
    const mournerName = data?.mourner_name || '상주';
    const title = '삼가 감사 인사 드립니다';
    const description = `故 ${deceasedName}님의 마지막 가시는 길을 함께해 주셔서 진심으로 감사드립니다. - ${mournerName} 배상 -`;
    const ogImageUrl = `https://maeumbugo.co.kr/api/og/thanks/${id}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: ogImageUrl,
                    width: 800,
                    height: 400,
                    alt: '감사장',
                },
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
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
