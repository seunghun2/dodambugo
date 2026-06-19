import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { phone, newPassword } = await req.json();

        if (!phone || !newPassword) {
            return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
        }

        // 파트너 존재 확인
        const { data: partner, error: findError } = await supabase
            .from('b2b_partners')
            .select('id')
            .eq('phone', phone)
            .single();

        if (findError || !partner) {
            return NextResponse.json({ error: '가입된 계정을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 비밀번호 해싱 & 업데이트
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { error: updateError } = await supabase
            .from('b2b_partners')
            .update({ password: hashedPassword })
            .eq('id', partner.id);

        if (updateError) {
            return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
