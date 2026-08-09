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
        // B2B 부의금 주문만 조회 (source = 'b2b', fallback: moid BCOND_)
        let orders: any[] = [];
        const { data: srcData, error: srcError } = await supabase
            .from('condolence_orders')
            .select('*')
            .eq('source', 'b2b')
            .order('created_at', { ascending: false });

        if (!srcError && srcData && srcData.length > 0) {
            orders = srcData;
        } else {
            // source 컬럼 캐시 미반영 시 moid 패턴으로 fallback
            const { data: moidData } = await supabase
                .from('condolence_orders')
                .select('*')
                .like('moid', 'BCOND_%')
                .order('created_at', { ascending: false });
            orders = moidData || [];
        }

        // B2B 파트너 정보 매칭용
        const { data: b2bBugos } = await supabase
            .from('bugo')
            .select('id, bugo_number, b2b_user_id, b2b_users ( company_name, owner_name )')
            .not('b2b_user_id', 'is', null);

        // id 오름차순으로 순번 계산 후 최신순으로 재정렬
        const sortedById = [...(orders || [])].sort((a, b) => a.id - b.id);
        const idToDoNum = new Map<number, number>();
        sortedById.forEach((o, idx) => { idToDoNum.set(o.id, idx + 1); });

        const formattedOrders = (orders || []).map(o => {
            const realBugo = (b2bBugos || []).find(b => String(b.id) === String(o.bugo_number));
            const b2bUser = realBugo?.b2b_users;
            const companyName = Array.isArray(b2bUser) 
                ? (b2bUser[0] as any)?.company_name 
                : (b2bUser as any)?.company_name;
            const ownerName = Array.isArray(b2bUser) 
                ? (b2bUser[0] as any)?.owner_name 
                : (b2bUser as any)?.owner_name;

            // B2B 주문번호: DO 접두사 (순번 기반)
            const doNum = idToDoNum.get(o.id) || 1;
            const displayOrderNumber = 'DO' + String(doNum).padStart(6, '0');

            return {
                ...o,
                order_number: displayOrderNumber,
                bugo_number: realBugo?.bugo_number || o.bugo_number,
                company_name: companyName || '알 수 없음',
                owner_name: ownerName || '-'
            };
        });

        return NextResponse.json({ success: true, orders: formattedOrders });
    } catch (error: any) {
        console.error('B2B 조의금 주문 조회 오류:', error);
        return NextResponse.json({ error: '조의금 주문 내역을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}
