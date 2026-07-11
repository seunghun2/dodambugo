import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 특정 상조회사의 월별 대금 정산 요약 목록 또는 특정 월의 상세 내역 조회
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');
        const yearMonth = searchParams.get('yearMonth'); // YYYY-MM 형식 (선택 사항)

        if (!companyId) {
            return NextResponse.json({ error: '상조회사 ID가 필요합니다.' }, { status: 400 });
        }

        if (yearMonth) {
            // 특정 월의 상세 화환 정산서 내역 조회
            const startOfMonth = `${yearMonth}-01T00:00:00.000Z`;
            const [year, month] = yearMonth.split('-').map(Number);
            const nextYear = month === 12 ? year + 1 : year;
            const nextMonth = month === 12 ? 1 : month + 1;
            const endOfMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`;

            const { data: settlements, error: settleError } = await supabase
                .from('b2b_company_settlements')
                .select('*')
                .eq('company_id', companyId)
                .gte('created_at', startOfMonth)
                .lt('created_at', endOfMonth)
                .order('created_at', { ascending: false });

            if (settleError) {
                return NextResponse.json({ error: settleError.message }, { status: 500 });
            }

            const orderIds = settlements.map(s => s.order_id).filter(Boolean);
            let orderMap = new Map<string, any>();

            if (orderIds.length > 0) {
                const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const validOrderIds = orderIds.filter(id => uuidPattern.test(id));

                if (validOrderIds.length > 0) {
                    const { data: orders, error: orderError } = await supabase
                        .from('flower_orders')
                        .select('id, order_number, product_name, product_price, sender_name, funeral_home, room, status, created_at')
                        .in('id', validOrderIds);

                    if (orderError) {
                        console.error('주문 정보 로드 실패:', orderError);
                    } else if (orders) {
                        orders.forEach(o => orderMap.set(o.id, o));
                    }
                }
            }

            const detailedList = settlements.map(s => ({
                id: s.id,
                order_id: s.order_id,
                amount: s.amount,
                status: s.status,
                payment_date: s.payment_date,
                created_at: s.created_at,
                order: orderMap.get(s.order_id) || null
            }));

            return NextResponse.json({
                success: true,
                settlements: detailedList
            });
        } else {
            // 전체 대금 정산 월별 요약 목록 조회
            const { data: settlements, error: settleError } = await supabase
                .from('b2b_company_settlements')
                .select('amount, status, created_at')
                .eq('company_id', companyId);

            if (settleError) {
                return NextResponse.json({ error: settleError.message }, { status: 500 });
            }

            // 월별로 그룹화 처리
            const monthlySummaryMap = new Map<string, { pending_amount: number; completed_amount: number; total_count: number }>();

            settlements.forEach(s => {
                const date = new Date(s.created_at);
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const key = `${yyyy}-${mm}`; // '2026-07' 형식

                if (!monthlySummaryMap.has(key)) {
                    monthlySummaryMap.set(key, { pending_amount: 0, completed_amount: 0, total_count: 0 });
                }

                const current = monthlySummaryMap.get(key)!;
                current.total_count += 1;
                if (s.status === 'pending') {
                    current.pending_amount += (s.amount || 0);
                } else if (s.status === 'completed') {
                    current.completed_amount += (s.amount || 0);
                }
            });

            // 객체 배열 형태로 변환 및 내림차순 정렬
            const monthlyList = Array.from(monthlySummaryMap.entries()).map(([month, data]) => ({
                month,
                ...data
            })).sort((a, b) => b.month.localeCompare(a.month));

            // 전체 정산 통계 도출
            let pendingTotal = 0;
            let completedTotal = 0;
            settlements.forEach(s => {
                if (s.status === 'pending') pendingTotal += (s.amount || 0);
                else if (s.status === 'completed') completedTotal += (s.amount || 0);
            });

            return NextResponse.json({
                success: true,
                summary: {
                    pending_amount: pendingTotal,
                    completed_amount: completedTotal,
                    total_count: settlements.length
                },
                monthlyList
            });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// PATCH: 특정 상조회사의 특정 월(yearMonth)에 발생한 대기 건을 대금 정산 완료 처리
export async function PATCH(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { companyId, yearMonth } = body;

        if (!companyId || !yearMonth) {
            return NextResponse.json({ error: '상조회사 ID 및 대상 정산월(yearMonth)이 필요합니다.' }, { status: 400 });
        }

        // 대상 월 범위 지정
        const startOfMonth = `${yearMonth}-01T00:00:00.000Z`;
        const [year, month] = yearMonth.split('-').map(Number);
        const nextYear = month === 12 ? year + 1 : year;
        const nextMonth = month === 12 ? 1 : month + 1;
        const endOfMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`;

        // 특정 년월 범위 내의 pending 상태 건만 completed로 업데이트
        const { data, error } = await supabase
            .from('b2b_company_settlements')
            .update({
                status: 'completed',
                payment_date: new Date().toISOString()
            })
            .eq('company_id', companyId)
            .eq('status', 'pending')
            .gte('created_at', startOfMonth)
            .lt('created_at', endOfMonth)
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
