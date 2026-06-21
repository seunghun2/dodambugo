import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// GET: 파트너용 공지사항 목록 조회 (고정 우선, 생성일순)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const supabase = getSupabase();
        
        // 1. 전체 갯수 조회
        const { count, error: countError } = await supabase
            .from('b2b_notices')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            return NextResponse.json({ error: countError.message }, { status: 500 });
        }

        // 2. 목록 조회
        const { data, error } = await supabase
            .from('b2b_notices')
            .select('*')
            .order('is_fixed', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        
        return NextResponse.json({
            success: true,
            notices: data,
            totalCount: count || 0
        }, {
            headers: {
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
