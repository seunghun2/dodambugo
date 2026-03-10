import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // 1. 장지 후기 전체 조회
        const { data: reviews, error } = await supabase
            .from('burial_reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('리뷰 조회 오류:', error);
            return NextResponse.json({ error: '조회 실패' }, { status: 500 });
        }

        if (!reviews || reviews.length === 0) {
            return NextResponse.json({ reviews: [] });
        }

        // 2. 부고번호로 연락처 매핑
        const bugoNumbers = [...new Set(reviews.map(r => r.bugo_number))];
        const { data: bugos } = await supabase
            .from('bugo')
            .select('bugo_number, mourner_name, mourner_phone, funeral_home, deceased_name')
            .in('bugo_number', bugoNumbers.map(Number));

        const bugoMap: Record<string, any> = {};
        bugos?.forEach(b => {
            bugoMap[String(b.bugo_number)] = b;
        });

        // 3. 병합
        const merged = reviews.map(r => ({
            ...r,
            mourner_phone: bugoMap[r.bugo_number]?.mourner_phone || null,
            funeral_home: bugoMap[r.bugo_number]?.funeral_home || null,
            deceased_name: bugoMap[r.bugo_number]?.deceased_name || null,
        }));

        return NextResponse.json({ reviews: merged });
    } catch (err) {
        console.error('어드민 리뷰 API 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
