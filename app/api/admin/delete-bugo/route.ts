import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role 키로 Supabase 클라이언트 생성 (서버에서만 사용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        console.log('🗑️ 서버에서 부고 소프트 삭제 시도:', id);

        // 소프트 삭제: deleted_at 필드에 현재 시간 설정
        const { error } = await supabaseAdmin
            .from('bugo')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('❌ 삭제 에러:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('✅ 소프트 삭제 완료:', id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ 서버 에러:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
