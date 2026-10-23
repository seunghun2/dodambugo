import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 쿠키 또는 Authorization 헤더에서 JWT 토큰을 읽어 인증 상태를 확인하는 API
// iOS WebView에서 localStorage가 불안정하므로, 쿠키 기반 인증 확인용
export async function GET(request: NextRequest) {
    try {
        // 1순위: 쿠키에서 토큰 읽기
        let token = request.cookies.get('b2b_token')?.value;

        // 2순위: Authorization 헤더에서 토큰 읽기
        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.slice(7);
            }
        }

        if (!token) {
            return NextResponse.json(
                { authenticated: false, error: '인증 토큰이 없습니다.' },
                { status: 401 }
            );
        }

        // JWT 검증
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            phone: string;
            company_name: string;
        };

        // DB에서 최신 사용자 정보 조회
        const { data: user, error } = await supabase
            .from('b2b_users')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { authenticated: false, error: '사용자를 찾을 수 없습니다.' },
                { status: 401 }
            );
        }

        if (user.status === 'suspended') {
            return NextResponse.json(
                { authenticated: false, error: '이용이 정지된 계정입니다.' },
                { status: 403 }
            );
        }

        // 예치금 잔액 조회
        const { data: deposit } = await supabase
            .from('deposits')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        return NextResponse.json({
            authenticated: true,
            token, // 클라이언트에서 localStorage 복원용
            user: {
                id: user.id,
                phone: user.phone,
                company_name: user.company_name,
                owner_name: user.owner_name,
                my_referral_code: user.my_referral_code,
                balance: deposit?.balance || 0,
                bank_name: user.bank_name || null,
                account_no: user.account_no || null,
                account_holder: user.account_holder || null,
            },
        });
    } catch (err) {
        console.error('인증 확인 오류:', err);
        return NextResponse.json(
            { authenticated: false, error: '인증 토큰이 유효하지 않습니다.' },
            { status: 401 }
        );
    }
}

// 로그아웃: 쿠키 삭제
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.set('b2b_token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0, // 즉시 만료
    });
    return response;
}
