import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendFlowerOrderNotification } from '@/lib/slack';
import { sendAlimtalk } from '@/lib/solapi';
import { verifyAdmin } from '@/lib/admin-auth';

// 알림톡 템플릿 ID
const ALIMTALK_TEMPLATES = {
    FLOWER_PAYMENT_COMPLETE: 'KA01TP2601311316586435pxsJOWuWbz',  // 화환 결제완료
    FLOWER_DELIVERY_COMPLETE: 'KA01TP260127010157157MBMxvZX3qUI', // 화환 배송완료
};

// 함수 내에서 supabase 클라이언트 생성 (빌드 타임 에러 방지)
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// GET: 주문 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const bugoId = searchParams.get('bugo_id');
        const limit = parseInt(searchParams.get('limit') || '500');

        // 고객 주문완료 화면(bugo_id 지정 + limit=1 단건 조회) 외 전체 목록 조회는 관리자 인증 필수
        const isCustomerSingleLookup = !!bugoId && limit === 1;
        if (!isCustomerSingleLookup && !verifyAdmin(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let resolvedBugoId: string | null = null;
        if (bugoId) {
            const isUUID = bugoId.includes('-') && bugoId.length > 10;
            if (isUUID) {
                resolvedBugoId = bugoId;
            } else {
                // 부고번호로 부고 조회하여 실제 UUID(id) 가져오기
                const { data: bugoData } = await supabase
                    .from('bugo')
                    .select('id')
                    .eq('bugo_number', bugoId)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                resolvedBugoId = bugoData?.id || '00000000-0000-0000-0000-000000000000';
            }
        }

        if (isCustomerSingleLookup && resolvedBugoId) {
            // 결제완료된 최신 주문을 우선 조회 (미결제 pending 제외)
            const { data: paidData, error: paidError } = await supabase
                .from('flower_orders')
                .select('*, bugo(id, deceased_name, bugo_number, b2b_user_id)')
                .eq('bugo_id', resolvedBugoId)
                .neq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1);

            if (paidError) {
                return NextResponse.json({ error: paidError.message }, { status: 500 });
            }
            if (paidData && paidData.length > 0) {
                return NextResponse.json({ orders: paidData, count: paidData.length });
            }

            // 가상계좌 채번 직후 등 pending만 있는 경우 최신 1건 폴백
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('flower_orders')
                .select('*, bugo(id, deceased_name, bugo_number, b2b_user_id)')
                .eq('bugo_id', resolvedBugoId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (fallbackError) {
                return NextResponse.json({ error: fallbackError.message }, { status: 500 });
            }
            return NextResponse.json({ orders: fallbackData || [], count: fallbackData?.length || 0 });
        }

        let query = supabase
            .from('flower_orders')
            .select('*, bugo(id, deceased_name, bugo_number, b2b_user_id)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) {
            query = query.eq('status', status);
        }
        if (resolvedBugoId) {
            query = query.eq('bugo_id', resolvedBugoId);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // B2C 전용 어드민: B2B 부고장 화환 및 B2B 직접 발주 건 제외 (SQL NOT IN 사용 시 NULL 증발 및 URL 길이 초과 방지)
        const filteredOrders = (data || []).filter((o: any) => {
            const bugoObj = Array.isArray(o.bugo) ? o.bugo[0] : o.bugo;
            if (o.source === 'b2b') return false;
            if (bugoObj?.b2b_user_id) return false;
            if (o.partner_data?.b2b_user_id) return false;
            return true;
        }).map((o: any) => ({
            ...o,
            bugo: Array.isArray(o.bugo) ? o.bugo[0] : o.bugo,
        }));

        return NextResponse.json({ orders: filteredOrders, count: filteredOrders.length });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: 새 주문 생성
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await request.json();

        // 주문번호 생성 (B2B는 BF 접두사로 PG 구분)
        const isB2B = body.source === 'b2b';
        const orderPrefix = isB2B ? 'BF' : 'MG';
        const orderNumber = `${orderPrefix}${Date.now()}`;

        const insertData: Record<string, any> = {
                bugo_id: body.bugo_id,
                product_id: body.product_id, // sort_order 값 (정수)
                product_name: body.product_name,
                product_price: body.product_price,
                sender_name: body.sender_name,
                sender_phone: body.sender_phone,
                recipient_name: body.recipient_name,
                funeral_home: body.funeral_home,
                room: body.room,
                address: body.address,
                ribbon_text1: body.ribbon_text1,
                ribbon_text2: body.ribbon_text2,
                payment_method: body.payment_method || 'card',
                status: 'pending',
                order_number: orderNumber,
            };

        // partner_data가 있을 때만 포함 (스키마 캐시 이슈 방지)
        if (body.partner_data) {
            insertData.partner_data = body.partner_data;
        }

        // B2B source 저장
        if (isB2B) {
            insertData.source = 'b2b';
        }

        let { data, error } = await supabase
            .from('flower_orders')
            .insert(insertData)
            .select()
            .single();

        // Supabase 클라우드 PostgREST 스키마 캐시 미갱신 시 자동 폴백 처리
        if (error && error.message?.includes('schema cache')) {
            delete insertData.source;
            const retry = await supabase
                .from('flower_orders')
                .insert(insertData)
                .select()
                .single();
            data = retry.data;
            error = retry.error;
            if (data?.id && isB2B) {
                await supabase.from('flower_orders').update({ source: 'b2b' }).eq('id', data.id);
            }
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 🔔 슬랙/알림톡은 결제 완료 후 approve API에서 발송

        return NextResponse.json({ order: data, order_number: orderNumber, id: data.id });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PATCH: 주문 상태 업데이트
export async function PATCH(request: NextRequest) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const supabase = getSupabase();
        const body = await request.json();
        const { id, status, partner_order_id, partner_data, product_name, product_price } = body;

        if (!id) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        const updateData: any = { updated_at: new Date().toISOString() };
        if (status) updateData.status = status;
        if (partner_order_id) updateData.partner_order_id = partner_order_id;
        if (partner_data) updateData.partner_data = partner_data;
        if (product_name) updateData.product_name = product_name;
        if (product_price !== undefined && product_price !== null) updateData.product_price = product_price;

        const { data, error } = await supabase
            .from('flower_orders')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error('주문 상태 업데이트 에러:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 📱 배송완료 알림톡 발송 (주문자에게) - 별도 API로 이동됨
        // delivery-notify API에서 처리


        return NextResponse.json({ order: data });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
