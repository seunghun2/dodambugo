import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 추천 코드 생성 (영문 대문자 + 숫자 8자리)
function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 방지: I,O,0,1 제외
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            phone,
            password,
            company_name,
            owner_name,
            bank_name,
            account_no,
            account_holder,
            referral_code, // 추천인 코드 (선택)
        } = body;

        // 필수값 검증
        if (!phone || !password || !company_name || !owner_name) {
            return NextResponse.json(
                { error: '필수 정보를 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        // 전화번호 정리
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith('010')) {
            return NextResponse.json(
                { error: '올바른 휴대폰 번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        // 비밀번호 길이 검증
        if (password.length < 6) {
            return NextResponse.json(
                { error: '비밀번호는 6자리 이상이어야 합니다.' },
                { status: 400 }
            );
        }

        // 중복 가입 체크
        const { data: existing } = await supabase
            .from('b2b_users')
            .select('id')
            .eq('phone', cleanPhone)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: '이미 가입된 번호입니다. 로그인해주세요.' },
                { status: 409 }
            );
        }

        // 추천인 코드 확인 (입력된 경우)
        let recommender_id: string | null = null;
        if (referral_code && referral_code.trim()) {
            const { data: recommender } = await supabase
                .from('b2b_users')
                .select('id, company_name, owner_name')
                .eq('my_referral_code', referral_code.trim().toUpperCase())
                .single();

            if (!recommender) {
                return NextResponse.json(
                    { error: '존재하지 않는 추천 코드입니다.' },
                    { status: 400 }
                );
            }
            recommender_id = recommender.id;
        }

        // 비밀번호 해시
        const password_hash = await bcrypt.hash(password, 10);

        // 고유 추천 코드 생성 (중복 체크)
        let my_referral_code = generateReferralCode();
        let codeExists = true;
        while (codeExists) {
            const { data: codeCheck } = await supabase
                .from('b2b_users')
                .select('id')
                .eq('my_referral_code', my_referral_code)
                .single();
            if (!codeCheck) {
                codeExists = false;
            } else {
                my_referral_code = generateReferralCode();
            }
        }

        // 회원 INSERT
        const { data: newUser, error: insertError } = await supabase
            .from('b2b_users')
            .insert({
                phone: cleanPhone,
                password_hash,
                company_name,
                owner_name,
                bank_name: bank_name || null,
                account_no: account_no || null,
                account_holder: account_holder || null,
                recommender_id,
                my_referral_code,
                status: 'approved',
            })
            .select('id, my_referral_code')
            .single();

        if (insertError) {
            console.error('회원가입 INSERT 오류:', insertError);
            return NextResponse.json(
                { error: '회원가입 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // 예치금 잔고 테이블 생성 (초기 잔액 0)
        await supabase.from('deposits').insert({
            user_id: newUser.id,
            balance: 0,
        });

        // JWT 토큰 생성
        const jwt = await import('jsonwebtoken');
        const token = jwt.default.sign(
            {
                userId: newUser.id,
                phone: cleanPhone,
                company_name,
            },
            process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key',
            { expiresIn: '30d' }
        );

        console.log(`✅ B2B 회원가입 완료: ${company_name} (${cleanPhone}) / 추천코드: ${my_referral_code}`);

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: newUser.id,
                phone: cleanPhone,
                company_name,
                owner_name,
                my_referral_code: newUser.my_referral_code,
            },
        });
    } catch (error) {
        console.error('회원가입 오류:', error);
        return NextResponse.json(
            { error: '회원가입 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
