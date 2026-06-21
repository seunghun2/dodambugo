import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    // 보안 가드: admin_ip 쿠키 검증
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        // 1. 파트너 통계
        const { data: partnersData, error: partnersError } = await supabase
            .from('b2b_users')
            .select('status');

        if (partnersError) throw partnersError;

        let totalPartners = 0;
        let pendingPartners = 0;

        partnersData?.forEach(p => {
            if (p.status === 'approved') totalPartners++;
            else if (p.status === 'pending') pendingPartners++;
        });

        // 2. 총 예치금 잔고 합계
        const { data: depositsData, error: depositsError } = await supabase
            .from('deposits')
            .select('balance');

        if (depositsError) throw depositsError;

        const totalDepositBalance = depositsData?.reduce((sum, dep) => sum + (dep.balance || 0), 0) || 0;

        // 3. 출금 대기 통계
        const { data: withdrawalsData, error: withdrawalsError } = await supabase
            .from('withdrawal_requests')
            .select('amount, status')
            .eq('status', 'pending');

        if (withdrawalsError) throw withdrawalsError;

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
