import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendSlackMessage } from '@/lib/slack';

// 함수 내에서 supabase 클라이언트 생성 (빌드 타임 에러 방지)
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// POST: 부고 생성 알림 (부고 생성 후 호출)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bugo_number, deceased_name, funeral_home, room_number, address, funeral_date, funeral_time, mourner_name, created_new } = body;

        // 신규 생성일 때만 알림
        if (!created_new) {
            return NextResponse.json({ success: true, message: 'Notification skipped (not new)' });
        }

        // 슬랙 알림 전송
        const message = {
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '📋 새 부고장이 등록되었습니다',
                        emoji: true
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*고인:*\n${deceased_name || '미입력'}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*상주:*\n${mourner_name || '미입력'}`
                        }
                    ]
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*장례식장:*\n${funeral_home || '미입력'} ${room_number || ''}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*발인일시:*\n${funeral_date || '미정'} ${funeral_time || ''}`
                        }
                    ]
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*부고장 링크:*\n<https://maeumbugo.co.kr/view/${bugo_number}|부고장 보기>`
                    }
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} | 부고번호: ${bugo_number}`
                        }
                    ]
                },
                {
                    type: 'divider'
                }
            ]
        };

        await sendSlackMessage(message);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('부고 알림 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
