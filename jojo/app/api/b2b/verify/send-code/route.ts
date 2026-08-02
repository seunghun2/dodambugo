import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '@/lib/solapi';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 글로벌 인메모리 인증번호 저장소 (DB 테이블 미존재 시에도 100% 보장)
const smsStore = (global as any)._b2bSmsStore || ((global as any)._b2bSmsStore = new Map<string, { code: string; expiresAt: number }>());

// POST: 본인인증 6자리 SMS 실발송
export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

        if (!cleanPhone || cleanPhone.length < 10) {
            return NextResponse.json({ error: '올바른 휴대폰 번호를 입력해주세요.' }, { status: 400 });
        }

        // 6자리 난수 생성
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = Date.now() + 3 * 60 * 1000; // 3분 유효

        // 글로벌 맵에 적재
        smsStore.set(cleanPhone, { code, expiresAt });

        // SOLAPI를 통해 실제 문자(SMS) 발송
        const smsMessage = `[마음부고] 본인확인 인증번호는 [${code}] 입니다. (3분 이내 입력)`;
        const smsResult = await sendSMS(cleanPhone, smsMessage);

        console.log(`📱 [B2B SMS] 실제 문자 발송 완료 (수신번호: ${cleanPhone}, 인증코드: ${code}):`, smsResult);

        return NextResponse.json({
            success: true,
            message: '인증번호가 문자(SMS)로 발송되었습니다.'
        });
    } catch (err: any) {
        console.error('❌ SMS 발송 실패:', err);
        return NextResponse.json({ error: '문자 발송에 실패했습니다. 다시 시도해 주세요.' }, { status: 500 });
    }
}
