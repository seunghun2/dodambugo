/**
 * B2B 파트너 자동 알림 발송 공통 모듈
 * 
 * 이벤트 발생 시 DB 템플릿을 조회하여 설정된 채널(푸시/SMS/LMS)로 자동 발송하고,
 * 발송 결과를 b2b_notification_logs에 자동 기록합니다.
 */
import { createClient } from '@supabase/supabase-js';
import { sendPushToPartner } from './fcm';
import { sendLMS } from './solapi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 지원하는 이벤트 타입
export type NotificationEventType =
  | 'signup_approved'
  | 'new_funeral'
  | 'condolence_earned'
  | 'delivery_complete'
  | 'settlement'
  | 'notice'
  | 'referral_signup'
  | 'funeral_reminder';

interface NotificationTemplate {
  id: string;
  event_type: string;
  title: string;
  body: string;
  channels: string[];
  is_active: boolean;
  variables: string[];
}

/**
 * 템플릿 내 변수를 치환합니다.
 * 예: "{{고인명}}님의 부고장" + { 고인명: "홍길동" } → "홍길동님의 부고장"
 */
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;

  const fallbackPartnerName = variables['파트너명'] || variables['수신자명'] || '파트너';
  const fallbackJoiningName = variables['가입파트너명'] || variables['신규파트너명'] || variables['가입자명'] || '신규 파트너';
  const fallbackBarinTime = variables['발인시간'] || variables['발인일시'] || variables['발인시각'] || '';

  const mergedVars: Record<string, string> = {
    ...variables,
    '파트너명': fallbackPartnerName,
    '가입파트너명': fallbackJoiningName,
    '신규파트너명': fallbackJoiningName,
    '발인시간': fallbackBarinTime,
    '발인일시': fallbackBarinTime,
  };

  for (const [key, value] of Object.entries(mergedVars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return result;
}

/**
 * 발송 로그를 DB에 기록합니다.
 */
async function logNotification(
  partnerId: string,
  eventType: string,
  channel: string,
  title: string,
  body: string,
  status: 'success' | 'fail',
  errorMessage?: string,
  recipientPhone?: string
) {
  try {
    await supabase.from('b2b_notification_logs').insert({
      partner_id: partnerId,
      event_type: eventType,
      channel,
      recipient_name: title,
      title,
      body,
      status,
      error_message: errorMessage || null,
      recipient_phone: recipientPhone || null,
    });
  } catch (err) {
    console.error('[PartnerNotification] 로그 기록 실패:', err);
  }
}

/**
 * 파트너에게 자동 알림을 발송합니다.
 * 
 * @param partnerId - 수신 파트너 UUID
 * @param eventType - 이벤트 종류
 * @param variables - 템플릿 변수 (예: { 고인명: "홍길동", 금액: "100,000" })
 * @param pushData - 푸시 클릭 시 이동할 URL 등 추가 데이터
 * 
 * @example
 * await sendPartnerNotification(
 *   'partner-uuid',
 *   'condolence_earned',
 *   { 조문객명: '김철수', 고인명: '홍길동', 금액: '100,000', 수당금액: '5,000' },
 *   { url: '/b2b/wallet' }
 * );
 */
export async function sendPartnerNotification(
  partnerId: string,
  eventType: NotificationEventType,
  variables: Record<string, string>,
  pushData?: Record<string, string>
): Promise<void> {
  try {
    // 1. DB에서 해당 이벤트의 템플릿 조회
    const { data: template, error: templateErr } = await supabase
      .from('b2b_notification_templates')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_active', true)
      .single();

    if (templateErr || !template) {
      console.warn(`[PartnerNotification] 템플릿 없음 또는 비활성: ${eventType}`);
      return;
    }

    const tmpl = template as NotificationTemplate;

    // 2. 변수 치환
    const title = replaceVariables(tmpl.title, variables);
    const body = replaceVariables(tmpl.body, variables);

    // 3. 파트너 알림 설정 조회
    const { data: partner } = await supabase
      .from('b2b_users')
      .select('alarm_all, alarm_deposit, alarm_deceased, alarm_notice, alarm_referral, alarm_reward, alarm_order, alarm_event, phone')
      .eq('id', partnerId)
      .single();

    if (!partner || !partner.alarm_all) {
      console.log(`[PartnerNotification] 파트너 알림 OFF: ${partnerId}`);
      return;
    }

    // 이벤트 타입별 세부 알림 설정 체크
    const alarmMap: Record<string, string> = {
      'condolence_earned': 'alarm_deposit',
      'settlement': 'alarm_deposit',
      'new_funeral': 'alarm_deceased',
      'delivery_complete': 'alarm_deceased',
      'funeral_reminder': 'alarm_deceased',
      'notice': 'alarm_notice',
      'signup_approved': 'alarm_notice',
      'referral_signup': 'alarm_referral',
    };

    const alarmField = alarmMap[eventType];
    if (alarmField && alarmField !== 'alarm_notice' && !(partner as any)[alarmField]) {
      console.log(`[PartnerNotification] 세부 알림 OFF: ${eventType} → ${alarmField}`);
      return;
    }

    // 4. 채널별 발송
    const channels = tmpl.channels || ['push'];

    // 푸시 발송
    if (channels.includes('push')) {
      try {
        const result = await sendPushToPartner(partnerId, title, body, {
          type: eventType,
          ...(pushData || {}),
        });
        await logNotification(partnerId, eventType, 'push', title, body,
          result.success > 0 ? 'success' : 'fail',
          result.failed > 0 ? 'FCM 전송 실패' : undefined
        );
      } catch (err: any) {
        await logNotification(partnerId, eventType, 'push', title, body, 'fail', err?.message);
      }
    }

    // LMS 발송
    if (channels.includes('lms') && partner.phone) {
      try {
        await sendLMS(partner.phone, title, body);
        await logNotification(partnerId, eventType, 'lms', title, body, 'success', undefined, partner.phone);
      } catch (err: any) {
        await logNotification(partnerId, eventType, 'lms', title, body, 'fail', err?.message, partner.phone);
      }
    }

    // SMS 발송
    if (channels.includes('sms') && partner.phone) {
      try {
        const { sendSMS } = await import('./solapi');
        await sendSMS(partner.phone, `${title}\n${body}`);
        await logNotification(partnerId, eventType, 'sms', title, body, 'success', undefined, partner.phone);
      } catch (err: any) {
        await logNotification(partnerId, eventType, 'sms', title, body, 'fail', err?.message, partner.phone);
      }
    }

    // 인앱 알림함 적재
    try {
      await supabase.from('b2b_notifications').insert({
        partner_id: partnerId,
        title,
        body,
        type: eventType,
        data: pushData || {},
      });
    } catch (err) {
      console.warn('[PartnerNotification] 알림함 적재 실패:', err);
    }

    console.log(`[PartnerNotification] ✅ ${eventType} → ${partnerId} (channels: ${channels.join(',')})`);

  } catch (err) {
    console.error(`[PartnerNotification] ❌ 발송 실패: ${eventType}`, err);
  }
}

/**
 * 전체 파트너에게 공지사항을 발송합니다.
 */
export async function sendNoticeToAllPartners(
  title: string,
  body: string,
  pushData?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  // 승인된 파트너만 조회
  const { data: partners } = await supabase
    .from('b2b_users')
    .select('id')
    .eq('status', 'approved');

  if (!partners || partners.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  // 각 파트너에게 순차 발송 (Rate limit 방지)
  for (const partner of partners) {
    try {
      await sendPartnerNotification(partner.id, 'notice', { 제목: title, 내용: body }, pushData);
      sent++;
    } catch {
      failed++;
    }
    // 100ms 딜레이 (FCM rate limit 방지)
    await new Promise(r => setTimeout(r, 100));
  }

  return { sent, failed };
}

/**
 * 인앱 알림함에만 적재합니다 (푸시 없이).
 * 파트너의 알림 설정을 체크하여 OFF이면 적재하지 않습니다.
 */
export async function insertInAppAlarm(
  partnerId: string,
  type: string,
  title: string,
  body: string,
  url?: string,
  alarmField?: string,
): Promise<void> {
  try {
    // 알림 설정 체크
    if (alarmField) {
      const { data: partner } = await supabase
        .from('b2b_users')
        .select('*')
        .eq('id', partnerId)
        .single();
      
      if (!partner?.alarm_all || !(partner as any)[alarmField]) {
        return; // 알림 OFF
      }
    }

    await supabase.from('b2b_notifications').insert({
      partner_id: partnerId,
      title,
      body,
      type,
      data: url ? { url } : null,
    });
  } catch (err) {
    console.error(`[InAppAlarm] ${type} 적재 실패:`, err);
  }
}
