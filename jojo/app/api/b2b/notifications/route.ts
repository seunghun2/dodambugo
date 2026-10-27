import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

function getUserIdFromToken(request: NextRequest): string | null {
    let token: string | undefined;

    const auth = request.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
        token = auth.slice(7);
    }

    if (!token) {
        token = request.cookies.get('b2b_token')?.value;
    }

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.userId;
    } catch {
        return null;
    }
}

// GET: 파트너의 알림 수신함 조회 (60일 이내 + 페이징/무한스크롤 지원)
export async function GET(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '30', 10);
        const offset = (page - 1) * limit;

        // 60일 전 날짜 계산
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const sixtyDaysAgoISO = sixtyDaysAgo.toISOString();

        const { data: notifications, count, error } = await supabase
            .from('b2b_notifications')
            .select('*', { count: 'exact' })
            .eq('partner_id', userId)
            .gte('created_at', sixtyDaysAgoISO)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('알림 조회 오류:', error);
            return NextResponse.json({ error: '알림 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
        }

        const totalCount = count || 0;
        const hasMore = offset + (notifications?.length || 0) < totalCount;

        return NextResponse.json({
            success: true,
            notifications: notifications || [],
            hasMore,
            totalCount,
            page,
            limit
        });
    } catch (err: any) {
        console.error('알림 라우트 예외:', err);
        return NextResponse.json({ error: '서버 내부 에러가 발생했습니다.' }, { status: 500 });
    }
}
