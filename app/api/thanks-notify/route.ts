import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// POST: 감사장 알림톡 수동 발송
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bugo_id } = body;

        if (!bugo_id) {
            return NextResponse.json({ error: 'bugo_id is required' }, { status: 400 });
        }

        const supabase = getSupabase();

        // 부고 정보 조회 (bugo_number로 검색)
        const { data: bugo, error } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, mourner_name, phone_password')
            .eq('bugo_number', bugo_id)
            .single();

        if (error || !bugo) {
            return NextResponse.json({ error: 'Bugo not found' }, { status: 404 });
        }

        if (!bugo.phone_password) {
            return NextResponse.json({ error: 'No phone number' }, { status: 400 });
        }

        const phoneNumber = bugo.phone_password.replace(/-/g, '');

        // 감사장 알림톡 발송
        await sendAlimtalk(
            phoneNumber,
            'KA01TP260122105940293Z83PibzRM5z',  // 감사장 알림톡 템플릿 (검수완료)
            {
                '상주명': bugo.mourner_name || '',
                '고인명': bugo.deceased_name || '',
                '부고ID': bugo.bugo_number,
            }
        );

        console.log('✅ 감사장 알림톡 발송 완료:', phoneNumber);

        return NextResponse.json({
            success: true,
            message: '감사장 알림톡 발송 완료',
            phone: phoneNumber
        });

    } catch (err) {
        console.error('감사장 알림톡 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
