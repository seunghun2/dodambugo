import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

function getUserIdFromToken(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : request.cookies.get('b2b_token')?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.userId;
    } catch {
        return null;
    }
}

// PATCH: 사용자의 모든 안읽은 알림을 읽음 처리
export async function PATCH(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        await supabase
            .from('b2b_notifications')
            .update({ is_read: true })
            .eq('partner_id', userId)
            .eq('is_read', false);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: '모두 읽음 처리 실패' }, { status: 500 });
    }
}
