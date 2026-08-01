import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

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
        const userId = getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        // 1. 유저 및 예치금 잔액 조회
        const { data: user } = await supabase
            .from('b2b_users')
            .select('id, owner_name, company_name, phone')
            .eq('id', userId)
            .single();

        if (!user) {
            return NextResponse.json({ error: '회원 정보를 찾을 수 없습니다.' }, { status: 444 });
        }

        const { data: deposit } = await supabase
            .from('deposits')
            .select('balance')
            .eq('user_id', userId)
            .maybeSingle();

        const balance = deposit?.balance || 0;
        if (balance > 0) {
            return NextResponse.json(
                { error: `잔여 적립금(${balance.toLocaleString()}원)이 존재합니다. [수당 환급 신청]을 통해 적립금을 출금하신 후 탈퇴해 주세요.` },
                { status: 400 }
            );
        }

        // 2. 파트너 회원 상태를 withdrawn 으로 업데이트
        const { error: updateError } = await supabase
            .from('b2b_users')
            .update({
                status: 'withdrawn',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error('회원 탈퇴 처리 실패:', updateError);
            return NextResponse.json({ error: '회원 탈퇴 처리 중 오류가 발생했습니다.' }, { status: 500 });
        }

        // 3. 슬랙 채널 알림 전송 (이모지 없이 텍스트 포맷)
        try {
            const { sendToWebhook } = await import('@/lib/slack');
            const webhookUrl = process.env.SLACK_WEBHOOK_BUGO || process.env.SLACK_WEBHOOK_URL;
            if (webhookUrl) {
                // @ts-ignore
                const text = `[부고온 B2B] 파트너 회원 탈퇴 처리\n- 대표자명: ${user.owner_name}\n- 상호/소속: ${user.company_name}\n- 연락처: ${user.phone}`;
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                }).catch(err => console.error('탈퇴 슬랙 알림 실패:', err));
            }
        } catch (sErr) {
            console.error('탈퇴 슬랙 연동 에러:', sErr);
        }

        return NextResponse.json({
            success: true,
            message: '회원 탈퇴가 완료되었습니다.'
        });
    } catch (error) {
        console.error('회원 탈퇴 API 오류:', error);
        return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
