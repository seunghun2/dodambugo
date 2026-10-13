import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// GET: 최근 접속 로그 조회 (offset 기반 페이지네이션)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabase();

    // IP 필터링 (차단 IP 목록의 기기 정보 조회용)
    const ips = searchParams.get('ips');
    if (ips) {
        const ipList = ips.split(',');
        // 각 IP의 최근 접속 로그 1건씩 가져오기
        const results = [];
        for (const ip of ipList) {
            const { data } = await supabase
                .from('access_logs')
                .select('ip_address, user_agent')
                .eq('ip_address', ip.trim())
                .order('created_at', { ascending: false })
                .limit(1);
            if (data && data.length > 0) results.push(data[0]);
        }
        return NextResponse.json(results);
    }

    const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
