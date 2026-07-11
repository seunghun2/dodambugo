import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 특정 상조회사의 정산 내역 목록 및 통계 요약 조회
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json({ error: '상조회사 ID가 필요합니다.' }, { status: 400 });
        }

        // 1. 해당 상조회사의 정산 내역 전체 조회
        const { data: settlements, error: settleError } = await supabase
            .from('b2b_company_settlements')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (settleError) {
            return NextResponse.json({ error: settleError.message }, { status: 500 });
        }

        // 2. 관련된 화환 주문들 상세 정보 한 번에 조회
        const orderIds = settlements.map(s => s.order_id).filter(Boolean);
        let orderMap = new Map<string, any>();

        if (orderIds.length > 0) {
            // order_id가 uuid 형식이 맞는지 검사하여 필터링 (캐스팅 에러 방어)
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const validOrderIds = orderIds.filter(id => uuidPattern.test(id));

            if (validOrderIds.length > 0) {
                const { data: orders, error: orderError } = await supabase
                    .from('flower_orders')
                    .select('id, order_number, product_name, product_price, sender_name, funeral_home, room, status, created_at')
                    .in('id', validOrderIds);

                if (orderError) {
                    console.error('B2B 정산 주문 정보 조회 오류:', orderError);
                } else if (orders) {
                    orders.forEach(o => orderMap.set(o.id, o));
                }
            }
        }

        // 3. 통계 계산 및 상세 리스트 바인딩
        let pendingTotal = 0;
        let completedTotal = 0;

        const detailedList = settlements.map(s => {
            const orderInfo = orderMap.get(s.order_id) || null;
            
            if (s.status === 'pending') {
                pendingTotal += (s.amount || 0);
            } else if (s.status === 'completed') {
                completedTotal += (s.amount || 0);
            }

            return {
                id: s.id,
                order_id: s.order_id,
                amount: s.amount,
                status: s.status,
                payment_date: s.payment_date,
                created_at: s.created_at,
                order: orderInfo
            };
        });

        return NextResponse.json({
            success: true,
            summary: {
                pending_amount: pendingTotal,
                completed_amount: completedTotal,
                total_count: settlements.length
            },
            settlements: detailedList
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// PATCH: 특정 상조회사의 미지급('pending') 정산 건을 일괄 송금 완료('completed')로 변경
export async function PATCH(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { companyId } = body;

        if (!companyId) {
            return NextResponse.json({ error: '상조회사 ID가 필요합니다.' }, { status: 400 });
        }

        // 해당 회사의 모든 pending 건을 completed로 업데이트
        const { data, error } = await supabase
            .from('b2b_company_settlements')
            .update({
                status: 'completed',
                payment_date: new Date().toISOString()
            })
            .eq('company_id', companyId)
            .eq('status', 'pending')
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            updated_count: data?.length || 0
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}
