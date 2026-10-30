import { createClient } from '@supabase/supabase-js';
import CareContent from './CareContent';
import './care.css';

export const runtime = 'edge';
export const revalidate = 60;

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    return {
        title: '장례 후 유품 및 디지털 기기 정리 안내 | 마음부고',
        description: '유가족을 위한 휴대폰 데이터 완전 삭제 및 유품 정리 절차를 안내해 드립니다.',
        robots: { index: false, follow: false },
        openGraph: {
            title: '장례 후 유품 및 디지털 기기 정리 안내 | 마음부고',
            description: '유가족을 위한 휴대폰 데이터 완전 삭제 및 유품 정리 절차를 안내해 드립니다.',
            type: 'article',
            url: `https://maeumbugo.co.kr/view/${id}/care`,
            siteName: '마음부고',
            locale: 'ko_KR',
        },
    };
}

export default async function CarePage({ params }: PageProps) {
    const { id } = await params;
    let deceasedName: string | undefined;
    let mournerName: string | undefined;

    try {
        const supabase = getSupabase();
        const isUUID = id.includes('-') && id.length > 10;
        const { data } = await supabase
            .from('bugo')
            .select('deceased_name, mourner_name')
            .eq(isUUID ? 'id' : 'bugo_number', id)
            .maybeSingle();

        if (data) {
            deceasedName = data.deceased_name;
            mournerName = data.mourner_name;
        }
    } catch {
        // 카카오 검수 시 임의 변수값(#{부고ID})으로 접속해도 404 없이 정상 렌더링되도록 폴백 허용
    }

    return (
        <CareContent
            bugoId={id}
            deceasedName={deceasedName}
            mournerName={mournerName}
        />
    );
}
