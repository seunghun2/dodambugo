import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// GET: 차단 IP 목록
export async function GET() {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('blocked_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST: IP 차단 추가
export async function POST(request: NextRequest) {
    const { ip_address, reason } = await request.json();
    if (!ip_address) return NextResponse.json({ error: 'ip_address required' }, { status: 400 });

    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('blocked_ips')
        .upsert(
            { ip_address: ip_address.trim(), reason: reason || '수동 차단', is_active: true },
            { onConflict: 'ip_address' }
        )
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// DELETE: IP 차단 해제
export async function DELETE(request: NextRequest) {
    const { ip_address } = await request.json();
    if (!ip_address) return NextResponse.json({ error: 'ip_address required' }, { status: 400 });

    const supabase = getSupabase();
    const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('ip_address', ip_address);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
