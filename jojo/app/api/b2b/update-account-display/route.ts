import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// 상주별 계좌 노출 설정 실시간 저장 API
export async function POST(request: NextRequest) {
    try {
        const { bugo_number, mourners } = await request.json();

        if (!bugo_number || !mourners) {
            return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
        }

        const supabase = getSupabase();
        const { error } = await supabase
            .from('bugo')
            .update({ mourners: JSON.stringify(mourners) })
            .eq('bugo_number', bugo_number);

        if (error) {
            console.error('계좌 노출 설정 저장 실패:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('계좌 노출 API 오류:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
