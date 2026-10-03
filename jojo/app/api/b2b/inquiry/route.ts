import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSimpleNotification } from '@/lib/slack';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 부고온 공식 홈페이지 제휴/도입 문의 접수
// 기존 b2b_inquiries 테이블은 존재하지 않아 문의가 유실되던 문제 → 실제 존재하는 inquiries 테이블에 저장
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { companyName, contactName, phone, scale, message, type } = body;

        if (!contactName || !phone) {
            return NextResponse.json({ error: '성함과 연락처를 입력해 주세요.' }, { status: 400 });
        }

        const fullMessage = `[부고온 홈페이지 문의] 구분: ${type || '미선택'} / 규모: ${scale || '미선택'}\n\n${message || '내용 없음'}`;

        const { error } = await supabase.from('inquiries').insert({
            name: String(contactName).slice(0, 50),
            phone: String(phone).slice(0, 20),
            company: companyName ? String(companyName).slice(0, 100) : null,
            email: '',
            inquiry_type: '부고온 제휴문의',
            message: fullMessage.slice(0, 2000),
        });

        if (error) {
            console.error('부고온 문의 DB 저장 실패:', error);
            return NextResponse.json({ error: '문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
        }

        // 슬랙 알림 (실패해도 접수는 완료)
        try {
            await sendSimpleNotification(
                `🏢 *[부고온 홈페이지 문의]*\n• 구분: ${type || '-'}\n• 소속: ${companyName || '-'}\n• 담당자: ${contactName}\n• 연락처: ${phone}\n• 규모: ${scale || '-'}\n• 내용: ${message || '내용 없음'}`
            );
        } catch (slackErr) {
            console.error('슬랙 알림 전송 오류:', slackErr);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('부고온 문의 API 오류:', error);
        return NextResponse.json({ error: '문의 접수에 실패했습니다.' }, { status: 500 });
    }
}
