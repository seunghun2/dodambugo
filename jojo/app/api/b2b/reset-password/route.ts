import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, phone, name, currentPassword, newPassword } = body;

        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

        if (!cleanPhone) {
            return NextResponse.json({ error: '휴대폰 번호를 입력해 주세요.' }, { status: 400 });
        }

        // 1. 이름 & 휴대폰 번호 매칭 검증 (비밀번호 찾기 시 사전 체크)
        if (action === 'verify') {
            if (!name || !name.trim()) {
                return NextResponse.json({ error: '이름(본인명)을 입력해 주세요.' }, { status: 400 });
            }

            const trimmedName = name.trim();

            const { data: partner } = await supabase
                .from('b2b_users')
                .select('id, owner_name, company_name')
                .eq('phone', cleanPhone)
                .maybeSingle();

            if (!partner) {
                return NextResponse.json(
                    { error: '입력하신 휴대폰 번호로 가입된 파트너 정보가 없습니다.' },
                    { status: 404 }
                );
            }

            // 본인명(owner_name) 또는 상호명(company_name) 대조
            const isNameMatched = 
                partner.owner_name?.trim() === trimmedName || 
                partner.company_name?.trim() === trimmedName;

            if (!isNameMatched) {
                return NextResponse.json(
                    { error: '입력하신 이름과 휴대폰 번호 정보가 일치하지 않습니다.' },
                    { status: 400 }
                );
            }

            return NextResponse.json({ success: true, message: '파트너 확인 완료' });
        }

        // 2. 비밀번호 재설정 / 변경 수행
        if (!newPassword) {
            return NextResponse.json({ error: '새 비밀번호를 입력해 주세요.' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
        }

        // 파트너 존재 확인 (b2b_users 테이블)
        const { data: partner, error: findError } = await supabase
            .from('b2b_users')
            .select('id, password_hash')
            .eq('phone', cleanPhone)
            .maybeSingle();

        if (findError || !partner) {
            return NextResponse.json({ error: '가입된 파트너 계정을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 기존 비밀번호 검증 (currentPassword가 전달되었을 때)
        if (currentPassword) {
            const isPasswordCorrect = await bcrypt.compare(currentPassword, partner.password_hash);
            if (!isPasswordCorrect) {
                return NextResponse.json({ error: '기존 비밀번호가 일치하지 않습니다.' }, { status: 400 });
            }
        }

        // 비밀번호 해싱 & 업데이트 (password_hash 컬럼)
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { error: updateError } = await supabase
            .from('b2b_users')
            .update({ password_hash: hashedPassword })
            .eq('id', partner.id);

        if (updateError) {
            return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('비밀번호 재설정 오류:', err);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
