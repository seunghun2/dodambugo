import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: B2B 파트너들이 생성한 부고 리스트 조회
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    try {
        // B2B 유저가 개설한 부고 데이터 (b2b_user_id IS NOT NULL)
        let query = supabase
            .from('bugo')
            .select(`
                id,
                bugo_number,
                deceased_name,
                mourner_name,
                mourners,
                funeral_home,
                room_number,
                created_at,
                b2b_user_id,
                funeral_type,
                view_count,
                flower_count,
                ip_address,
                deleted_at,
                template_id,
                message,
                address,
                hide_flower_order,
                b2b_users ( company_name, owner_name, phone )
            `)
            .not('b2b_user_id', 'is', null);

        if (search) {
            query = query.or(`deceased_name.ilike.%${search}%,mourner_name.ilike.%${search}%,funeral_home.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false });

        const { data: bugoData, error } = await query;

        if (error) throw error;

        // 결과 가공
        const formattedBugoList = bugoData?.map(b => {
            const b2bUser = Array.isArray(b.b2b_users) ? b.b2b_users[0] : b.b2b_users;
            return {
                id: b.id,
                bugo_number: b.bugo_number,
                deceased_name: b.deceased_name,
                mourner_name: b.mourner_name,
                mourners: b.mourners,
                funeral_home: b.funeral_home,
                room: b.room_number,
                created_at: b.created_at,
                company_name: b2bUser?.company_name || '알 수 없음',
                owner_name: b2bUser?.owner_name || '알 수 없음',
                phone: b2bUser?.phone || '',
                funeral_type: b.funeral_type,
                view_count: b.view_count || 0,
                flower_count: b.flower_count || 0,
                ip_address: b.ip_address || '',
                deleted_at: b.deleted_at,
                template_id: b.template_id,
                message: b.message || '',
                address: b.address || '',
                hide_flower_order: b.hide_flower_order
            };
        }) || [];

        return NextResponse.json({ success: true, bugoList: formattedBugoList });
    } catch (error: any) {
        console.error('B2B 부고 목록 조회 API 오류:', error);
        return NextResponse.json({ error: '부고 목록을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}
