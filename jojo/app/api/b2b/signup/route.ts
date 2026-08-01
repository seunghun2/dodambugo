import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 추천 코드 생성 (숫자 4자리)
function generateReferralCode(): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return String(num);
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
            checkOnly,
        } = body;

        // 전화번호 정리
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith('010')) {
            return NextResponse.json(
                { error: '올바른 휴대폰 번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        // 중복 가입 체크 (탈퇴한 회원 neq('status', 'withdrawn') 제외 -> 재가입 허용)
        const { data: existing } = await supabase
            .from('b2b_users')
            .select('id')
            .eq('phone', cleanPhone)
            .neq('status', 'withdrawn')
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: '이미 가입된 번호입니다. 로그인해주세요.' },
                { status: 409 }
            );
        }

        // checkOnly 모드인 경우 중복 체크 성공으로 종료
        if (checkOnly) {
            return NextResponse.json({ success: true, message: '가입 가능한 번호입니다.' });
        }

        // 필수값 검증 (최종 가입 시)
        if (!password || !company_name || !owner_name) {
            return NextResponse.json(
                { error: '필수 정보를 모두 입력해주세요.' },
                { status: 400 }
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
            if (insertError.code === '23505') {
                return NextResponse.json(
                    { error: '이미 가입된 휴대폰 번호입니다. 로그인해 주세요.' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: '회원가입 중 오류가 발생했습니다: ' + (insertError.message || '') },
                { status: 500 }
            );
        }

        // 예치금 잔고 테이블 생성 (초기 잔액 0)
        await supabase.from('deposits').insert({
            user_id: newUser.id,
            balance: 0,
        });

        // 🔔 신규 가입 파트너 본인 앱 내 알림함(인앱 알림) 웰컴 생성
        await supabase.from('b2b_in_app_alarms').insert({
            user_id: newUser.id,
            title: '부고온 파트너 가입을 환영합니다!',
            message: `${owner_name || company_name || '파트너'}님, 부고온 파트너 회원가입이 완료되었습니다. 모바일 부고장을 작성하고 화환 수익을 창출해 보세요!`,
            type: 'signup_welcome',
            link_url: '/b2b/dashboard',
            is_read: false
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

        // 추천인이 있으면 추천인에게 푸시/인앱 알림 발송
        if (recommender_id) {
            supabase
                .from('b2b_users')
                .select('owner_name, company_name')
                .eq('id', recommender_id)
                .single()
                .then(({ data: recommenderUser }) => {
                    const partnerName = recommenderUser?.owner_name || recommenderUser?.company_name || '파트너';
                    const joiningPartnerName = owner_name || company_name || '신규 파트너';

                    import('@/lib/partner-notification').then(({ sendPartnerNotification }) => {
                        sendPartnerNotification(recommender_id!, 'referral_signup', {
                            파트너명: partnerName,
                            가입파트너명: joiningPartnerName,
                            신규파트너명: joiningPartnerName,
                        }, { url: '/b2b/settings' }).catch(err =>
                            console.error('[PartnerNotification] 추천인 가입 푸시 실패:', err)
                        );
                    });
                });
        }

        console.log(`✅ B2B 회원가입 완료: ${company_name} (${cleanPhone}) / 추천코드: ${my_referral_code}`);

        // 📱 B2B 슬랙 채널 신규 회원가입 알림 전송 (동기 발송 보장)
        try {
            const { sendB2BSignupNotification } = await import('@/lib/slack');
            await sendB2BSignupNotification({
                owner_name: owner_name || '파트너',
                company_name: company_name || '개인',
                phone: cleanPhone,
                company_type: company_name === '개인' ? 'individual' : 'business'
            });
        } catch (slackErr) {
            console.error('슬랙 신규가입 알림 전송 실패:', slackErr);
        }

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: newUser.id,
                phone: cleanPhone,
                company_name,
                owner_name,
                my_referral_code: newUser.my_referral_code,
                bank_name: bank_name || null,
                account_no: account_no || null,
                account_holder: account_holder || null,
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
