import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// 감사장 종교 설정 저장
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { religion } = await request.json();

        const supabase = getSupabase();

        const { error } = await supabase
            .from('bugo')
            .update({ thanks_religion: religion })
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('감사장 종교 저장 오류:', error);
        return NextResponse.json(
            { error: error.message || '저장 실패' },
            { status: 500 }
        );
    }
}
