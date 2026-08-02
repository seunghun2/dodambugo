import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { sendB2BWithdrawalRequestNotification } from '@/lib/slack';

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

// GET: 예치금 내역 조회 (24시간 보류 잠금 잔액 계산 추가)
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

        // 🛡️ 24시간 이내 적립/취소 수당 보류(Lock) 금액 계산 (모든 취소 차감 포함)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentRewards } = await supabase
            .from('deposit_transactions')
            .select('amount')
            .eq('user_id', userId)
            .gte('created_at', oneDayAgo);

        const lockedAmount = Math.max(0, (recentRewards || []).reduce((sum, tx) => sum + (tx.amount || 0), 0));
        const withdrawableBalance = Math.max(0, (deposit?.balance || 0) - lockedAmount);

        console.log('[DEBUG] Fetching transactions for user:', userId);
        // 거래 내역 조회
        const { data: transactions, count, error: txError } = await supabase
            .from('deposit_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (txError) console.error('[DEBUG] txError:', txError);

        console.log('[DEBUG] Fetching identity_verified, partner_type and bank account info for user:', userId);
        // 본인인증 여부, 파트너 유형 및 정산계좌 정보 조회
        const { data: user, error: userError } = await supabase
            .from('b2b_users')
            .select('identity_verified, partner_type, bank_name, account_no, account_holder')
            .eq('id', userId)
            .single();
        if (userError) console.error('[DEBUG] userError:', userError);

        // 해당 유저의 모든 withdrawal_requests 조회하여 트랜잭션 정보에 매핑
        const { data: withdrawals } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('user_id', userId);

        const enrichedTransactions = (transactions || []).map(tx => {
            if (tx.amount < 0 && (tx.type === 'withdrawal' || tx.type === 'withdrawal_reject')) {
                const matchingReq = (withdrawals || []).find(w => 
                    w.amount === Math.abs(tx.amount) &&
                    Math.abs(new Date(w.created_at).getTime() - new Date(tx.created_at).getTime()) < 10000
                );
                if (matchingReq) {
                    return {
                        ...tx,
                        partner_type: matchingReq.partner_type || 'individual',
                        withholding_tax: matchingReq.withholding_tax || 0,
                        local_income_tax: matchingReq.local_income_tax || 0,
                        vat: matchingReq.vat || 0,
                        net_amount: matchingReq.net_amount || Math.abs(tx.amount),
                        status: matchingReq.status
                    };
                }
            }
            return tx;
        });

        // 최소 출금 금액 설정 조회
        const { data: minSetting } = await supabase
            .from('b2b_settings')
            .select('value')
            .eq('key', 'min_withdrawal_amount')
            .single();

        console.log('[DEBUG] Returning wallet data successfully');
        return NextResponse.json({
            balance: deposit?.balance || 0,
            withdrawable_balance: withdrawableBalance,
            locked_balance: lockedAmount,
            min_withdrawal_amount: parseInt(minSetting?.value || '5000'),
            transactions: enrichedTransactions,
            total: count || 0,
            page,
            limit,
            identity_verified: user?.identity_verified || false,
            partner_type: user?.partner_type || 'individual',
            bank_name: user?.bank_name || null,
            account_no: user?.account_no || null,
            account_holder: user?.account_holder || null,
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

    // 한국 표준시 (KST, Asia/Seoul) 기준 은행 점검 시간 (23:30 ~ 00:30) 출금 신청 차단 이중 안전장치
    const now = new Date();
    const kstString = now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
    const kstDate = new Date(kstString);
    const totalMinutes = kstDate.getHours() * 60 + kstDate.getMinutes();
    if (totalMinutes >= 1410 || totalMinutes < 30) {
        return NextResponse.json(
            { error: '매일 23:30 ~ 00:30은 금융기관 및 펌뱅킹 점검 시간으로 출금 신청이 일시 제한됩니다.' },
            { status: 400 }
        );
    }

    if (!amount || amount <= 0) {
        return NextResponse.json({ error: '올바른 금액을 입력해주세요.' }, { status: 400 });
    }

    // 최소 출금 금액 확인
    const { data: minSetting } = await supabase
        .from('b2b_settings')
        .select('value')
        .eq('key', 'min_withdrawal_amount')
        .single();

    const minAmount = parseInt(minSetting?.value || '5000');
    if (amount < minAmount) {
        return NextResponse.json(
            { error: `최소 출금 금액은 ${minAmount.toLocaleString()}원입니다.` },
            { status: 400 }
        );
    }

    // 잔액 및 24시간 보류(Lock) 잠금 잔액 확인
    const { data: deposit } = await supabase
        .from('deposits')
        .select('balance')
        .eq('user_id', userId)
        .single();

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentRewards } = await supabase
        .from('deposit_transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('created_at', oneDayAgo)
        .or('amount.gt.0,type.eq.reward_cancel');

    const lockedAmount = Math.max(0, (recentRewards || []).reduce((sum, tx) => sum + (tx.amount || 0), 0));
    const withdrawableBalance = Math.max(0, (deposit?.balance || 0) - lockedAmount);

    if (!deposit || deposit.balance < amount) {
        return NextResponse.json({ error: '잔액이 부족합니다.' }, { status: 400 });
    }

    if (amount > withdrawableBalance) {
        return NextResponse.json({ 
            error: `출금 가능 잔액을 초과했습니다. (정산 확정 대기 중인 수당: ${lockedAmount.toLocaleString()}원)` 
        }, { status: 400 });
    }

    // 회원 정보 (출금 계좌 & 본인인증 여부 및 파트너 유형)
    const { data: user } = await supabase
        .from('b2b_users')
        .select('bank_name, account_no, account_holder, identity_verified, partner_type, company_name, owner_name')
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

    // 세금 및 실수령액 계산 로직
    const isBiz = user.partner_type === 'business';
    let withholding_tax = 0;
    let local_income_tax = 0;
    let vat = 0;
    let net_amount = amount;

    if (isBiz) {
        vat = Math.floor(amount * 0.1);
        net_amount = amount + vat;
    } else {
        withholding_tax = Math.floor(amount * 0.03);
        local_income_tax = Math.floor(amount * 0.003);
        net_amount = amount - withholding_tax - local_income_tax;
    }

    // 출금 신청 INSERT (세금 및 실수령액 사전 적재)
    const { error: withdrawError } = await supabase
        .from('withdrawal_requests')
        .insert({
            user_id: userId,
            amount,
            bank_name: user.bank_name,
            account_no: user.account_no,
            account_holder: user.account_holder,
            status: 'pending',
            partner_type: user.partner_type || 'individual',
            withholding_tax,
            local_income_tax,
            vat,
            net_amount,
        });

    if (withdrawError) {
        return NextResponse.json({ error: '출금 신청에 실패했습니다.' }, { status: 500 });
    }

    // 슬랙 알림 전송 (비동기 호출 후 로그 남김)
    if (user) {
        sendB2BWithdrawalRequestNotification({
            company_name: user.company_name || '미등록',
            owner_name: user.owner_name || '미등록',
            amount,
            net_amount,
            bank_name: user.bank_name,
            account_no: user.account_no,
            account_holder: user.account_holder,
            partner_type: user.partner_type || 'individual',
        }).catch(err => console.error('❌ 출금 신청 슬랙 알림 실패:', err));
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
