import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeThanksMessage } from '@/lib/gift/thanks-messages';

// Lazy initialization - 함수 내에서 호출
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { message } = await request.json();

        const supabase = getSupabase();
        const { data: bugo } = await supabase
            .from('bugo')
            .select('deceased_name')
            .eq('id', id)
            .maybeSingle();
        const deceasedName = bugo?.deceased_name || '고인';

        let sanitized = message;
        if (typeof message === 'string') {
            sanitized = sanitizeThanksMessage(message, deceasedName);
        } else if (message && typeof message === 'object') {
            sanitized = Object.fromEntries(
                Object.entries(message as Record<string, unknown>).map(([k, v]) => [
                    k,
                    typeof v === 'string' ? sanitizeThanksMessage(v, deceasedName) : v,
                ])
            );
        }

        const { error } = await supabase
            .from('bugo')
            .update({ thanks_message: sanitized })
            .eq('id', id);

        if (error) {
            console.error('Error updating thanks message:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
