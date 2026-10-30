import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // 1. 장지 후기 전체 조회
        const { data: reviews, error: reviewsError } = await supabase
            .from('burial_reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (reviewsError) {
            console.error('B2B 리뷰 조회 오류:', reviewsError);
            return NextResponse.json({ error: '조회 실패' }, { status: 500 });
        }

        if (!reviews || reviews.length === 0) {
            return NextResponse.json({ success: true, reviews: [] });
        }

        // 2. 부고번호 추출
        const bugoNumbers = [...new Set(reviews.map(r => r.bugo_number))];
        
        // 3. 부고 정보 조회 (b2b_user_id 컬럼 포함)
        const { data: bugos } = await supabase
            .from('bugo')
            .select('bugo_number, mourner_name, phone_password, applicant_phone, funeral_home, deceased_name, b2b_user_id')
            .in('bugo_number', bugoNumbers.map(Number));

        if (!bugos || bugos.length === 0) {
            return NextResponse.json({ success: true, reviews: [] });
        }

        // 4. B2B 파트너 정보 조회
        const b2bUserIds = [...new Set(bugos.map(b => b.b2b_user_id).filter(Boolean))];
        
        const partnerMap: Record<string, string> = {};
        if (b2bUserIds.length > 0) {
            const { data: partners } = await supabase
                .from('b2b_users')
                .select('id, company_name')
                .in('id', b2bUserIds);
            
            partners?.forEach(p => {
                partnerMap[p.id] = p.company_name;
            });
        }

        // 5. 부고 맵 빌드
        const bugoMap: Record<string, any> = {};
        bugos.forEach(b => {
            bugoMap[String(b.bugo_number)] = {
                ...b,
                company_name: b.b2b_user_id ? (partnerMap[b.b2b_user_id] || 'B2B 파트너') : null
            };
        });

        // 6. B2B 파트너가 만든 부고에 연계된 후기만 필터링하고 정보 병합
        const merged = reviews
            .map(r => {
                const bugo = bugoMap[r.bugo_number];
                if (!bugo || !bugo.b2b_user_id) return null; // B2B 부고가 아닌 경우 제외
                return {
                    ...r,
                    company_name: bugo.company_name,
                    mourner_phone: bugo.applicant_phone || bugo.phone_password || null,
                    funeral_home: bugo.funeral_home || null,
                    deceased_name: bugo.deceased_name || null,
                };
            })
            .filter(Boolean);

        return NextResponse.json({ success: true, reviews: merged });
    } catch (err) {
        console.error('B2B 어드민 리뷰 API 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
