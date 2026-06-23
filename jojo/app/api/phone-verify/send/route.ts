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

        // B2B 분기 처리 (헤더나 레퍼러 분석)
        const referer = request.headers.get('referer') || '';
        const host = request.headers.get('host') || '';
        const isB2B = host.includes('bugoon') || host.includes('partner') || host.includes('b2b') || referer.includes('/b2b');
        const brand = isB2B ? '부고온' : '마음부고';

        // 테스트 번호(01088889999) 예외 처리
        if (cleanPhone === '01088889999') {
            verificationCodes.set(cleanPhone, {
                code: '123456',
                expires: Date.now() + 30 * 60 * 1000, // 30분 유효
            });
            console.log(`📱 [TEST MOCK] 인증번호 강제 세팅: ${cleanPhone} → 123456`);
            return NextResponse.json({ success: true, message: '인증번호가 발송되었습니다' });
        }

        // SMS 발송
        await sendSMS(cleanPhone, `[${brand}] 인증번호 [${code}]를 입력해주세요.`);

        console.log(`📱 인증번호 발송: ${cleanPhone} → ${code}`);

        return NextResponse.json({ success: true, message: '인증번호가 발송되었습니다' });
    } catch (error) {
        console.error('인증번호 발송 실패:', error);
        return NextResponse.json({ error: '인증번호 발송에 실패했습니다' }, { status: 500 });
    }
}
