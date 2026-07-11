import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 특정 상조회사의 본사 계정(담당자) 목록 조회
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

        // 해당 상조회사 소속 파트너 계정들 조회
        const { data: users, error } = await supabase
            .from('b2b_users')
            .select('id, phone, owner_name, company_name, created_at')
            .eq('company_id', companyId)
            .order('owner_name', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, users });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// POST: 상조회사 본사 전용 계정 신규 발급
export async function POST(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { companyId, companyName, ownerName, phone, password } = body;

        if (!companyId || !companyName || !ownerName || !phone || !password) {
            return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // 1. 휴대폰 번호 중복 확인
        const { data: existingUser } = await supabase
            .from('b2b_users')
            .select('id')
            .eq('phone', cleanPhone)
            .maybeSingle();

        if (existingUser) {
            return NextResponse.json({ error: '이미 가입된 휴대폰 번호입니다.' }, { status: 400 });
        }

        // 2. 비밀번호 bcrypt 해싱
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(password, salt);

        // 3. 본사 전용 파트너 계정 삽입
        const { data: newUser, error: insertError } = await supabase
            .from('b2b_users')
            .insert({
                phone: cleanPhone,
                password_hash: passwordHash,
                owner_name: ownerName,
                company_name: companyName,
                company_id: companyId,
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

// PUT: 기존 B2B 가입 파트너를 본사 계정으로 매핑 및 비밀번호 변경
export async function PUT(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { userId, companyId, password } = body;

        if (!userId) {
            return NextResponse.json({ error: '유저 ID가 필요합니다.' }, { status: 400 });
        }

        const updateData: any = {};
        if (companyId !== undefined) {
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
