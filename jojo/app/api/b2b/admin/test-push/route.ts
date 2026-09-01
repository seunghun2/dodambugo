import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-auth';
import { sendPushToPartner } from '@/lib/fcm';
import { sendPartnerNotification } from '@/lib/partner-notification';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const rawPhone = body.phone || '01064262393';
        const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

        // 1. 파트너 조회 (01064262393 or 010-6426-2393)
        const { data: partners, error: partnerErr } = await supabase
            .from('b2b_users')
            .select('id, owner_name, phone, company_name, alarm_all, alarm_deceased')
            .or(`phone.eq.${cleanPhone},phone.eq.${rawPhone}`);

        if (partnerErr || !partners || partners.length === 0) {
            return NextResponse.json({ error: `전화번호 ${rawPhone}에 해당하는 파트너를 찾을 수 없습니다.` }, { status: 404 });
        }

        const partner = partners[0];

        // 2. 등록된 푸시 토큰 조회
        const { data: tokens } = await supabase
            .from('b2b_push_tokens')
            .select('id, platform, fcm_token, updated_at')
            .eq('partner_id', partner.id);

        const title = body.title || '[부고온] 실기기 푸시 테스트';
        const pushBody = body.body || `안녕하세요 ${partner.owner_name || '대표'}님, 부고온 실시간 푸시가 정상 수신되었습니다! (${new Date().toLocaleTimeString('ko-KR')})`;

        // 3. 실시간 푸시 발송
        const pushResult = await sendPushToPartner(partner.id, title, pushBody, {
            type: 'funeral_reminder',
            url: '/b2b/dashboard',
        });

        // 4. 파트너 알림 모듈을 통한 표준 이벤트 테스트 발송 (발인 임박 안내 템플릿 테스트)
        await sendPartnerNotification(partner.id, 'funeral_reminder', {
            고인명: '테스트',
            장례식장: '부고온 장례식장',
            발인시간: '오전 10시',
            발인일시: `${new Date().toISOString().split('T')[0]} 10:00`,
        }, { url: '/b2b/manage' });

        return NextResponse.json({
            success: true,
            partner: {
                id: partner.id,
                name: partner.owner_name,
                phone: partner.phone,
                company: partner.company_name,
                alarm_all: partner.alarm_all,
            },
            tokens: tokens || [],
            pushResult,
            message: pushResult.success > 0 ? '푸시 발송 성공!' : '푸시 발송 실패 또는 토큰 없음',
        });
    } catch (err: any) {
        console.error('테스트 푸시 발송 오류:', err);
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}
