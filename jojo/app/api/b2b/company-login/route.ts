import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

// POST: 상조회사 전용 로그인 (login_id + login_password → JWT 발급)
export async function POST(request: NextRequest) {
    try {
        const { login_id, login_password } = await request.json();

        if (!login_id || !login_password) {
            return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 });
        }

        // 상조회사 조회
        const { data: company, error } = await supabase
            .from('b2b_companies')
            .select('*')
            .eq('login_id', login_id)
            .single();

        if (error || !company) {
            return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }

        // 비밀번호 검증 (평문 비교)
        if (company.login_password !== login_password) {
            return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }

        // 비활성화 상조회사 체크
        if (company.is_active === false) {
            return NextResponse.json({ error: '비활성화된 상조회사입니다. 관리자에게 문의하세요.' }, { status: 403 });
        }

        // JWT 발급 (상조회사 전용)
        const token = jwt.sign(
            { companyId: company.id, companyName: company.name, role: 'company' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            success: true,
            token,
            company: {
                id: company.id,
                name: company.name,
                business_no: company.business_no,
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}
