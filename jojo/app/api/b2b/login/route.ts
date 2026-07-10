import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

export async function POST(request: NextRequest) {
    try {
        const { phone, password } = await request.json();

        if (!phone || !password) {
            return NextResponse.json(
                { error: '휴대폰 번호와 비밀번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // 회원 조회
        const { data: user, error } = await supabase
            .from('b2b_users')
            .select('*')
            .eq('phone', cleanPhone)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { error: '가입되지 않은 번호입니다.' },
                { status: 401 }
            );
        }

        // 상태 확인
        if (user.status === 'suspended') {
            return NextResponse.json(
                { error: '이용이 정지된 계정입니다. 고객센터로 문의해주세요.' },
                { status: 403 }
            );
        }

        // 비밀번호 확인
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return NextResponse.json(
                { error: '비밀번호가 일치하지 않습니다.' },
                { status: 401 }
            );
        }

        // 예치금 잔액 조회
        const { data: deposit } = await supabase
            .from('deposits')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        // JWT 토큰 생성
        const token = jwt.sign(
            {
                userId: user.id,
                phone: cleanPhone,
                company_name: user.company_name,
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        console.log(`🔑 B2B 로그인: ${user.company_name} (${cleanPhone})`);

        // 쿠키에도 토큰 저장 (iOS WebView localStorage 불안정 대응)
        const response = NextResponse.json({
            success: true,
            token,
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

        // HTTP-only 쿠키로 JWT 설정 (30일 유효)
        response.cookies.set('b2b_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30일
        });

        return response;
    } catch (error) {
        console.error('로그인 오류:', error);
        return NextResponse.json(
            { error: '로그인 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
