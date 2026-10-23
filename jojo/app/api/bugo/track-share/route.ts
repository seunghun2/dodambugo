import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// POST: 공유 횟수 증가
export async function POST(request: NextRequest) {
    try {
        const { bugoNumber, method } = await request.json();

        if (!bugoNumber) {
            return NextResponse.json({ error: 'bugoNumber required' }, { status: 400 });
        }

        const supabase = getSupabase();

        // share_count 증가
        const { data: bugo } = await supabase
            .from('bugo')
            .select('share_count')
            .eq('bugo_number', bugoNumber)
            .single();

        const currentCount = bugo?.share_count || 0;

        await supabase
            .from('bugo')
            .update({ share_count: currentCount + 1 })
            .eq('bugo_number', bugoNumber);

        console.log(`📤 공유 추적: ${bugoNumber} (${method}) → ${currentCount + 1}회`);

        return NextResponse.json({ success: true, share_count: currentCount + 1 });
    } catch (err) {
        console.error('공유 추적 에러:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
