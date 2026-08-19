import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeCompanyData } from '@/lib/b2b-company';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

// GET: 특정 상조회사의 월별 대금 정산 요약 목록 또는 특정 월의 상세 내역 조회 (지도사명, 고인명, 부고ID 조인 추가)
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    let isCompanyUser = false;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const yearMonth = searchParams.get('yearMonth'); // YYYY-MM 형식 (선택 사항)

    if (!isAdmin && companyId) {
        const auth = request.headers.get('Authorization');
        let token: string | undefined;
        if (auth?.startsWith('Bearer ')) {
            token = auth.slice(7);
        } else {
            token = request.cookies.get('b2b_token')?.value;
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as any;
                const { data: user } = await supabase
                    .from('b2b_users')
                    .select('company_id')
                    .eq('id', decoded.userId)
                    .single();
                
                if (user && user.company_id && user.company_id === companyId) {
                    isCompanyUser = true;
                }
            } catch {
                // 패스
            }
        }
    }

    if (!isAdmin && !isCompanyUser) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        if (!companyId) {
            return NextResponse.json({ error: '상조회사 ID가 필요합니다.' }, { status: 400 });
        }

        // 상조회사 기본 정보 단독 조회 (사업자번호 확보용 + 대표, 주소, 업태, 종목 추가)
        const { data: rawCompany } = await supabase
            .from('b2b_companies')
            .select('*')
            .eq('id', companyId)
            .single();

        const companyData = rawCompany ? normalizeCompanyData(rawCompany) : null;

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
            
            // 맵 및 캐시 셋업
            let orderMap = new Map<string, any>();
            let bugoMap = new Map<string, any>();
            let partnerMap = new Map<string, any>();

            if (orderIds.length > 0) {
                const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const validOrderIds = orderIds.filter(id => uuidPattern.test(id));

                if (validOrderIds.length > 0) {
                    // 1. 화환 주문들 조회 (bugo_id 포함)
                    const { data: orders } = await supabase
                        .from('flower_orders')
                        .select('id, order_number, product_name, sender_name, bugo_id')
                        .in('id', validOrderIds);

                    if (orders) {
                        orders.forEach(o => orderMap.set(o.id, o));
                        
                        // 2. 부고 정보 조회 (deceased_name, b2b_user_id 포함)
                        const bugoIds = orders.map(o => o.bugo_id).filter(Boolean);
                        if (bugoIds.length > 0) {
                            const { data: bugos } = await supabase
                                .from('bugo')
                                .select('id, deceased_name, b2b_user_id')
                                .in('id', bugoIds);

                            if (bugos) {
                                bugos.forEach(b => bugoMap.set(b.id, b));
                                
                                // 3. 장례지도사명(b2b_users.owner_name) 조회
                                const b2bUserIds = bugos.map(b => b.b2b_user_id).filter(Boolean);
                                if (b2bUserIds.length > 0) {
                                    const { data: b2bUsers } = await supabase
                                        .from('b2b_users')
                                        .select('id, owner_name, company_name')
                                        .in('id', b2bUserIds);
                                    
                                    if (b2bUsers) {
                                        b2bUsers.forEach(u => partnerMap.set(u.id, u));
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const detailedList = settlements.map(s => {
                const orderInfo = orderMap.get(s.order_id) || null;
                const bugoInfo = orderInfo ? bugoMap.get(orderInfo.bugo_id) : null;
                const partnerInfo = bugoInfo ? partnerMap.get(bugoInfo.b2b_user_id) : null;
                const isCancelled = s.status === 'cancelled';

                return {
                    id: s.id,
                    order_id: s.order_id,
                    amount: isCancelled ? 0 : s.amount,
                    status: s.status,
                    payment_date: s.payment_date,
                    created_at: s.created_at,
                    updated_at: s.updated_at,
                    order: orderInfo ? {
                        ...orderInfo,
                        deceased_name: bugoInfo?.deceased_name || '미등록',
                        partner_name: partnerInfo?.owner_name || '미등록',
                        partner_company: partnerInfo?.company_name || '미등록',
                        bugo_id: orderInfo.bugo_id
                    } : null
                };
            });

            // 부의금 쉐어 정산 내역 조인 (상조 소속 지도사의 부고장 결제건)
            let condolenceList: any[] = [];
            const { data: compUsers } = await supabase
                .from('b2b_users')
                .select('id, owner_name, company_name')
                .eq('company_id', companyId);

            if (compUsers && compUsers.length > 0) {
                const userIds = compUsers.map(u => u.id);
                const { data: compBugos } = await supabase
                    .from('bugo')
                    .select('id, bugo_number, deceased_name, b2b_user_id')
                    .in('b2b_user_id', userIds);

                if (compBugos && compBugos.length > 0) {
                    const bugoIds = compBugos.map(b => String(b.id));
                    const bugoNums = compBugos.map(b => String(b.bugo_number)).filter(Boolean);
                    const allBugoKeys = Array.from(new Set([...bugoIds, ...bugoNums]));

                    const { data: condOrders } = await supabase
                        .from('condolence_orders')
                        .select('*')
                        .in('bugo_number', allBugoKeys)
                        .gte('created_at', startOfMonth)
                        .lt('created_at', endOfMonth)
                        .order('created_at', { ascending: false });

                    if (condOrders) {
                        const companyRate = companyData?.condolence_company_rate ?? 3.6;
                        condolenceList = condOrders.map(c => {
                            const matchedBugo = compBugos.find(b => String(b.id) === String(c.bugo_number) || String(b.bugo_number) === String(c.bugo_number));
                            const matchedUser = compUsers.find(u => u.id === matchedBugo?.b2b_user_id);
                            const shareAmount = Math.round((c.amount || 0) * (companyRate / 100));
                            const isCancelled = c.status === 'cancelled';

                            return {
                                id: c.id,
                                order_number: c.moid?.startsWith('BCOND_') ? `DO${String(c.id).padStart(6, '0')}` : c.order_number || `DO${String(c.id).padStart(6, '0')}`,
                                buyer_name: c.buyer_name,
                                recipient_name: c.recipient_name,
                                amount: c.amount,
                                fee: c.fee,
                                company_rate: companyRate,
                                share_amount: isCancelled ? 0 : shareAmount,
                                partner_name: matchedUser?.owner_name || '미등록',
                                deceased_name: matchedBugo?.deceased_name || '미등록',
                                status: c.status,
                                created_at: c.created_at
                            };
                        });
                    }
                }
            }

            return NextResponse.json({
                success: true,
                company: companyData || null,
                settlements: detailedList,
                condolenceSettlements: condolenceList
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
                company: companyData || null,
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
