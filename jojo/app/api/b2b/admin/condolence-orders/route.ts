import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { data: b2bBugos, error: bugoError } = await supabase
            .from('bugo')
            .select('id, bugo_number, b2b_user_id, b2b_users ( company_name, owner_name )')
            .not('b2b_user_id', 'is', null);

        if (bugoError) throw bugoError;

        if (!b2bBugos || b2bBugos.length === 0) {
            return NextResponse.json({ success: true, orders: [] });
        }

        const bugoIds = b2bBugos.map(b => String(b.id));
        
        const partnerMap = new Map<string, { company_name: string; owner_name: string }>();
        b2bBugos.forEach(b => {
            if (b.id) {
                partnerMap.set(String(b.id), {
                    company_name: (b.b2b_users as any)?.company_name || '알 수 없음',
                    owner_name: (b.b2b_users as any)?.owner_name || '알 수 없음'
                });
            }
        });

        const { data: orders, error: orderError } = await supabase
            .from('condolence_orders')
            .select('*')
            .in('bugo_number', bugoIds)
            .order('created_at', { ascending: false });

        if (orderError) throw orderError;

        const formattedOrders = orders?.map(o => {
            const realBugo = b2bBugos.find(b => String(b.id) === String(o.bugo_number));
            const b2bUser = realBugo?.b2b_users;
            const companyName = Array.isArray(b2bUser) 
                ? (b2bUser[0] as any)?.company_name 
                : (b2bUser as any)?.company_name;
            const ownerName = Array.isArray(b2bUser) 
                ? (b2bUser[0] as any)?.owner_name 
                : (b2bUser as any)?.owner_name;

            return {
                ...o,
                bugo_number: realBugo?.bugo_number || o.bugo_number,
                company_name: companyName || '일반 B2C',
                owner_name: ownerName || '-'
            };
        }) || [];

        return NextResponse.json({ success: true, orders: formattedOrders });
    } catch (error: any) {
        console.error('B2B 조의금 주문 조회 오류:', error);
        return NextResponse.json({ error: '조의금 주문 내역을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}
