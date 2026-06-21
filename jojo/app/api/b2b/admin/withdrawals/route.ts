import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 출금 신청 목록 조회
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    try {
        let query = supabase
            .from('withdrawal_requests')
            .select(`
                *,
                b2b_users ( company_name, owner_name, phone )
            `);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        // 최신 신청일 순 정렬
        query = query.order('created_at', { ascending: false });

        const { data: requests, error } = await query;

        if (error) throw error;

        // 결과 가공
        const formattedRequests = requests?.map(r => ({
            id: r.id,
            user_id: r.user_id,
            amount: r.amount,
            bank_name: r.bank_name,
            account_no: r.account_no,
            account_holder: r.account_holder,
            status: r.status,
            created_at: r.created_at,
            processed_at: r.processed_at,
            company_name: r.b2b_users?.company_name || '알 수 없음',
            owner_name: r.b2b_users?.owner_name || '알 수 없음',
            phone: r.b2b_users?.phone || ''
        })) || [];

        return NextResponse.json({ success: true, requests: formattedRequests });
    } catch (error: any) {
        console.error('B2B 출금 신청 목록 조회 오류:', error);
        return NextResponse.json({ error: '출금 신청 목록을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}

// POST: 출금 신청 승인 또는 반려 처리 (RPC 연동)
export async function POST(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { requestId, action } = body;

        if (!requestId || !action) {
            return NextResponse.json({ error: '필수 정보를 입력해주세요.' }, { status: 400 });
        }

        if (action === 'approve') {
            // 출금 승인 RPC 호출
            const { data, error } = await supabase.rpc('approve_withdrawal_request', {
                p_request_id: requestId
            });

            if (error) {
                console.error('출금 승인 RPC 오류:', error);
                return NextResponse.json({ error: error.message || '출금 승인 처리에 실패했습니다.' }, { status: 500 });
            }

            console.log(`✅ B2B 출금 승인 완료: RequestID=${requestId}`);
            return NextResponse.json({ success: true, message: '출금이 정상적으로 승인 처리되었습니다.' });
        } else if (action === 'reject') {
            // 출금 반려 RPC 호출
            const { data, error } = await supabase.rpc('reject_withdrawal_request', {
                p_request_id: requestId
            });

            if (error) {
                console.error('출금 반려 RPC 오류:', error);
                return NextResponse.json({ error: error.message || '출금 반려 처리에 실패했습니다.' }, { status: 500 });
            }

            console.log(`❌ B2B 출금 반려 및 예치금 환원 완료: RequestID=${requestId}`);
            return NextResponse.json({ success: true, message: '출금 신청이 반려되었으며 예치금이 안전하게 환원되었습니다.' });
        } else {
            return NextResponse.json({ error: '올바르지 않은 액션입니다.' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('B2B 출금 처리 API 오류:', error);
        return NextResponse.json({ error: '출금 처리에 실패했습니다.' }, { status: 500 });
    }
}
