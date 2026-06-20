import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

function getUserIdFromToken(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    try {
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as any;
        return decoded.userId;
    } catch {
        return null;
    }
}

// GET: 예치금 내역 조회
export async function GET(request: NextRequest) {
    console.log('[DEBUG] GET /api/b2b/wallet started');
    const userId = getUserIdFromToken(request);
    console.log('[DEBUG] GET /api/b2b/wallet userId:', userId);
    if (!userId) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    try {
        console.log('[DEBUG] Fetching balance for user:', userId);
        // 잔액 조회
        const { data: deposit, error: depError } = await supabase
            .from('deposits')
            .select('balance')
            .eq('user_id', userId)
            .single();
        if (depError) console.error('[DEBUG] depError:', depError);

        console.log('[DEBUG] Fetching transactions for user:', userId);
        // 거래 내역 조회
        const { data: transactions, count, error: txError } = await supabase
            .from('deposit_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (txError) console.error('[DEBUG] txError:', txError);

        console.log('[DEBUG] Fetching identity_verified for user:', userId);
        // 본인인증 여부 조회
        const { data: user, error: userError } = await supabase
            .from('b2b_users')
            .select('identity_verified')
            .eq('id', userId)
            .single();
        if (userError) console.error('[DEBUG] userError:', userError);

        console.log('[DEBUG] Returning wallet data successfully');
        return NextResponse.json({
            balance: deposit?.balance || 0,
            transactions: transactions || [],
            total: count || 0,
            page,
            limit,
            identity_verified: user?.identity_verified || false,
        });
    } catch (err) {
        console.error('[DEBUG] Unexpected error in GET /api/b2b/wallet:', err);
        return NextResponse.json({ error: '서버 에러가 발생했습니다.' }, { status: 500 });
    }
}

// POST: 출금 신청
export async function POST(request: NextRequest) {
    const userId = getUserIdFromToken(request);
    if (!userId) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
        return NextResponse.json({ error: '올바른 금액을 입력해주세요.' }, { status: 400 });
    }

    // 최소 출금 금액 확인
    const { data: minSetting } = await supabase
        .from('b2b_settings')
        .select('value')
        .eq('key', 'min_withdrawal_amount')
        .single();

    const minAmount = parseInt(minSetting?.value || '50000');
    if (amount < minAmount) {
        return NextResponse.json(
            { error: `최소 출금 금액은 ${minAmount.toLocaleString()}원입니다.` },
            { status: 400 }
        );
    }

    // 잔액 확인
    const { data: deposit } = await supabase
        .from('deposits')
        .select('balance')
        .eq('user_id', userId)
        .single();

    if (!deposit || deposit.balance < amount) {
        return NextResponse.json({ error: '잔액이 부족합니다.' }, { status: 400 });
    }

    // 회원 정보 (출금 계좌 & 본인인증 여부)
    const { data: user } = await supabase
        .from('b2b_users')
        .select('bank_name, account_no, account_holder, identity_verified')
        .eq('id', userId)
        .single();

    if (!user?.identity_verified) {
        return NextResponse.json(
            { error: '출금 및 환급을 위해 최초 1회 본인인증이 필요합니다.' },
            { status: 400 }
        );
    }

    if (!user?.bank_name || !user?.account_no) {
        return NextResponse.json(
            { error: '정산 계좌를 먼저 등록해주세요.' },
            { status: 400 }
        );
    }

    // 출금 신청 INSERT
    const { error: withdrawError } = await supabase
        .from('withdrawal_requests')
        .insert({
            user_id: userId,
            amount,
            bank_name: user.bank_name,
            account_no: user.account_no,
            account_holder: user.account_holder,
            status: 'pending',
        });

    if (withdrawError) {
        return NextResponse.json({ error: '출금 신청에 실패했습니다.' }, { status: 500 });
    }

    // 예치금 차감
    await supabase
        .from('deposits')
        .update({ balance: deposit.balance - amount, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

    // 거래 내역 INSERT
    await supabase.from('deposit_transactions').insert({
        user_id: userId,
        amount: -amount,
        type: 'withdrawal',
        description: `출금 신청 (${user.bank_name} ${user.account_no})`,
    });

    return NextResponse.json({ success: true, message: '출금 신청이 완료되었습니다.' });
}
