import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// GET: 답례품 뷰, 감사장 공유 등 실시간 이벤트를 요약 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase();

        // 1. 전체 부고장 수 & 총 조회수
        const { data: bugos } = await supabase.from('bugo').select('view_count');
        const totalBugoCount = bugos?.length || 0;
        const totalBugoViews = bugos?.reduce((acc, cur) => acc + (cur.view_count || 0), 0) || 0;

        // 2. 답례품 페이지/버튼 클릭 관련 이벤트 수
        const { count: giftClicks } = await supabase
            .from('access_logs')
            .select('*', { count: 'exact', head: true })
            .or('path.ilike.%gift%,user_agent.ilike.%답례품%');

        // 3. 감사장/답례글 페이지/공유 관련 이벤트 수
        const { count: thanksShares } = await supabase
            .from('access_logs')
            .select('*', { count: 'exact', head: true })
            .or('path.ilike.%thanks%,user_agent.ilike.%감사장%');

        return NextResponse.json({
            success: true,
            gaPropertyId: process.env.GA_PROPERTY_ID || '518592689',
            summary: {
                totalBugoCount,
                totalBugoViews,
                giftClicksCount: giftClicks || 0,
                thanksSharesCount: thanksShares || 0,
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
    }
}
