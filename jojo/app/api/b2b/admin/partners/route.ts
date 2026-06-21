import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendLMS } from '@/lib/solapi';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: B2B 파트너 목록 조회
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    try {
        // 1. b2b_users 조회
        let query = supabase
            .from('b2b_users')
            .select(`
                *,
                deposits ( balance )
            `);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`company_name.ilike.%${search}%,owner_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        // 최신 가입 순 정렬
        query = query.order('created_at', { ascending: false });

        const { data: partners, error } = await query;

        if (error) throw error;

        // 결과 가공 (deposits.balance 조인 데이터 매핑)
        const formattedPartners = partners?.map(p => ({
            id: p.id,
            phone: p.phone,
            company_name: p.company_name,
            owner_name: p.owner_name,
            bank_name: p.bank_name,
            account_no: p.account_no,
            account_holder: p.account_holder,
            my_referral_code: p.my_referral_code,
            status: p.status,
            created_at: p.created_at,
            balance: p.deposits?.[0]?.balance || 0
        })) || [];

        return NextResponse.json({ success: true, partners: formattedPartners });
    } catch (error: any) {
        console.error('B2B 파트너 조회 API 오류:', error);
        return NextResponse.json({ error: '파트너 목록을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}

// PATCH: B2B 파트너 상태 변경 (승인/반려/차단)
export async function PATCH(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { partnerId, status } = body;

        if (!partnerId || !status) {
            return NextResponse.json({ error: '필수 정보를 입력해주세요.' }, { status: 400 });
        }

        const validStatuses = ['approved', 'rejected', 'blocked', 'pending'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: '올바르지 않은 상태값입니다.' }, { status: 400 });
        }

        // 상태 업데이트
        const { data, error } = await supabase
            .from('b2b_users')
            .update({ status })
            .eq('id', partnerId)
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ B2B 파트너 상태 업데이트: ID=${partnerId}, Status=${status}`);

        // 가입 승인인 경우 LMS 문자 알림 발송
        if (status === 'approved') {
            try {
                const partnerPhone = data.phone.replace(/-/g, '');
                const msg = `[부고온] 파트너 가입 승인 완료 안내

안녕하세요, ${data.company_name} ${data.owner_name} 파트너님.
부고온 파트너 가입 승인이 완료되었습니다.

이제 파트너 앱에 로그인하여 모바일 부고장 개설 및 수당 적립 혜택을 이용하실 수 있습니다.

■ 파트너 로그인: https://bugoon.co.kr/b2b/login
■ 추천 코드: ${data.my_referral_code}

이용해주셔서 감사합니다.`;
                
                await sendLMS(partnerPhone, '[부고온] 파트너 승인 완료', msg);
                console.log(`📱 [B2B] 파트너 승인 안내 문자 발송 완료: ${partnerPhone}`);
            } catch (smsErr) {
                console.error('❌ [B2B] 파트너 승인 안내 문자 발송 오류:', smsErr);
            }
        }

        return NextResponse.json({ success: true, partner: data });
    } catch (error: any) {
        console.error('B2B 파트너 상태 업데이트 API 오류:', error);
        return NextResponse.json({ error: '파트너 상태 변경에 실패했습니다.' }, { status: 500 });
    }
}
