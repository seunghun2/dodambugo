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

        const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('id, amount, net_amount, status, created_at, withholding_tax, local_income_tax, vat')
            .eq('user_id', partnerId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('출금 로그 조회 오류:', error);
            return NextResponse.json({ error: '출금 내역 조회에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, logs: data || [] });
    } catch (err: any) {
        console.error('출금 로그 API 오류:', err);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
