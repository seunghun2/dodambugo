import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

// JWT 토큰에서 userId 추출 (Authorization 헤더 → 쿠키 순서로 확인)
function getUserIdFromToken(request: NextRequest): string | null {
    let token: string | undefined;

    // 1순위: Authorization 헤더
    const auth = request.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
        token = auth.slice(7);
    }

    // 2순위: 쿠키 (iOS WebView localStorage 불안정 대응)
    if (!token) {
        token = request.cookies.get('b2b_token')?.value;
    }

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.userId;
    } catch {
        return null;
    }
}

// GET: 내 정보 + 잔액 조회
export async function GET(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const { data: user, error: userError } = await supabase
            .from('b2b_users')
            .select('id, phone, company_name, owner_name, bank_name, account_no, account_holder, my_referral_code, status, created_at, identity_verified, alarm_all, alarm_deceased, alarm_reward, alarm_referral, alarm_order, alarm_deposit, alarm_notice, alarm_event')
            .eq('id', userId)
            .single();

        if (userError) {
            return NextResponse.json({ error: `Supabase 쿼리 오류: ${userError.message}` }, { status: 500 });
        }

        if (!user) {
            return NextResponse.json({ error: '회원 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        const { data: deposit, error: depositError } = await supabase
            .from('deposits')
            .select('balance')
            .eq('user_id', userId)
            .maybeSingle();

        if (depositError) {
            console.error('Deposits 조회 오류:', depositError);
        }

        // 추천한 회원 수
        const { count: referralCount } = await supabase
            .from('b2b_users')
            .select('id', { count: 'exact', head: true })
            .eq('recommender_id', userId);

        return NextResponse.json({
            user: { ...user, balance: deposit?.balance || 0 },
            referralCount: referralCount || 0,
        });
    } catch (err: any) {
        return NextResponse.json({ error: `서버 예외 발생: ${err?.message || err}` }, { status: 500 });
    }
}

// PATCH: 내 정보 수정
export async function PATCH(request: NextRequest) {
    const userId = getUserIdFromToken(request);
    if (!userId) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const allowed = [
        'company_name', 'owner_name', 'bank_name', 'account_no', 'account_holder',
        'alarm_all', 'alarm_deceased', 'alarm_reward', 'alarm_referral', 'alarm_order', 'alarm_deposit', 'alarm_notice', 'alarm_event'
    ];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 });
    }

    // 계좌 정보 변경 시 신분증 인증 상태 초기화
    if (updates.bank_name !== undefined || updates.account_no !== undefined) {
        updates.identity_verified = false;
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
        .from('b2b_users')
        .update(updates)
        .eq('id', userId);

    if (error) {
        return NextResponse.json({ error: '정보 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
