/**
 * POST /api/b2b/send-push
 * 특정 파트너에게 푸시 알림을 발송합니다 (관리자 전용)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToPartner } from '@/lib/fcm';

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

// JWT 검증용 Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 JWT 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // JWT 토큰 검증 (B2B 커스텀 JWT 대응)
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 인증 토큰입니다.' },
        { status: 401 }
      );
    }

    // 관리자(is_admin) 권한 검증
    const { data: b2bUser, error: dbError } = await supabase
      .from('b2b_users')
      .select('is_admin')
      .eq('id', decoded.userId)
      .single();

    if (dbError || !b2bUser || !b2bUser.is_admin) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 요청 body 파싱
    const body = await request.json();
    const { partner_id, title, body: pushBody, data } = body;

    // 필수 필드 검증
    if (!partner_id || !title || !pushBody) {
      return NextResponse.json(
        { success: false, error: 'partner_id, title, body는 필수입니다.' },
        { status: 400 }
      );
    }

    // 1. b2b_notifications 테이블에 알림 수신함 내역 실시간 insert 적재
    const { error: insertError } = await supabase
      .from('b2b_notifications')
      .insert({
        partner_id,
        title,
        content: pushBody,
        is_read: false
      });

    if (insertError) {
      console.error('B2B 알림 수신함 기록 실패:', insertError);
    }

    // 2. FCM 실제 기기 푸시 알림 발송 (FCM 토큰 대상)
    const result = await sendPushToPartner(partner_id, title, pushBody, data);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err) {
    console.error('푸시 발송 API 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
