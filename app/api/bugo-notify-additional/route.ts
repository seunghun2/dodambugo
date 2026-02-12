import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// POST: 추가 상주에게 부고장 생성 완료 알림톡 발송
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { parent_bugo_number, additional_mourners } = body;

        if (!parent_bugo_number || !additional_mourners?.length) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // 부고 정보 조회
        const supabase = getSupabase();
        const { data: bugo } = await supabase
            .from('bugo')
            .select('deceased_name, funeral_home, room_number, funeral_date, funeral_time, funeral_type, owner_token, ilpo_date, ilpo_time')
            .eq('bugo_number', parent_bugo_number)
            .single();

        if (!bugo) {
            return NextResponse.json({ error: 'Bugo not found' }, { status: 404 });
        }

        const { sendAlimtalk } = await import('@/lib/solapi');

        // 장례식장 정보 조합
        const funeralLocation = (bugo.funeral_type === '가족장' || bugo.funeral_type === '무빈소장례')
            ? bugo.funeral_type
            : `${bugo.funeral_home || ''} ${bugo.room_number || ''}`.trim();

        // 날짜/시간 정보
        let dateTimeInfo = '';
        if (bugo.ilpo_date) {
            const ilpoDateTime = `${bugo.ilpo_date || ''} ${bugo.ilpo_time || ''}`.trim();
            const funeralDateTime = `${bugo.funeral_date || ''} ${bugo.funeral_time || ''}`.trim();
            dateTimeInfo = `\n(일포) ${ilpoDateTime}${funeralDateTime ? `\n(발인) ${funeralDateTime}` : ''}`;
        } else {
            dateTimeInfo = `${bugo.funeral_date || ''} ${bugo.funeral_time || ''}`.trim();
        }

        const results = [];

        for (const mourner of additional_mourners) {
            if (!mourner.contact) continue;

            const phoneNumber = mourner.contact.replace(/-/g, '');
            try {
                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP2602070138097871zexjvolnSU',  // 부고장 생성 완료 템플릿
                    {
                        '고인명': bugo.deceased_name ? `故 ${bugo.deceased_name}` : '',
                        '장례식장': funeralLocation,
                        '발인일시': dateTimeInfo,
                        '부고번호': parent_bugo_number,
                        'owner_token': bugo.owner_token || '',
                    }
                );
                console.log(`✅ 추가 상주 알림톡 발송 완료: ${mourner.name} (${phoneNumber})`);
                results.push({ name: mourner.name, status: 'sent' });
            } catch (err) {
                console.error(`❌ 추가 상주 알림톡 실패: ${mourner.name} (${phoneNumber})`, err);
                results.push({ name: mourner.name, status: 'failed' });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (err) {
        console.error('추가 상주 알림 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
