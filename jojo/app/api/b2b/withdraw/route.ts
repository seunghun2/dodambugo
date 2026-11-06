import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'maeumbugo-b2b-secret-key' : '');

function getUserIdFromToken(request: NextRequest): string | null {
    let token: string | undefined;

    const auth = request.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
        token = auth.slice(7);
    }

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

export async function POST(request: NextRequest) {
    try {
        let body: any = {};
        try {
            body = await request.json();
        } catch {}

        let userId = getUserIdFromToken(request);

        // 비로그인 웹 계정삭제 요청(휴대폰번호 + 비밀번호 인증) 지원 (Google Play 웹 계정 삭제 정책 대응)
        if (!userId && body.phone && body.password) {
            const cleanPhone = String(body.phone).replace(/[^0-9]/g, '');
            const { data: targetUser } = await supabase
                .from('b2b_users')
                .select('id, password_hash, status')
                .eq('phone', cleanPhone)
                .neq('status', 'withdrawn')
                .maybeSingle();

            if (!targetUser) {
                return NextResponse.json({ error: '일치하는 활성 회원 정보를 찾을 수 없습니다.' }, { status: 404 });
            }

            const bcrypt = await import('bcryptjs');
            const isValid = await bcrypt.default.compare(String(body.password), targetUser.password_hash || '');
            if (!isValid) {
                return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
            }
            userId = targetUser.id;
        }

        if (!userId) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        // 1. 유저 및 예치금 잔액 조회
        const { data: user } = await supabase
            .from('b2b_users')
            .select('id, owner_name, company_name, phone, id_card_url')
            .eq('id', userId)
            .single();

        if (!user) {
            return NextResponse.json({ error: '회원 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        const { data: deposit } = await supabase
            .from('deposits')
            .select('balance')
            .eq('user_id', userId)
            .maybeSingle();

        const balance = deposit?.balance || 0;
        if (balance > 0 && !body.forfeitBalance) {
            return NextResponse.json(
                {
                    error: `잔여 적립금(${balance.toLocaleString()}원)이 존재합니다. 적립금 소멸에 동의하시거나 환급 신청 후 탈퇴해 주세요.`,
                    balance,
                    requireForfeitConfirm: true
                },
                { status: 400 }
            );
        }

        // 2. 신분증 원본 이미지 Storage 파기 및 푸시 토큰/잔여 적립금 정리
        if (user.id_card_url) {
            await supabase.storage.from('b2b-id-cards').remove([user.id_card_url]).catch(() => {});
        }
        await supabase.from('b2b_push_tokens').delete().eq('user_id', userId);
        if (balance > 0) {
            await supabase.from('deposits').update({ balance: 0 }).eq('user_id', userId);
        }

        // 3. 파트너 회원 상태를 withdrawn 으로 업데이트 및 민감 개인정보 즉시 파기
        const { error: updateError } = await supabase
            .from('b2b_users')
            .update({
                status: 'withdrawn',
                identity_verified: false,
                identity_name: null,
                rrn_front: null,
                rrn_back: null,
                identity_type: null,
                id_issue_date: null,
                driver_license_no: null,
                identity_phone: null,
                id_card_url: null,
                verification_status: null,
                bank_name: null,
                account_no: null,
                account_holder: null,
                avatar_url: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error('회원 탈퇴 처리 실패:', updateError);
            return NextResponse.json({ error: '회원 탈퇴 처리 중 오류가 발생했습니다.' }, { status: 500 });
        }

        // 4. 슬랙 채널 알림 전송 (이모지 없이 텍스트 포맷)
        try {
            const { sendSimpleNotification } = await import('@/lib/slack');
            const text = `[부고온 B2B] 파트너 회원 탈퇴 처리\n- 대표자명: ${user.owner_name}\n- 상호/소속: ${user.company_name}\n- 연락처: ${user.phone}`;
            await sendSimpleNotification(text).catch(err => console.error('탈퇴 슬랙 알림 실패:', err));
        } catch (sErr) {
            console.error('탈퇴 슬랙 연동 에러:', sErr);
        }

        const response = NextResponse.json({
            success: true,
            message: '회원 탈퇴가 완료되었습니다.'
        });
        response.cookies.set('b2b_token', '', { path: '/', maxAge: 0 });
        return response;
    } catch (error) {
        console.error('회원 탈퇴 API 오류:', error);
        return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
