import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// POST: 상주 토큰 검증 & 무효화
export async function POST(request: NextRequest) {
    try {
        const { bugoId, token } = await request.json();

        if (!bugoId || !token) {
            return NextResponse.json({ valid: false, error: 'Missing parameters' });
        }

        const supabase = getSupabase();

        // 토큰 확인 (bugo_number 또는 id로 조회)
        const { data: bugo, error } = await supabase
            .from('bugo')
            .select('id, owner_token, owner_token_used')
            .or(`id.eq.${bugoId},bugo_number.eq.${bugoId}`)
            .single();

        if (error || !bugo) {
            return NextResponse.json({ valid: false, error: 'Bugo not found' });
        }

        // 토큰 검증
        if (bugo.owner_token !== token) {
            return NextResponse.json({ valid: false, error: 'Invalid token' });
        }

        // 이미 사용된 토큰인지 확인
        if (bugo.owner_token_used) {
            return NextResponse.json({ valid: false, error: 'Token already used' });
        }

        // 토큰 무효화 (한 번 사용 후 더 이상 못 씀)
        await supabase
            .from('bugo')
            .update({ owner_token_used: true })
            .eq('id', bugo.id);

        console.log('✅ 상주 토큰 인증 완료 & 무효화:', bugoId);

        return NextResponse.json({ valid: true });
    } catch (err) {
        console.error('토큰 검증 에러:', err);
        return NextResponse.json({ valid: false, error: 'Server error' });
    }
}
