import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// POST: thanks_religion 저장
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { religion } = body;

        const supabase = getSupabase();

        const { error } = await supabase
            .from('bugo')
            .update({ thanks_religion: religion })
            .eq('id', id);

        if (error) {
            console.error('thanks_religion 저장 실패:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('thanks_religion 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
