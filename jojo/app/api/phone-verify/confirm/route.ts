import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// send/route.ts와 같은 Map을 공유해야 하므로 별도 모듈로 분리
// 서버리스 환경에서는 같은 인스턴스에서 실행되므로 import로 공유
import { verificationCodes } from '../store';

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

export async function POST(request: NextRequest) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: '전화번호와 인증번호를 입력해주세요' }, { status: 400 });
        }

        const cleanPhone = phone.replace(/-/g, '');

        // 해외 번호(11자리가 아님)이거나 특정 테스트/데모 번호의 경우 인증코드 '123456' 예외 처리
        const isTestOrForeign = cleanPhone.length !== 11 || cleanPhone === '01012345678' || cleanPhone === '01088889999';
        if (isTestOrForeign && code === '123456') {
            const verificationToken = jwt.sign(
                { phone: cleanPhone, purpose: 'reset-password' },
                JWT_SECRET,
                { expiresIn: '10m' }
            );
            return NextResponse.json({ success: true, message: '인증이 완료되었습니다', verificationToken });
        }

        const stored = verificationCodes.get(cleanPhone);

        if (!stored) {
            return NextResponse.json({ error: '인증번호를 먼저 요청해주세요' }, { status: 400 });
        }

        if (Date.now() > stored.expires) {
            verificationCodes.delete(cleanPhone);
            return NextResponse.json({ error: '인증번호가 만료되었습니다. 다시 요청해주세요' }, { status: 400 });
        }

        if (stored.code !== code) {
            return NextResponse.json({ error: '인증번호가 일치하지 않습니다' }, { status: 400 });
        }

        // 인증 성공 - 코드 삭제
        verificationCodes.delete(cleanPhone);

        const verificationToken = jwt.sign(
            { phone: cleanPhone, purpose: 'reset-password' },
            JWT_SECRET,
            { expiresIn: '10m' }
        );

        return NextResponse.json({ success: true, message: '인증이 완료되었습니다', verificationToken });
    } catch (error) {
        console.error('인증 확인 실패:', error);
        return NextResponse.json({ error: '인증 확인에 실패했습니다' }, { status: 500 });
    }
}
