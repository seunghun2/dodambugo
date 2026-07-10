/**
 * POST /api/b2b/send-push
 * 특정 파트너에게 푸시 알림을 발송합니다 (관리자 전용)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToPartner } from '@/lib/fcm';

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

    // JWT 토큰 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 인증 토큰입니다.' },
        { status: 401 }
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

    // 푸시 알림 발송
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
