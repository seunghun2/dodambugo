import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendLMS, sendAlimtalk } from '@/lib/solapi';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bugo_number, type, mourners, origin } = body;

        if (!bugo_number || !type || !mourners?.length) {
            return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
        }

        // 부고 정보 조회
        const supabase = getSupabase();
        const { data: bugo } = await supabase
            .from('bugo')
            .select('deceased_name, funeral_home, room_number, funeral_date, funeral_time, funeral_type, owner_token, ilpo_date, ilpo_time, mourner_name')
            .eq('bugo_number', bugo_number)
            .single();

        if (!bugo) {
            return NextResponse.json({ error: 'Bugo not found' }, { status: 404 });
        }

        const results = [];
        const deceased = bugo.deceased_name;
        const home = bugo.funeral_home || '';
        const room = bugo.room_number ? ` ${bugo.room_number}` : '';
        const rawDate = bugo.funeral_date || '';
        const rawTime = bugo.funeral_time || '';

        // 발인 일시 한글 포맷
        const formatFuneralDate = (dateStr: string, timeStr: string) => {
            if (!dateStr) return '-';
            try {
                const date = new Date(dateStr);
                const days = ['일', '월', '화', '수', '목', '금', '토'];
                const dayName = days[date.getDay()];
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}년 ${month}월 ${day}일 (${dayName}) ${timeStr || ''}`;
            } catch {
                return `${dateStr} ${timeStr}`;
            }
        };
        const dateFormatted = formatFuneralDate(rawDate, rawTime);

        const funeralLocation = (bugo.funeral_type === '가족장' || bugo.funeral_type === '무빈소장례')
            ? bugo.funeral_type
            : `${home}${room}`.trim();

        let dateTimeInfo = '';
        if (bugo.ilpo_date) {
            const ilpoDateTime = `${bugo.ilpo_date || ''} ${bugo.ilpo_time || ''}`.trim();
            const funeralDateTime = `${rawDate} ${rawTime}`.trim();
            dateTimeInfo = `\n(일포) ${ilpoDateTime}${funeralDateTime ? `\n(발인) ${funeralDateTime}` : ''}`;
        } else {
            dateTimeInfo = `${rawDate} ${rawTime}`.trim();
        }

        for (const m of mourners) {
            if (!m.contact) continue;
            const phone = m.contact.replace(/-/g, '');

            // 조문객용 URL: bugoon.maeumbugo.co.kr/view/ 경로 사용 (/b2b/view/ 노출 방지)
            const mParamValue = m.originalIndex !== undefined ? m.originalIndex : encodeURIComponent(m.name);
            const b2bDomain = origin?.includes('maeumbugo.co.kr') ? 'https://bugoon.maeumbugo.co.kr' : (origin || 'http://localhost:3000');
            const customUrl = `${b2bDomain}/view/${bugo_number}?m=${mParamValue}`;

            if (type === 'sms') {
                const text = `[부고 안내]
故 ${deceased} 님의 부고를 전해드립니다.

■ 모바일 부고장 링크
${customUrl}

■ 빈소: ${funeralLocation}
■ 발인: ${dateFormatted}`;

                try {
                    await sendLMS(phone, `[부고 안내] 故 ${deceased} 님`, text);
                    results.push({ name: m.name, status: 'sent_sms' });
                } catch (err) {
                    console.error(`SMS 발송 실패 for ${m.name}:`, err);
                    results.push({ name: m.name, status: 'failed' });
                }
            } else if (type === 'alimtalk') {
                try {
                    await sendAlimtalk(
                        phone,
                        'KA01TP260714223554397jpnpiNrrFt2', // B2B 부고장 알림톡 템플릿 (bugoon 프로필)
                        {
                            '대표상주명': bugo.mourner_name || '',
                            '고인명': bugo.deceased_name || '',
                            '장례식장': funeralLocation,
                            '발인일시': dateTimeInfo,
                            '부고번호': bugo_number,
                            'owner_token': bugo.owner_token || '',
                        }
                    );
                    results.push({ name: m.name, status: 'sent_alimtalk' });
                } catch (err) {
                    console.error(`알림톡 발송 실패 for ${m.name}:`, err);
                    results.push({ name: m.name, status: 'failed' });
                }
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (err) {
        console.error('B2B 상주 발송 API 오류:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
