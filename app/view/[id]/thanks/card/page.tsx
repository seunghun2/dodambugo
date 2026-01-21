import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import CardContent from './CardContent';
import '../thanks.css';

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
