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
    // ⚠️ 환경변수 복호화 및 파싱 상태 안전 진단 (민감정보 값은 출력 금지)
    let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    console.log('[Push SDK Check CacheBust] Env Var Exists?', !!rawKey, 'Length:', rawKey?.length || 0);
    if (rawKey) {
      try {
        let decKey = rawKey.trim();
        if (!decKey.startsWith('{')) {
          decKey = Buffer.from(decKey, 'base64').toString('utf8');
          console.log('[Push SDK Check] Base64 Decoded Length:', decKey.length);
        }
        const parsed = JSON.parse(decKey);
        const hasPrivateKey = !!parsed.private_key;
        const privateKeyLength = parsed.private_key?.length || 0;
        const hasNewLines = parsed.private_key?.includes('\n') || false;
        const newLinesCount = parsed.private_key?.split('\n').length || 0;
        console.log('[Push SDK Check] JSON Parsed Successfully!', {
          project_id: parsed.project_id,
          client_email: parsed.client_email,
          hasPrivateKey,
          privateKeyLength,
          hasNewLines,
          newLinesCount,
          startsWithBegin: parsed.private_key?.startsWith('-----BEGIN PRIVATE KEY-----')
        });
      } catch (err: any) {
        console.error('[Push SDK Check] JSON Parse Error:', err.message);
      }
    }

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

    // 관리자(is_admin) 및 알림 수신 설정 정보 조회
    const { data: b2bUser, error: dbError } = await supabase
      .from('b2b_users')
      .select('is_admin, alarm_all, alarm_deposit, alarm_deceased, alarm_notice')
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
        body: pushBody,
        type: data?.type || 'notice',
        data: { url: '/b2b/settings', ...(data || {}) },
        is_read: false
      });

    if (insertError) {
      console.error('B2B 알림 수신함 기록 실패:', insertError);
    }

    // 2. FCM 실제 기기 푸시 알림 발송 (수신자 파트너의 알림 설정 상태 조회 후 발송 제어)
    let result = { success: 0, failed: 0 };
    let fcmError = null;

    // 수신자 파트너의 알림 설정 동의 상태 및 기본 정보 조회
    const { data: recipientUser, error: recipientError } = await supabase
      .from('b2b_users')
      .select('phone, company_name, alarm_all, alarm_deposit, alarm_deceased, alarm_notice')
      .eq('id', partner_id)
      .single();

    let shouldSendPush = true; // 기본값은 발송
    let recipientPhone = '010-0000-0000';
    let recipientName = '파트너';

    if (recipientError || !recipientUser) {
      console.warn(`[Push Filter] 수신자 파트너(${partner_id})의 설정을 조회할 수 없어 기본 발송 처리합니다.`, recipientError?.message);
    } else {
      recipientPhone = recipientUser.phone || recipientPhone;
      recipientName = recipientUser.company_name || recipientName;
      shouldSendPush = recipientUser.alarm_all; // 전체 알림이 켜져 있어야 함
      if (shouldSendPush) {
        const type = data?.type || '';
        if (type === 'settlement') {
          shouldSendPush = recipientUser.alarm_deposit;
        } else if (type === 'new_funeral') {
          shouldSendPush = recipientUser.alarm_deceased;
        } else if (type === 'notice') {
          shouldSendPush = recipientUser.alarm_notice;
        }
      }
    }

    let isSuccess = 'success';
    if (shouldSendPush) {
      try {
        result = await sendPushToPartner(partner_id, title, pushBody, data);
        
        // FCM 결과 객체 판정 (failed 수치 검사)
        if (result && typeof result === 'object') {
          const resObj = result as any;
          if (resObj.failed > 0 && resObj.success === 0) {
            isSuccess = 'fail';
            fcmError = resObj.errorDetails?.join(', ') || 'FCM 전송 실패';
          } else if (resObj.success === 0 && resObj.failed === 0) {
            isSuccess = 'fail';
            fcmError = 'FCM 발송 실패 (등록된 기기 토큰 없음)';
          } else if (resObj.failed > 0 && resObj.success > 0) {
            isSuccess = 'success'; // 일부 전송 성공 시 일단 성공으로 취급하되 에러 내용 병기
            fcmError = `일부 기기 전송 실패: ${resObj.errorDetails?.join(', ')}`;
          }
        }
      } catch (fcmErr: any) {
        console.warn('실물 기기 FCM 푸시 전송 실패:', fcmErr?.message || fcmErr);
        fcmError = fcmErr?.message || String(fcmErr);
        isSuccess = 'fail';
      }
    } else {
      console.log(`[Push Filter] 수신자(${partner_id})의 세부 알림 설정이 꺼져 있어 실제 폰 푸시는 건너뛰었습니다 (수신함에는 정상 적재).`);
      fcmError = '수신자 파트너가 해당 유형의 푸시 알림을 거부한 상태입니다 (수신함에는 정상 적재 완료)';
    }

    // 3. b2b_notification_logs 테이블에 발송 로그 최종 적재
    try {
      await supabase.from('b2b_notification_logs').insert({
        recipient_phone: recipientPhone,
        recipient_name: recipientName,
        channel: 'push',
        title,
        body: pushBody,
        status: isSuccess,
        error_message: fcmError || null
      });
    } catch (dbErr) {
      console.error('푸시 로그 DB 적재 실패:', dbErr);
    }

    return NextResponse.json({
      success: true,
      result,
      fcmError,
      message: 'B2B 알림 수신함 및 통합 발송 로그에 적재 완료되었습니다.'
    });
  } catch (err) {
    console.error('푸시 발송 API 오류:', err);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
