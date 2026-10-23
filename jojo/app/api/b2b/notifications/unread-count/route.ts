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

// GET: 읽지 않은 알림 카운트 조회
export async function GET(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ count: 0 }, { status: 401 });
        }

        const { count, error } = await supabase
            .from('b2b_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('partner_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('안읽은 알림 조회 오류:', error);
            return NextResponse.json({ count: 0 });
        }

        return NextResponse.json({ count: count || 0 });
    } catch (err: any) {
        console.error('안읽은 알림 에러:', err);
        return NextResponse.json({ count: 0 });
    }
}
