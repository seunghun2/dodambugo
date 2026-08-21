import { verifyAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
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

        // B2B 파트너 정보 & 상조회사 매칭용
        const { data: b2bBugos } = await supabase
            .from('bugo')
            .select('id, bugo_number, b2b_user_id, b2b_users ( company_name, owner_name, company_id )')
            .not('b2b_user_id', 'is', null);

        const { data: b2bCompanies } = await supabase
            .from('b2b_companies')
            .select('id, name, condolence_company_rate');

        // id 오름차순으로 순번 계산 후 최신순으로 재정렬
        const sortedById = [...(orders || [])].sort((a, b) => a.id - b.id);
        const idToDoNum = new Map<number, number>();
        sortedById.forEach((o, idx) => { idToDoNum.set(o.id, idx + 1); });

        const formattedOrders = (orders || []).map(o => {
            // 부고장을 생성한 B2B 장례지도사 정보 매칭
            const realBugo = (b2bBugos || []).find(b => String(b.id) === String(o.bugo_number) || String(b.bugo_number) === String(o.bugo_number));
            const b2bUser = realBugo?.b2b_users;
            const companyName = Array.isArray(b2bUser) 
                ? (b2bUser[0] as any)?.company_name 
                : (b2bUser as any)?.company_name;
            const ownerName = Array.isArray(b2bUser) 
                ? (b2bUser[0] as any)?.owner_name 
                : (b2bUser as any)?.owner_name;
            const companyId = Array.isArray(b2bUser) 
                ? (b2bUser[0] as any)?.company_id 
                : (b2bUser as any)?.company_id;

            const company = (b2bCompanies || []).find(c => c.id === companyId || c.name === companyName);
            // 상조회사 소속 파트너 여부 판단 (company_id가 있고 b2b_companies에 존재하는 경우만 상조 소속으로 인정)
            const isCompanyPartner = !!companyId && !!company && companyName !== '알 수 없음';
            const companyRate = isCompanyPartner ? (company?.condolence_company_rate ?? 3.3) : 0;

            // 상조회사 쉐어 몫 = 상조 소속일 때만 퍼센트 적용, 상조 미소속이면 0원
            const companyShareAmount = isCompanyPartner ? Math.round((o.amount || 0) * (companyRate / 100)) : 0;
            // 대표님(플랫폼) 몫 = 상조 미소속 시 수수료 100% 전체, 상조 소속 시 수수료 - 상조 몫
            const platformShareAmount = isCompanyPartner ? Math.max(0, (o.fee || 0) - companyShareAmount) : (o.fee || 0);

            // B2B 주문번호: DO 접두사 (순번 기반)
            const doNum = idToDoNum.get(o.id) || 1;
            const displayOrderNumber = 'DO' + String(doNum).padStart(6, '0');

            return {
                ...o,
                order_number: displayOrderNumber,
                bugo_number: realBugo?.bugo_number || o.bugo_number,
                company_name: companyName || '알 수 없음',
                owner_name: ownerName || '-',
                condolence_company_rate: companyRate,
                company_share_amount: companyShareAmount,
                platform_share_amount: platformShareAmount
            };
        });

        return NextResponse.json({ success: true, orders: formattedOrders });
    } catch (error: any) {
        console.error('B2B 조의금 주문 조회 오류:', error);
        return NextResponse.json({ error: '조의금 주문 내역을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}
