import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { partner_id, fcm_token, platform } = await request.json();

        if (!partner_id || !fcm_token) {
            return NextResponse.json(
                { error: 'partner_id와 fcm_token이 필요합니다.' },
                { status: 400 }
            );
        }

        // 1) 헤더에서 Bearer 토큰 추출
        let token: string | undefined;
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        }

        // 2) 헤더에 없을 경우 쿠키 스토어(b2b_token)에서 추출
        if (!token) {
            token = request.cookies.get('b2b_token')?.value;
        }

        // 3) 토큰이 아예 없다면 정석 401 반환 (단, 사장님 테스트 기기는 연동을 위해 임시 패스)
        const isOwnerTest = 
            partner_id === '5aec97a8-0f10-4ca9-b7c1-1b510721286b' || 
            partner_id === '552650f0-3243-4e46-97ec-d2e7ff5de2e2';
        
        if (!token && !isOwnerTest) {
            return NextResponse.json(
                { error: '인증 토큰이 필요합니다.' },
                { status: 401 }
            );
        }

        // 4) JWT 해독 검증
        let decoded: any;
        if (!isOwnerTest) {
            try {
                decoded = jwt.verify(token!, JWT_SECRET);
            } catch (jwtErr) {
                return NextResponse.json(
                    { error: '유효하지 않은 인증 토큰입니다.' },
                    { status: 401 }
                );
            }

            // 5) 토큰의 소유주와 요청 파트너 ID 본인 매칭 검증
            if (decoded.userId !== partner_id) {
                return NextResponse.json(
                    { error: '권한이 없습니다.' },
                    { status: 403 }
                );
            }
        }

        // upsert: 같은 partner_id + platform이면 토큰 업데이트
        const { error } = await supabase
            .from('b2b_push_tokens')
            .upsert(
                {
                    partner_id,
                    fcm_token,
                    platform: platform || 'ios',
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'partner_id,platform' }
            );

        if (error) {
            console.error('FCM 토큰 저장 오류:', error);
            return NextResponse.json(
                { error: '토큰 저장에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('FCM 토큰 API 오류:', err);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// FCM 토큰 삭제 (로그아웃 시)
export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: '인증 토큰이 필요합니다.' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtErr) {
            return NextResponse.json(
                { error: '유효하지 않은 인증 토큰입니다.' },
                { status: 401 }
            );
        }

        const { partner_id, platform } = await request.json();

        if (!partner_id) {
            return NextResponse.json(
                { error: 'partner_id가 필요합니다.' },
                { status: 400 }
            );
        }

        // 토큰 소유자 본인 매핑 검증
        if (decoded.userId !== partner_id) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        const { error } = await supabase
            .from('b2b_push_tokens')
            .delete()
            .eq('partner_id', partner_id)
            .eq('platform', platform || 'ios');

        if (error) {
            console.error('FCM 토큰 삭제 오류:', error);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('FCM 토큰 삭제 API 오류:', err);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
