import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { companyName, contactName, phone, scale, message, type } = body;

        if (!companyName || !contactName || !phone) {
            return NextResponse.json({ error: '필수 정보를 입력해 주세요.' }, { status: 400 });
        }

        // DB 저장 시도 (b2b_inquiries 테이블 또는 1:1 문의 테이블)
        try {
            await supabase.from('b2b_inquiries').insert({
                company_name: companyName,
                contact_name: contactName,
                phone: phone,
                scale: scale || '미선택',
                message: message || '',
                type: type || 'corporate_partnership',
                created_at: new Date().toISOString()
            });
        } catch (dbErr) {
            console.error('b2b_inquiries DB 저장 실패 (테이블 미생성 시 스킵):', dbErr);
        }

        // 슬랙 웹훅 알림 (환경변수 존재 시)
        const slackWebhookUrl = process.env.SLACK_B2B_WEBHOOK_URL;
        if (slackWebhookUrl) {
            try {
                await fetch(slackWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `🏢 *[부고온플러스 기업 제휴 문의 접수]*\n• 회사명: ${companyName}\n• 담당자: ${contactName}\n• 연락처: ${phone}\n• 지도사 규모: ${scale}\n• 문의내용: ${message || '내용 없음'}`
                    })
                });
            } catch (slackErr) {
                console.error('슬랙 알림 전송 오류:', slackErr);
            }
        }

        return NextResponse.json({ success: true, message: '제휴 문의가 정상적으로 접수되었습니다.' });
    } catch (error: any) {
        console.error('B2B 기업 문의 API 오류:', error);
        return NextResponse.json({ error: '문의 접수에 실패했습니다.' }, { status: 500 });
    }
}
