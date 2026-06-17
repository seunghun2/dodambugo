import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/solapi';
import { verificationCodes } from '../store';

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: '전화번호를 입력해주세요' }, { status: 400 });
        }

        // 전화번호 정리 (하이픈 제거)
        const cleanPhone = phone.replace(/-/g, '');

        if (cleanPhone.length !== 11) {
            return NextResponse.json({ error: '올바른 전화번호를 입력해주세요' }, { status: 400 });
        }

        // 6자리 인증번호 생성
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 3분 유효
        verificationCodes.set(cleanPhone, {
            code,
            expires: Date.now() + 3 * 60 * 1000,
        });

        // SMS 발송
        await sendSMS(cleanPhone, `[마음부고] 인증번호 [${code}]를 입력해주세요.`);

        console.log(`📱 인증번호 발송: ${cleanPhone} → ${code}`);

        return NextResponse.json({ success: true, message: '인증번호가 발송되었습니다' });
    } catch (error) {
        console.error('인증번호 발송 실패:', error);
        return NextResponse.json({ error: '인증번호 발송에 실패했습니다' }, { status: 500 });
    }
}
