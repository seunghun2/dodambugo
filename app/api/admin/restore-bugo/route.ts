import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        console.log('🔄 부고 복구 시도:', id);

        // deleted_at을 null로 설정하여 복구
        const { error } = await supabaseAdmin
            .from('bugo')
            .update({ deleted_at: null })
            .eq('id', id);

        if (error) {
            console.error('❌ 복구 에러:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('✅ 복구 완료:', id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ 서버 에러:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
