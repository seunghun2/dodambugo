import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

function getUserIdFromToken(request: NextRequest): string | null {
    let token = request.headers.get('Authorization');
    if (token?.startsWith('Bearer ')) {
        token = token.slice(7);
    } else {
        token = request.cookies.get('b2b_token')?.value || null;
    }

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.userId || null;
    } catch {
        return null;
    }
}

// 상주별 계좌 노출 설정 실시간 저장 API
export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const { bugo_number, mourners } = await request.json();

        if (!bugo_number || !mourners) {
            return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
        }

        // 1. 해당 부고장의 소유자(b2b_user_id) 확인
        const { data: bugo, error: bugoError } = await supabase
            .from('bugo')
            .select('id, b2b_user_id')
            .eq('bugo_number', String(bugo_number))
            .maybeSingle();

        if (bugoError || !bugo) {
            return NextResponse.json({ error: '부고장을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 2. 소유권 검증 (이 부고장을 만든 지도사 본인인지 확인)
        if (bugo.b2b_user_id !== userId) {
            return NextResponse.json({ error: '해당 부고장에 대한 수정 권한이 없습니다.' }, { status: 403 });
        }

        // 3. 안전하게 업데이트
        const { error: updateError } = await supabase
            .from('bugo')
            .update({ 
                mourners: typeof mourners === 'string' ? mourners : JSON.stringify(mourners),
                updated_at: new Date().toISOString()
            })
            .eq('id', bugo.id);

        if (updateError) {
            console.error('계좌 노출 설정 저장 실패:', updateError);
            return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('계좌 노출 API 오류:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
