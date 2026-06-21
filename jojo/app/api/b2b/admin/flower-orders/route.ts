import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: B2B 연계 결제완료된 화환 주문 및 수당 정보 조회
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    try {
        // 1. B2B 파트너와 연계된 완료(completed) 상태인 화환 주문만 inner join 조회
        let query = supabase
            .from('flower_orders')
            .select(`
                id,
                order_number,
                product_name,
                amt,
                tax_free_amt,
                payment_method,
                status,
                created_at,
                recipient_name,
                funeral_home,
                room,
                bugo!inner (
                    id,
                    deceased_name,
                    b2b_user_id,
                    b2b_users ( company_name, owner_name )
                )
            `)
            .eq('status', 'completed');

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

        // 2. 해당 주문들에 매칭된 예치금 거래 내역(수당 적립액 확인용) 조회
        const { data: txData, error: txError } = await supabase
            .from('deposit_transactions')
            .select('related_order_id, amount, type')
            .in('related_order_id', orderIds);

        if (txError) throw txError;

        // 3. 거래 내역을 주문 ID 기준으로 매핑 (wreath_reward 및 referral_bonus)
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

        // 4. 최종 결과 가공
        const formattedOrders = ordersData.map(o => {
            const price = (Number(o.amt) || 0) + (Number(o.tax_free_amt) || 0);
            const txInfo = txMap[o.id] || { reward: 0, bonus: 0 };

            const bugo = Array.isArray(o.bugo) ? o.bugo[0] : o.bugo;
            const b2bUser = bugo ? (Array.isArray(bugo.b2b_users) ? bugo.b2b_users[0] : bugo.b2b_users) : null;

            return {
                id: o.id,
                order_number: o.order_number,
                product_name: o.product_name,
                price,
                payment_method: o.payment_method || 'CARD',
                created_at: o.created_at,
                recipient_name: o.recipient_name,
                funeral_home: o.funeral_home,
                room: o.room,
                deceased_name: bugo?.deceased_name || '알 수 없음',
                company_name: b2bUser?.company_name || '알 수 없음',
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
