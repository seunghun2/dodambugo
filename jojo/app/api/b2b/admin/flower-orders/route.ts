import { verifyAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: B2B 연계 결제완료된 화환 주문 및 수당 정보 조회
export async function GET(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    try {
        // 1. B2B 파트너와 연계된 결제 완료 이상 상태인 화환 주문 inner join 조회
        let query = supabase
            .from('flower_orders')
            .select(`
                id,
                order_number,
                product_name,
                product_price,
                payment_method,
                status,
                created_at,
                recipient_name,
                funeral_home,
                room,
                address,
                sender_name,
                sender_phone,
                ribbon_text1,
                ribbon_text2,
                bugo!inner (
                    id,
                    deceased_name,
                    mourners,
                    b2b_user_id,
                    b2b_users ( company_name, owner_name, company_id )
                )
            `)
            .neq('status', 'pending')
            .not('bugo.b2b_user_id', 'is', null);

        if (search) {
            query = query.or(`product_name.ilike.%${search}%,recipient_name.ilike.%${search}%,funeral_home.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false });

        const { data: ordersData, error: ordersError } = await query;

        if (ordersError) throw ordersError;

        if (!ordersData || ordersData.length === 0) {
            return NextResponse.json({ success: true, orders: [] });
        }

        const orderIds = ordersData.map(o => o.id);

        // 2. 상조회사 목록 조회
        const { data: b2bCompanies } = await supabase
            .from('b2b_companies')
            .select('id, name');
        const companyMap = new Map<string, string>();
        b2bCompanies?.forEach((c: any) => companyMap.set(c.id, c.name));

        // 3. 해당 주문들에 매칭된 예치금 거래 내역(수당 적립액 확인용) 조회
        const { data: txData, error: txError } = await supabase
            .from('deposit_transactions')
            .select('related_order_id, amount, type')
            .in('related_order_id', orderIds);

        if (txError) throw txError;

        // 4. 거래 내역을 주문 ID 기준으로 매핑 (wreath_reward 및 referral_bonus)
        const txMap: Record<string, { reward: number; bonus: number }> = {};
        orderIds.forEach(id => {
            txMap[id] = { reward: 0, bonus: 0 };
        });

        txData?.forEach(tx => {
            const orderId = tx.related_order_id;
            if (orderId && txMap[orderId]) {
                if (tx.type === 'wreath_reward') {
                    txMap[orderId].reward = tx.amount;
                } else if (tx.type === 'referral_bonus') {
                    txMap[orderId].bonus = tx.amount;
                }
            }
        });

        // 5. 최종 결과 가공
        const formattedOrders = ordersData.map(o => {
            const price = Number(o.product_price) || 0;
            const txInfo = txMap[o.id] || { reward: 0, bonus: 0 };

            const bugo = Array.isArray(o.bugo) ? o.bugo[0] : o.bugo;
            const b2bUser = bugo ? (Array.isArray(bugo.b2b_users) ? bugo.b2b_users[0] : bugo.b2b_users) : null;
            const displayCompanyName = (b2bUser?.company_id && companyMap.get(b2bUser.company_id)) || b2bUser?.company_name || '개인';

            // 상주 정보에서 대표 상주 성함 파싱
            let primaryMournerName = '';
            try {
                const mournersArr = bugo?.mourners 
                    ? (typeof bugo.mourners === 'string' ? JSON.parse(bugo.mourners) : bugo.mourners) 
                    : [];
                if (Array.isArray(mournersArr) && mournersArr.length > 0) {
                    primaryMournerName = mournersArr[0]?.name || '';
                }
            } catch (e) {
                console.error('상주 정보 파싱 에러:', e);
            }

            const recipientName = o.recipient_name || primaryMournerName || '-';

            return {
                id: o.id,
                order_number: o.order_number,
                product_name: o.product_name,
                price,
                payment_method: o.payment_method || 'CARD',
                status: o.status,
                created_at: o.created_at,
                recipient_name: recipientName,
                funeral_home: o.funeral_home,
                room: o.room,
                address: o.address || '',
                sender_name: o.sender_name || '',
                sender_phone: o.sender_phone || '',
                ribbon_text1: o.ribbon_text1 || '',
                ribbon_text2: o.ribbon_text2 || '',
                deceased_name: bugo?.deceased_name || '알 수 없음',
                company_name: displayCompanyName,
                owner_name: b2bUser?.owner_name || '알 수 없음',
                reward_amount: txInfo.reward,
                bonus_amount: txInfo.bonus
            };
        });

        return NextResponse.json({ success: true, orders: formattedOrders });
    } catch (error: any) {
        console.error('B2B 화환 주문 조회 API 오류:', error);
        return NextResponse.json({ error: '주문 내역을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}
