import { verifyAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 발송 로그 조회 (어드민용)
export async function GET(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';

    try {
        let query = supabase
            .from('b2b_notification_logs')
            .select('*');

        if (type !== 'all') {
            query = query.eq('type', type);
        }

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`recipient_phone.ilike.%${search}%,recipient_name.ilike.%${search}%,title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        // 최신 발송 순 100건 정렬
        query = query.order('created_at', { ascending: false }).limit(100);

        const { data: logs, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, logs });
    } catch (err: any) {
        console.error('B2B 알림 로그 조회 API 오류:', err);
        return NextResponse.json({ error: '발송 로그를 불러오는데 실패했습니다.' }, { status: 500 });
    }
}
