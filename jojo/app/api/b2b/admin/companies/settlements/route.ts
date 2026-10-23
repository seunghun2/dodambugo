import { verifyAdmin } from '@/lib/admin-auth';
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
    const isAdmin = verifyAdmin(request);
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
                    .maybeSingle();
                
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
            .maybeSingle();

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

            // 부의금 & 답례품 쉐어 정산 내역 조인 (상조 소속 지도사의 부고장 결제건) 먼저 조회하여 ID 집합 확보
            let condolenceList: any[] = [];
            let giftList: any[] = [];
            const condOrderKeySet = new Set<string>();
            const giftOrderKeySet = new Set<string>();
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

                    const [
                        { data: condOrders },
                        { data: rawGiftOrders }
                    ] = await Promise.all([
                        supabase
                            .from('condolence_orders')
                            .select('*')
                            .in('bugo_number', allBugoKeys)
                            .gte('created_at', startOfMonth)
                            .lt('created_at', endOfMonth)
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('gift_orders')
                            .select('*')
                            .neq('status', 'pending')
                            .gte('created_at', startOfMonth)
                            .lt('created_at', endOfMonth)
                            .order('created_at', { ascending: false })
                    ]);

                    if (condOrders) {
                        condOrders.forEach(c => {
                            if (c.id) condOrderKeySet.add(String(c.id));
                            if (c.moid) condOrderKeySet.add(String(c.moid));
                            if (c.order_number) condOrderKeySet.add(String(c.order_number));
                        });

                        const companyRate = companyData?.condolence_company_rate ?? 3.3;

                        // 부의금 정산 레코드의 마감 상태를 b2b_company_settlements에서 조회
                        const condSettlementRecords = settlements.filter(s =>
                            s.order_id?.startsWith('BCOND_') ||
                            s.order_id?.startsWith('COND_') ||
                            s.order_id?.startsWith('DO') ||
                            condOrderKeySet.has(String(s.order_id))
                        );
                        const condSettleMap = new Map<string, string>();
                        condSettlementRecords.forEach(s => condSettleMap.set(String(s.order_id), s.status));

                        condolenceList = condOrders.map(c => {
                            const matchedBugo = compBugos.find(b => String(b.id) === String(c.bugo_number) || String(b.bugo_number) === String(c.bugo_number));
                            const matchedUser = compUsers.find(u => u.id === matchedBugo?.b2b_user_id);
                            const shareAmount = Math.round((c.amount || 0) * (companyRate / 100));
                            const isCancelled = c.status === 'cancelled';

                            // 정산 마감 상태: b2b_company_settlements 기준 (completed → 정산완료)
                            const condOrderNumber = c.moid?.startsWith('BCOND_') ? c.moid : `BCOND_${c.id}`;
                            const settlementStatus =
                                condSettleMap.get(String(c.id)) ||
                                condSettleMap.get(condOrderNumber) ||
                                condSettleMap.get(c.order_number) ||
                                condSettleMap.get(c.moid) ||
                                'pending';

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
                                partner_company: matchedUser?.company_name || '미등록',
                                deceased_name: matchedBugo?.deceased_name || '미등록',
                                status: isCancelled ? 'cancelled' : settlementStatus,
                                settlement_status: isCancelled ? 'cancelled' : settlementStatus,
                                created_at: c.created_at,
                                bugo_id: matchedBugo?.bugo_number || c.bugo_number
                            };
                        });
                    }

                    // 답례품 정산 내역 매핑 (상조 소속 부고장 결제 건)
                    if (rawGiftOrders) {
                        const matchedGiftOrders = rawGiftOrders.filter(g =>
                            compBugos.some(b =>
                                (g.bugo_id && String(b.id) === String(g.bugo_id)) ||
                                (g.bugo_number && String(b.bugo_number) === String(g.bugo_number))
                            )
                        );

                        matchedGiftOrders.forEach(g => {
                            if (g.id) {
                                giftOrderKeySet.add(String(g.id));
                                giftOrderKeySet.add(`GIFT_${g.id}`);
                            }
                            if (g.order_number) giftOrderKeySet.add(String(g.order_number));
                        });

                        const giftRate = companyData?.gift_company_rate ?? 4.0;
                        const giftSettlementRecords = settlements.filter(s =>
                            s.order_id?.startsWith('GIFT_') ||
                            s.order_id?.startsWith('GF') ||
                            giftOrderKeySet.has(String(s.order_id))
                        );
                        const giftSettleMap = new Map<string, { status: string; payment_date: string | null }>();
                        giftSettlementRecords.forEach(s =>
                            giftSettleMap.set(String(s.order_id), { status: s.status, payment_date: s.payment_date || null })
                        );

                        giftList = matchedGiftOrders.map(g => {
                            const matchedBugo = compBugos.find(b =>
                                (g.bugo_id && String(b.id) === String(g.bugo_id)) ||
                                (g.bugo_number && String(b.bugo_number) === String(g.bugo_number))
                            );
                            const matchedUser = compUsers.find(u => u.id === matchedBugo?.b2b_user_id);
                            const shareAmount = Math.round((g.total_amount || 0) * (giftRate / 100));
                            const isCancelled = g.status === 'cancelled';

                            const settleInfo =
                                giftSettleMap.get(String(g.id)) ||
                                giftSettleMap.get(`GIFT_${g.id}`) ||
                                (g.order_number ? giftSettleMap.get(String(g.order_number)) : undefined);
                            const settlementStatus = settleInfo?.status || 'pending';

                            return {
                                id: g.id,
                                order_number: g.order_number || `GF_${String(g.id).slice(0, 8)}`,
                                buyer_name: g.buyer_name || '-',
                                product_name: g.product_name || '-',
                                quantity: g.quantity || 1,
                                amount: g.total_amount || 0,
                                company_rate: giftRate,
                                share_amount: isCancelled ? 0 : shareAmount,
                                partner_name: matchedUser?.owner_name || '미등록',
                                partner_company: matchedUser?.company_name || '미등록',
                                deceased_name: matchedBugo?.deceased_name || '미등록',
                                status: isCancelled ? 'cancelled' : settlementStatus,
                                settlement_status: isCancelled ? 'cancelled' : settlementStatus,
                                payment_date: settleInfo?.payment_date || null,
                                created_at: g.created_at,
                                bugo_id: matchedBugo?.bugo_number || g.bugo_number
                            };
                        });
                    }
                }
            }

            // 화환 정산만 필터 (부의금 & 답례품 정산 레코드 제외)
            const wreathSettlements = settlements.filter(s =>
                !s.order_id?.startsWith('BCOND_') &&
                !s.order_id?.startsWith('COND_') &&
                !s.order_id?.startsWith('DO') &&
                !s.order_id?.startsWith('GIFT_') &&
                !s.order_id?.startsWith('GF') &&
                !condOrderKeySet.has(String(s.order_id)) &&
                !giftOrderKeySet.has(String(s.order_id))
            );

            const detailedList = wreathSettlements.map(s => {
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

            return NextResponse.json({
                success: true,
                company: companyData || null,
                settlements: detailedList,
                condolenceSettlements: condolenceList,
                giftSettlements: giftList
            });
        } else {
            // 전체 대금 정산 월별 요약 목록 조회
            const { data: settlements, error: settleError } = await supabase
                .from('b2b_company_settlements')
                .select('order_id, amount, status, created_at')
                .eq('company_id', companyId);

            if (settleError) {
                return NextResponse.json({ error: settleError.message }, { status: 500 });
            }

            // 월별로 그룹화 처리
            const monthlySummaryMap = new Map<string, { pending_amount: number; completed_amount: number; total_count: number }>();
            const existingOrderIds = new Set<string>();

            settlements.forEach(s => {
                if (s.order_id) existingOrderIds.add(String(s.order_id));
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

            // b2b_company_settlements에 아직 적재되지 않은 답례품 결제/발송 건도 월별 요약에 반영
            let extraPendingGiftAmount = 0;
            let extraGiftCount = 0;
            const { data: compUsers } = await supabase
                .from('b2b_users')
                .select('id')
                .eq('company_id', companyId);

            if (compUsers && compUsers.length > 0) {
                const userIds = compUsers.map(u => u.id);
                const { data: compBugos } = await supabase
                    .from('bugo')
                    .select('id, bugo_number')
                    .in('b2b_user_id', userIds);

                if (compBugos && compBugos.length > 0) {
                    const { data: rawGiftOrders } = await supabase
                        .from('gift_orders')
                        .select('id, order_number, bugo_id, bugo_number, total_amount, status, created_at')
                        .in('status', ['paid', 'sent', 'partial']);

                    const giftRate = companyData?.gift_company_rate ?? 4.0;
                    (rawGiftOrders || []).forEach(g => {
                        const matched = compBugos.some(b =>
                            (g.bugo_id && String(b.id) === String(g.bugo_id)) ||
                            (g.bugo_number && String(b.bugo_number) === String(g.bugo_number))
                        );
                        if (!matched) return;

                        const alreadyInSettlements =
                            existingOrderIds.has(String(g.id)) ||
                            existingOrderIds.has(`GIFT_${g.id}`) ||
                            (g.order_number && existingOrderIds.has(String(g.order_number)));
                        if (alreadyInSettlements) return;

                        const shareAmount = Math.round((g.total_amount || 0) * (giftRate / 100));
                        const date = new Date(g.created_at);
                        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        if (!monthlySummaryMap.has(key)) {
                            monthlySummaryMap.set(key, { pending_amount: 0, completed_amount: 0, total_count: 0 });
                        }
                        const current = monthlySummaryMap.get(key)!;
                        current.total_count += 1;
                        current.pending_amount += shareAmount;
                        extraPendingGiftAmount += shareAmount;
                        extraGiftCount += 1;
                    });
                }
            }

            // 객체 배열 형태로 변환 및 내림차순 정렬
            let monthlyList = Array.from(monthlySummaryMap.entries()).map(([month, data]) => ({
                month,
                ...data
            })).sort((a, b) => b.month.localeCompare(a.month));

            // 정산 내역이 0건이더라도 당월 기본 장부 엔트리를 항상 제공하여 정산서 서식이 즉시 표시되도록 보장
            if (monthlyList.length === 0) {
                const now = new Date();
                const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                monthlyList = [{
                    month: curMonth,
                    pending_amount: 0,
                    completed_amount: 0,
                    total_count: 0
                }];
            }

            // 전체 정산 통계 도출
            let pendingTotal = extraPendingGiftAmount;
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
                    total_count: settlements.length + extraGiftCount
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
    const isAdmin = verifyAdmin(request);
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
        const nowIso = new Date().toISOString();

        // 특정 년월 범위 내의 pending 상태 건만 completed로 업데이트
        const { data, error } = await supabase
            .from('b2b_company_settlements')
            .update({
                status: 'completed',
                payment_date: nowIso
            })
            .eq('company_id', companyId)
            .eq('status', 'pending')
            .gte('created_at', startOfMonth)
            .lt('created_at', endOfMonth)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 답례품 주문 중 b2b_company_settlements에 아직 적재되지 않은 건도 함께 completed 적재
        let insertedGiftCount = 0;
        const [{ data: rawCompany }, { data: compUsers }, { data: existingMonthSettles }] = await Promise.all([
            supabase.from('b2b_companies').select('*').eq('id', companyId).maybeSingle(),
            supabase.from('b2b_users').select('id').eq('company_id', companyId),
            supabase
                .from('b2b_company_settlements')
                .select('order_id')
                .eq('company_id', companyId)
                .gte('created_at', startOfMonth)
                .lt('created_at', endOfMonth)
        ]);

        if (compUsers && compUsers.length > 0) {
            const companyData = rawCompany ? normalizeCompanyData(rawCompany) : null;
            const giftRate = companyData?.gift_company_rate ?? 4.0;
            const existingOrderIds = new Set((existingMonthSettles || []).map(s => String(s.order_id)));
            const userIds = compUsers.map(u => u.id);
            const { data: compBugos } = await supabase
                .from('bugo')
                .select('id, bugo_number')
                .in('b2b_user_id', userIds);

            if (compBugos && compBugos.length > 0) {
                const { data: rawGiftOrders } = await supabase
                    .from('gift_orders')
                    .select('id, order_number, bugo_id, bugo_number, total_amount, status, created_at')
                    .in('status', ['paid', 'sent', 'partial'])
                    .gte('created_at', startOfMonth)
                    .lt('created_at', endOfMonth);

                const toInsert = (rawGiftOrders || [])
                    .filter(g => {
                        const matched = compBugos.some(b =>
                            (g.bugo_id && String(b.id) === String(g.bugo_id)) ||
                            (g.bugo_number && String(b.bugo_number) === String(g.bugo_number))
                        );
                        if (!matched) return false;
                        return !(
                            existingOrderIds.has(String(g.id)) ||
                            existingOrderIds.has(`GIFT_${g.id}`) ||
                            (g.order_number && existingOrderIds.has(String(g.order_number)))
                        );
                    })
                    .map(g => ({
                        company_id: companyId,
                        order_id: g.order_number || `GIFT_${g.id}`,
                        amount: Math.round((g.total_amount || 0) * (giftRate / 100)),
                        status: 'completed',
                        payment_date: nowIso,
                        created_at: g.created_at
                    }));

                if (toInsert.length > 0) {
                    const { data: inserted } = await supabase
                        .from('b2b_company_settlements')
                        .insert(toInsert)
                        .select();
                    insertedGiftCount = inserted?.length || 0;
                }
            }
        }

        return NextResponse.json({
            success: true,
            updated_count: (data?.length || 0) + insertedGiftCount
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}
