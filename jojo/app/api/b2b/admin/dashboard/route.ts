import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    // 보안 가드: 암호화된 관리자 JWT 검증
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        // 1~3. 파트너/예치금/출금 통계 병렬 조회 (성능 최적화)
        const [
            { data: partnersData, error: partnersError },
            { data: depositsData, error: depositsError },
            { data: withdrawalsData, error: withdrawalsError },
        ] = await Promise.all([
            supabase.from('b2b_users').select('status'),
            supabase.from('deposits').select('balance'),
            supabase.from('withdrawal_requests').select('amount, status').eq('status', 'pending'),
        ]);

        if (partnersError) throw partnersError;
        if (depositsError) throw depositsError;
        if (withdrawalsError) throw withdrawalsError;

        let totalPartners = 0;
        let pendingPartners = 0;
        partnersData?.forEach(p => {
            if (p.status === 'approved') totalPartners++;
            else if (p.status === 'pending') pendingPartners++;
        });

        const totalDepositBalance = depositsData?.reduce((sum, dep) => sum + (dep.balance || 0), 0) || 0;
        const pendingWithdrawalsCount = withdrawalsData?.length || 0;
        const pendingWithdrawalsAmount = withdrawalsData?.reduce((sum, req) => sum + (req.amount || 0), 0) || 0;

        return NextResponse.json({
            success: true,
            metrics: {
                totalPartners,
                pendingPartners,
                totalDepositBalance,
                pendingWithdrawalsCount,
                pendingWithdrawalsAmount
            }
        });
    } catch (error: any) {
        console.error('B2B 대시보드 API 오류:', error);
        return NextResponse.json({ error: '대시보드 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
    }
}
