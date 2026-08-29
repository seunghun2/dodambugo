import { verifyAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

// 관리자 또는 해당 상조회사 본사 관리자 권한 검증 헬퍼
async function checkAuth(request: NextRequest, targetCompanyId: string | null): Promise<{ authorized: boolean; companyId?: string }> {
    const isAdmin = verifyAdmin(request);
    if (isAdmin) return { authorized: true };
    if (!targetCompanyId) return { authorized: false };

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
            
            if (user && user.company_id && user.company_id === targetCompanyId) {
                return { authorized: true, companyId: user.company_id };
            }
        } catch {
            return { authorized: false };
        }
    }
    return { authorized: false };
}

// GET: 특정 상조회사의 소속 지도사(팀원) 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json({ error: '상조회사 ID가 필요합니다.' }, { status: 400 });
        }

        const { authorized } = await checkAuth(request, companyId);
        if (!authorized) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        // 해당 상조회사 소속 파트너 계정들 조회
        const { data: users, error } = await supabase
            .from('b2b_users')
            .select('id, phone, owner_name, company_name, my_referral_code, created_at')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, users: users || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// POST: 상조회사 소속 장례지도사(팀원) 계정 신규 발급
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { companyId, companyName, ownerName, phone, password } = body;

        if (!companyId || !companyName || !ownerName || !phone) {
            return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
        }

        const { authorized } = await checkAuth(request, companyId);
        if (!authorized) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) {
            return NextResponse.json({ error: '올바른 휴대폰 번호를 입력해 주세요.' }, { status: 400 });
        }

        // 1. 휴대폰 번호 중복 확인
        const { data: existingUser } = await supabase
            .from('b2b_users')
            .select('id')
            .eq('phone', cleanPhone)
            .maybeSingle();

        if (existingUser) {
            return NextResponse.json({ error: '이미 가입된 휴대폰 번호입니다.' }, { status: 400 });
        }

        // 2. 비밀번호 bcrypt 해싱 (기본값: Aa123!)
        const targetPw = password && password.trim() ? password.trim() : 'Aa123!';
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(targetPw, salt);

        // 3. 고유 추천 코드 생성
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let my_referral_code = '';
        for (let i = 0; i < 6; i++) {
            my_referral_code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // 4. 소속 지도사 파트너 계정 생성
        const { data: newUser, error: insertError } = await supabase
            .from('b2b_users')
            .insert({
                phone: cleanPhone,
                password_hash: passwordHash,
                owner_name: ownerName.trim(),
                company_name: companyName.trim(),
                company_id: companyId,
                my_referral_code,
                status: 'approved' // 본사 발급 계정은 즉시 승인
            })
            .select()
            .single();

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: newUser });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// PUT: 소속 지도사 비밀번호 초기화 및 정보 변경
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, companyId, password } = body;

        if (!userId) {
            return NextResponse.json({ error: '유저 ID가 필요합니다.' }, { status: 400 });
        }

        const isAdmin = verifyAdmin(request);
        let targetCompanyId = companyId;

        if (!isAdmin) {
            // 유저가 실제 본사 소속인지 확인
            const { data: targetUser } = await supabase
                .from('b2b_users')
                .select('company_id')
                .eq('id', userId)
                .maybeSingle();

            if (!targetUser || !targetUser.company_id) {
                return NextResponse.json({ error: '해당 유저를 찾을 수 없습니다.' }, { status: 404 });
            }
            targetCompanyId = targetUser.company_id;

            const { authorized } = await checkAuth(request, targetCompanyId);
            if (!authorized) {
                return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
            }
        }

        const updateData: any = {};
        if (isAdmin && companyId !== undefined) {
            updateData.company_id = companyId;
        }

        if (password) {
            const salt = bcrypt.genSaltSync(10);
            updateData.password_hash = bcrypt.hashSync(password, salt);
        }

        const { data: updatedUser, error } = await supabase
            .from('b2b_users')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}
