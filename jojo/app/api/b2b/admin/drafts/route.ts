import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// B2B 임시저장 목록 조회 (어드민용)
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { data, error } = await supabase
            .from('drafts')
            .select(`
                *,
                b2b_users (
                    company_name,
                    owner_name,
                    phone
                )
            `)
            .not('b2b_user_id', 'is', null)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // 결과 가공
        const formattedDrafts = data?.map(d => {
            const b2bUser = Array.isArray(d.b2b_users) ? d.b2b_users[0] : d.b2b_users;
            return {
                ...d,
                company_name: b2bUser?.company_name || '알 수 없음',
                owner_name: b2bUser?.owner_name || '알 수 없음',
                phone: b2bUser?.phone || ''
            };
        }) || [];

        return NextResponse.json({ success: true, data: formattedDrafts });
    } catch (error: any) {
        console.error('B2B drafts fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
