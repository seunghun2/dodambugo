import { NextRequest, NextResponse } from 'next/server';
import { getVerificationCode, deleteVerificationCode } from '@/app/api/phone-verify/store';

// POST: SMS 6자리 인증번호 매칭 검증
export async function POST(request: NextRequest) {
    try {
        const { phone, code } = await request.json();
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

        if (!cleanPhone || !code) {
            return NextResponse.json({ error: '휴대폰 번호와 인증번호를 입력해 주세요.' }, { status: 400 });
        }

        const record = await getVerificationCode(cleanPhone);

        if (!record) {
            return NextResponse.json({ error: '인증번호 발송 이력이 없습니다. 다시 발송해 주세요.' }, { status: 400 });
        }

        if (Date.now() > record.expires) {
            await deleteVerificationCode(cleanPhone);
            return NextResponse.json({ error: '인증 시간이 만료되었습니다. 다시 발송해 주세요.' }, { status: 400 });
        }

        if (record.code !== code.trim()) {
            return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' }, { status: 400 });
        }

        // 인증 성공 처리
        await deleteVerificationCode(cleanPhone);

        return NextResponse.json({
            success: true,
            message: '본인인증이 성공적으로 완료되었습니다.'
        });
    } catch (err: any) {
        console.error('❌ SMS 검증 실패:', err);
        return NextResponse.json({ error: '인증 처리에 실패했습니다.' }, { status: 500 });
    }
}
