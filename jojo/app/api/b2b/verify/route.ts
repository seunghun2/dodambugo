import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

function getUserIdFromToken(request: NextRequest): string | null {
    let token: string | null = null;
    const auth = request.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
        token = auth.slice(7);
    } else {
        token = request.cookies.get('b2b_token')?.value || null;
    }
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.userId || null;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    const userId = getUserIdFromToken(request);
    if (!userId) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            identity_name,
            rrn_front,
            rrn_back,
            identity_type,
            id_issue_date,
            driver_license_no,
            identity_phone,
            id_card_url
        } = body;

        // 필수 필드 유효성 검사
        if (!identity_name || !rrn_front || !rrn_back || !identity_type || !identity_phone || !id_card_url) {
            return NextResponse.json({ error: '필수 정보를 모두 입력해주세요 (신분증 첨부 필수).' }, { status: 400 });
        }

        if (identity_type === '주민등록증' && !id_issue_date) {
            return NextResponse.json({ error: '주민등록증 발급일자를 입력해주세요.' }, { status: 400 });
        }

        if (identity_type === '운전면허증' && !driver_license_no) {
            return NextResponse.json({ error: '운전면허증 면허번호를 입력해주세요.' }, { status: 400 });
        }

        // 1. 파트너 회원 정보 DB 조회
        const { data: userData, error: userError } = await supabase
            .from('b2b_users')
            .select('owner_name, company_name, phone')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 2. 가입자명과 입력된 실명 일치 여부 확인
        const trimmedOwner = (userData.owner_name || '').trim();
        const trimmedInput = (identity_name || '').trim();
        if (trimmedOwner && trimmedInput && trimmedOwner !== trimmedInput) {
            return NextResponse.json({ 
                error: `가입자 성명(${trimmedOwner})과 입력하신 실명(${trimmedInput})이 일치하지 않습니다.` 
            }, { status: 400 });
        }

        // 3. 본인인증 및 신분증 정보 업데이트
        const updates = {
            identity_verified: true,
            identity_name: trimmedInput || trimmedOwner,
            rrn_front,
            rrn_back,
            identity_type,
            id_issue_date: identity_type === '주민등록증' ? id_issue_date : null,
            driver_license_no: identity_type === '운전면허증' ? driver_license_no : null,
            identity_phone,
            id_card_url,
            verification_status: 'verified',
            updated_at: new Date().toISOString()
        };

        const { error: updateErr } = await supabase
            .from('b2b_users')
            .update(updates)
            .eq('id', userId);

        if (updateErr) {
            console.error('본인인증 정보 업데이트 실패:', updateErr);
            return NextResponse.json({ error: '본인인증 정보 저장에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: '본인인증 및 신분증 등록이 완료되었습니다.' 
        });
    } catch (err) {
        console.error('API 에러:', err);
        return NextResponse.json({ error: '서ver 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
