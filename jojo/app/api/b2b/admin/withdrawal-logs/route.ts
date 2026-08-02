import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 특정 파트너의 출금 내역 조회
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const partnerId = searchParams.get('partnerId');

        if (!partnerId) {
            return NextResponse.json({ error: '파트너 ID가 필요합니다.' }, { status: 400 });
        }

        // 1. 환급/출금 내역 조회
        const { data: withdrawals, error: wError } = await supabase
            .from('withdrawal_requests')
            .select('id, amount, net_amount, status, created_at, withholding_tax, local_income_tax, vat, bank_name, account_no, account_holder')
            .eq('user_id', partnerId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (wError) {
            console.error('출금 로그 조회 오류:', wError);
        }

        // 2. 적립 내역 조회 (deposit_transactions - 출금/환급건 제외하고 순수 적립건만)
        const { data: rawRewards, error: rError } = await supabase
            .from('deposit_transactions')
            .select('id, amount, type, description, created_at')
            .eq('user_id', partnerId)
            .neq('type', 'withdrawal')
            .neq('type', 'withdrawal_reject')
            .order('created_at', { ascending: false })
            .limit(50);

        const rewards = (rawRewards || []).filter(r => r.amount > 0 || r.type === 'reward_cancel');

        if (rError) {
            console.error('적립 로그 조회 오류:', rError);
        }

        // 총 실수령 지급액 (status === 'approved' 인 건의 net_amount 합산)
        const totalPaidAmount = (withdrawals || [])
            .filter(w => w.status === 'approved')
            .reduce((sum, w) => sum + (w.net_amount || w.amount || 0), 0);

        // 총 적립 금액 (amount > 0)
        const totalRewardAmount = (rewards || [])
            .filter(r => r.amount > 0 || r.type === 'reward_cancel')
            .reduce((sum, r) => sum + (r.amount || 0), 0);

        return NextResponse.json({
            success: true,
            logs: withdrawals || [],
            rewards: rewards || [],
            totalPaidAmount,
            totalRewardAmount,
        });
    } catch (err: any) {
        console.error('출금 로그 API 오류:', err);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
