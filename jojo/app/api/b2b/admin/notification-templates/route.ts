import { verifyAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 알림 템플릿 목록 조회
export async function GET(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { data: templates, error } = await supabase
            .from('b2b_notification_templates')
            .select('*')
            .order('event_type', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ success: true, templates });
    } catch (err: any) {
        console.error('알림 템플릿 조회 API 오류:', err);
        return NextResponse.json({ error: '알림 템플릿을 불러오는데 실패했습니다.' }, { status: 500 });
    }
}

// PUT: 알림 템플릿 수정 (제목, 본문, 채널, 활성 상태)
export async function PUT(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const reqBody = await request.json();
        const { event_type, title, body, channels, is_active } = reqBody;

        if (!event_type || !title || !body) {
            return NextResponse.json({ error: '필수 정보를 입력해주세요.' }, { status: 400 });
        }

        const updateData: any = { 
            title, 
            body,
            updated_at: new Date().toISOString()
        };
        
        // 채널 변경 시 반영
        if (channels && Array.isArray(channels)) {
            updateData.channels = channels;
        }
        
        // 활성/비활성 변경 시 반영
        if (typeof is_active === 'boolean') {
            updateData.is_active = is_active;
        }

        const { data, error } = await supabase
            .from('b2b_notification_templates')
            .update(updateData)
            .eq('event_type', event_type)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, template: data });
    } catch (err: any) {
        console.error('알림 템플릿 수정 API 오류:', err);
        return NextResponse.json({ error: '템플릿 수정에 실패했습니다.' }, { status: 500 });
    }
}
