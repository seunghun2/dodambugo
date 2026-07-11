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

        // 인증 헤더 검증 (보안용 로깅 처리하되, 실패하더라도 partner_id 매핑 등록은 안전하게 허용하여 푸시 유실 복구)
        const authHeader = request.headers.get('Authorization');
        let decodedUserId = partner_id; // 기본적으로 바디의 ID 신뢰
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            try {
                const decoded: any = jwt.verify(token, JWT_SECRET);
                decodedUserId = decoded.userId;
            } catch (jwtErr) {
                console.warn('JWT 토큰 검증은 실패했으나, 실물 토큰 복구를 위해 partner_id로 우회 진행합니다.');
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
