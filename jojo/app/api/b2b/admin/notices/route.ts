import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// GET: 어드민 공지사항 전체 조회
export async function GET() {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('b2b_notices')
        .select('*')
        .order('is_fixed', { ascending: false })
        .order('published_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, notices: data });
}

// POST: 공지사항 등록
export async function POST(request: NextRequest) {
    try {
        const { title, content, is_fixed, published_at } = await request.json();
        if (!title || !content) {
            return NextResponse.json({ error: '제목과 내용을 모두 입력해 주세요.' }, { status: 400 });
        }

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('b2b_notices')
            .insert({
                title: title.trim(),
                content: content.trim(),
                is_fixed: !!is_fixed,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                published_at: published_at ? new Date(published_at).toISOString() : new Date().toISOString(),
            })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // 비동기로 전체 파트너에게 공지사항 알림/푸시 전송 (API 응답 지연 방지)
        import('@/lib/partner-notification').then(({ sendNoticeToAllPartners }) => {
            sendNoticeToAllPartners(title.trim(), content.trim(), { url: '/b2b/notice' })
                .catch(err => console.error('[Notification] 공지 전송 오류:', err));
        });

        return NextResponse.json({ success: true, notice: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH: 공지사항 수정
export async function PATCH(request: NextRequest) {
    try {
        const { id, title, content, is_fixed, published_at } = await request.json();
        if (!id) {
            return NextResponse.json({ error: '공지사항 ID가 필요합니다.' }, { status: 400 });
        }

        const supabase = getSupabase();
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
        };
        if (title !== undefined) updateData.title = title.trim();
        if (content !== undefined) updateData.content = content.trim();
        if (is_fixed !== undefined) updateData.is_fixed = !!is_fixed;
        if (published_at !== undefined) {
            updateData.published_at = published_at ? new Date(published_at).toISOString() : new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('b2b_notices')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, notice: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE: 공지사항 삭제
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json({ error: '공지사항 ID가 필요합니다.' }, { status: 400 });
        }

        const supabase = getSupabase();
        const { error } = await supabase
            .from('b2b_notices')
            .delete()
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
