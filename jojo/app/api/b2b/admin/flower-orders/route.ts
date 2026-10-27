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
        // 1. 결제 완료 이상 상태인 화환 주문 조회 (부고 연결건 및 B2B 직접 발주건 모두 포함)
        const query = supabase
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
                source,
                partner_data,
                bugo (
                    id,
                    bugo_number,
                    deceased_name,
                    mourners,
                    b2b_user_id,
                    b2b_users ( company_name, owner_name, company_id )
                )
            `)
            .neq('status', 'pending')
            .order('created_at', { ascending: false });

        // 1~2. 화환 주문, 상조회사 목록, B2B 파트너 목록 병렬 조회
        const [
            { data: rawOrdersData, error: ordersError },
            { data: b2bCompanies, error: compError },
            { data: b2bUsersList }
        ] = await Promise.all([
            query,
            supabase.from('b2b_companies').select('id, name'),
            supabase.from('b2b_users').select('id, company_name, owner_name, company_id')
        ]);

        if (ordersError) throw ordersError;
        if (compError) console.error('상조회사 조회 오류:', compError);

        const companyMap = new Map<string, string>();
        b2bCompanies?.forEach((c: any) => companyMap.set(c.id, c.name));

        const b2bUserMap = new Map<string, any>();
        b2bUsersList?.forEach((u: any) => b2bUserMap.set(u.id, u));

        // B2B 주문만 필터링 (부고 b2b_user_id 존재 또는 source='b2b' 또는 partner_data.b2b_user_id 존재)
        const ordersData = (rawOrdersData || []).filter((o: any) => {
            const bugo = Array.isArray(o.bugo) ? o.bugo[0] : o.bugo;
            return !!(bugo?.b2b_user_id || o.source === 'b2b' || o.partner_data?.b2b_user_id);
        });

        if (ordersData.length === 0) {
            return NextResponse.json({ success: true, orders: [] });
        }

        const orderIds = ordersData.map(o => o.id);
        const orderNumbers = ordersData.map(o => o.order_number).filter(Boolean);
        const lookupKeys = Array.from(new Set([...orderIds, ...orderNumbers]));

        // 3. 해당 주문들에 매칭된 예치금 거래 내역(수당 적립액 확인용) 조회
        const { data: txData, error: txError } = await supabase
            .from('deposit_transactions')
            .select('related_order_id, amount, type')
            .in('related_order_id', lookupKeys);

        if (txError) throw txError;

        // 4. 거래 내역을 주문 ID 및 주문번호 기준으로 매핑 (wreath_reward 및 referral_bonus)
        const txMap: Record<string, { reward: number; bonus: number }> = {};
        lookupKeys.forEach(k => {
            txMap[k] = { reward: 0, bonus: 0 };
        });

        txData?.forEach(tx => {
            const key = tx.related_order_id;
            if (key && txMap[key]) {
                if (tx.type === 'wreath_reward' || tx.type === 'flower_reward') {
                    txMap[key].reward = tx.amount;
                } else if (tx.type === 'referral_bonus') {
                    txMap[key].bonus = tx.amount;
                }
            }
        });

        // 5. 최종 결과 가공
        let formattedOrders = ordersData.map((o: any) => {
            const price = Number(o.product_price) || 0;
            const txById = txMap[o.id] || { reward: 0, bonus: 0 };
            const txByNum = (o.order_number && txMap[o.order_number]) || { reward: 0, bonus: 0 };
            const rewardAmount = txById.reward || txByNum.reward || 0;
            const bonusAmount = txById.bonus || txByNum.bonus || 0;

            const bugo = Array.isArray(o.bugo) ? o.bugo[0] : o.bugo;
            const fallbackPartnerId = o.partner_data?.b2b_user_id;
            const b2bUser = bugo
                ? (Array.isArray(bugo.b2b_users) ? bugo.b2b_users[0] : bugo.b2b_users)
                : (fallbackPartnerId ? b2bUserMap.get(fallbackPartnerId) : null);
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
                bugo_number: bugo?.bugo_number || '',
                deceased_name: bugo?.deceased_name || (o.source === 'b2b' ? '직접발주' : '알 수 없음'),
                company_name: displayCompanyName,
                owner_name: b2bUser?.owner_name || '알 수 없음',
                reward_amount: rewardAmount,
                bonus_amount: bonusAmount
            };
        });

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            formattedOrders = formattedOrders.filter(o =>
                o.product_name?.toLowerCase().includes(q) ||
                o.company_name?.toLowerCase().includes(q) ||
                o.owner_name?.toLowerCase().includes(q) ||
                o.funeral_home?.toLowerCase().includes(q) ||
                o.recipient_name?.toLowerCase().includes(q) ||
                o.deceased_name?.toLowerCase().includes(q) ||
                o.sender_name?.toLowerCase().includes(q) ||
                o.order_number?.toLowerCase().includes(q)
            );
        }

        return NextResponse.json({ success: true, orders: formattedOrders });
    } catch (error: any) {
        console.error('B2B 화환 주문 조회 API 오류:', error);
        return NextResponse.json({ error: '주문 내역을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}
