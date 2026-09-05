import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// POST: 클라이언트에서 실행된 이벤트 및 뷰 수치를 DB에 기록
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, category, label, value, path } = body;

        const supabase = getSupabase();

        // access_logs 테이블에 이벤트 및 접속 경로 기록
        await supabase.from('access_logs').insert([
            {
                path: path || action,
                user_agent: `${category || 'event'}:${action}${label ? ':' + label : ''}`,
                ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
            }
        ]).catch(() => {});

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
