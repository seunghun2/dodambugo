import { verifyAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendLMS } from '@/lib/solapi';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: B2B 파트너 목록 조회 (부고장 건수, 누적 열람수, 누적 화환 판매건수 실시간 집계 추가)
export async function GET(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
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
            .select('*');

        if (status !== 'all') {
            query = query.eq('status', status);
        } else {
            // 기본 목록에서 탈퇴 회원 제외
            query = query.neq('status', 'withdrawn');
        }

        if (search) {
            query = query.or(`company_name.ilike.%${search}%,owner_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        // 최신 가입 순 정렬
        query = query.order('created_at', { ascending: false });

        const { data: partners, error } = await query;

        if (error) throw error;

        // 2. deposits 전체 조회하여 user_id -> balance 맵 생성
        const { data: deposits, error: depError } = await supabase
            .from('deposits')
            .select('user_id, balance');

        if (depError) {
            console.error('B2B 파트너 예치금 잔액 조회 오류:', depError);
        }

        const balanceMap = new Map<string, number>();
        if (deposits) {
            deposits.forEach((d: any) => {
                if (d.user_id) {
                    balanceMap.set(String(d.user_id), Number(d.balance || 0));
                }
            });
        }

        // 3. 모든 부고장(bugo) 목록 조회 (삭제되지 않은 건)
        const { data: bugos, error: bugoError } = await supabase
            .from('bugo')
            .select('id, b2b_user_id, view_count, created_at')
            .is('deleted_at', null)
            .not('b2b_user_id', 'is', null);

        if (bugoError) {
            console.error('B2B 파트너 부고 조회 중 오류:', bugoError);
        }

        const bugoCountMap = new Map<string, number>();
        const bugoViewMap = new Map<string, number>();
        const bugoToUserMap = new Map<string, string>(); // bugo_id -> b2b_user_id 매핑용
        const latestBugoMap = new Map<string, string>(); // b2b_user_id -> 최근부고일시

        if (bugos) {
            bugos.forEach((b: any) => {
                const userId = String(b.b2b_user_id);
                const bugoId = String(b.id);

                // 부고장 개수 누적
                bugoCountMap.set(userId, (bugoCountMap.get(userId) || 0) + 1);
                // 누적 조회수 합산
                bugoViewMap.set(userId, (bugoViewMap.get(userId) || 0) + (b.view_count || 0));
                
                // 매핑 정보 보관
                bugoToUserMap.set(bugoId, userId);

                // 최근 부고 개설일 갱신
                const date = b.created_at;
                const prevDate = latestBugoMap.get(userId);
                if (!prevDate || new Date(date) > new Date(prevDate)) {
                    latestBugoMap.set(userId, date);
                }
            });
        }

        // 4. 승인된 화환 주문(flower_orders) 조회
        const { data: flowerOrders, error: flowerError } = await supabase
            .from('flower_orders')
            .select('id, bugo_id')
            .in('status', ['paid', 'completed', 'approved']);

        if (flowerError) {
            console.error('B2B 파트너 화환 판매 내역 조회 오류:', flowerError);
        }

        const flowerSoldCountMap = new Map<string, number>();
        if (flowerOrders) {
            flowerOrders.forEach((o: any) => {
                if (o.bugo_id) {
                    const userId = bugoToUserMap.get(String(o.bugo_id));
                    if (userId) {
                        flowerSoldCountMap.set(userId, (flowerSoldCountMap.get(userId) || 0) + 1);
                    }
                }
            });
        }

        // 5. 상조회사 목록 조회하여 company_id -> 회사명 매핑
        const { data: b2bCompanies } = await supabase
            .from('b2b_companies')
            .select('id, name');
        const companyMap = new Map<string, string>();
        b2bCompanies?.forEach((c: any) => companyMap.set(c.id, c.name));

        // 결과 가공
        const formattedPartners = partners?.map(p => ({
            id: p.id,
            phone: p.phone,
            company_name: (p.company_id && companyMap.get(p.company_id)) || p.company_name || '개인',
            owner_name: p.owner_name,
            bank_name: p.bank_name,
            account_no: p.account_no,
            account_holder: p.account_holder,
            my_referral_code: p.my_referral_code,
            status: p.status,
            created_at: p.created_at,
            balance: balanceMap.get(String(p.id)) || 0,
            last_bugo_at: latestBugoMap.get(String(p.id)) || null,
            bugo_count: bugoCountMap.get(String(p.id)) || 0,
            total_views: bugoViewMap.get(String(p.id)) || 0,
            flower_sold_count: flowerSoldCountMap.get(String(p.id)) || 0,
            alarm_all: p.alarm_all,
            alarm_deposit: p.alarm_deposit,
            alarm_deceased: p.alarm_deceased,
            alarm_notice: p.alarm_notice,
            company_id: p.company_id,

            // 本인認証 (Identity Verification) & 자동입금 (Auto Payout) 토글 필드 연동
            identity_verified: p.identity_verified || false,
            verification_status: p.verification_status || (p.identity_verified ? 'verified' : 'unverified'),
            identity_name: p.identity_name || p.owner_name,
            rrn_front: p.rrn_front || '',
            rrn_back: p.rrn_back || '',
            identity_type: p.identity_type || '',
            id_issue_date: p.id_issue_date || '',
            identity_phone: p.identity_phone || p.phone,
            id_card_url: p.id_card_url || '',
            auto_payout_enabled: p.auto_payout_enabled ?? true
        }));

        // 신분증 이미지 서명 URL 일괄 생성 (비공개 버킷에서도 100% 렌더링)
        for (const partner of formattedPartners) {
            if (partner.id_card_url && !partner.id_card_url.startsWith('http')) {
                const storagePath = partner.id_card_url.replace(/^b2b-id-cards\//, '');
                const { data: signedData } = await supabase.storage
                    .from('b2b-id-cards')
                    .createSignedUrl(storagePath, 3600);
                if (signedData?.signedUrl) {
                    partner.id_card_url = signedData.signedUrl;
                }
            }
        }

        return NextResponse.json({ success: true, partners: formattedPartners || [] });
    } catch (error: any) {
        console.error('B2B 파트너 조회 API 오류:', error);
        return NextResponse.json({ error: '파트너 목록을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}

// PATCH: B2B 파트너 상태 변경 (승인/반려/차단)
export async function PATCH(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { partnerId, status, companyId, auto_payout_enabled } = body;

        if (!partnerId) {
            return NextResponse.json({ error: '파트너 ID가 필요합니다.' }, { status: 400 });
        }

        const updateData: any = {};
        if (status) {
            const validStatuses = ['approved', 'rejected', 'blocked', 'pending'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ error: '올바르지 않은 상태값입니다.' }, { status: 400 });
            }
            updateData.status = status;
        }

        if (companyId !== undefined) {
            updateData.company_id = companyId || null;
            if (companyId) {
                const { data: comp } = await supabase.from('b2b_companies').select('name').eq('id', companyId).single();
                if (comp?.name) {
                    updateData.company_name = comp.name;
                }
            } else {
                updateData.company_name = '개인';
            }
        }

        if (auto_payout_enabled !== undefined) {
            updateData.auto_payout_enabled = Boolean(auto_payout_enabled);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: '업데이트할 항목이 없습니다.' }, { status: 400 });
        }

        // 상태 및 소속 업데이트
        const { data, error } = await supabase
            .from('b2b_users')
            .update(updateData)
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

            // 인앱 알림함에 적재 (푸시 없이 알람만)
            Promise.resolve(supabase.from('b2b_notifications').insert({
                partner_id: data.id,
                title: '[부고온] 가입 승인 완료',
                body: `${data.company_name || data.owner_name}님, 파트너 가입이 승인되었습니다. 앱에 로그인하여 서비스를 시작하세요!`,
                type: 'signup_approved',
                data: { url: '/b2b/dashboard' },
            })).then(() => console.log('[알림함] 가입승인 알림 적재'))
              .catch(err => console.error('[알림함] 가입승인 적재 실패:', err));
        }

        return NextResponse.json({ success: true, partner: data });
    } catch (error: any) {
        console.error('B2B 파트너 상태 업데이트 API 오류:', error);
        return NextResponse.json({ error: '파트너 상태 변경에 실패했습니다.' }, { status: 500 });
    }
}

// POST: B2B 파트너 비밀번호 초기화 (기본값 '00000000')
export async function POST(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { partnerId } = body;

        if (!partnerId) {
            return NextResponse.json({ error: '파트너 ID가 필요합니다.' }, { status: 400 });
        }

        const defaultPassword = '00000000';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(defaultPassword, salt);

        const { error } = await supabase
            .from('b2b_users')
            .update({ password_hash: passwordHash })
            .eq('id', partnerId);

        if (error) throw error;

        console.log(`✅ B2B 파트너 비밀번호 초기화 성공: ID=${partnerId}`);
        return NextResponse.json({ success: true, message: '비밀번호가 00000000으로 초기화되었습니다.' });
    } catch (error: any) {
        console.error('B2B 파트너 비밀번호 초기화 API 오류:', error);
        return NextResponse.json({ error: '비밀번호 초기화에 실패했습니다.' }, { status: 500 });
    }
}
