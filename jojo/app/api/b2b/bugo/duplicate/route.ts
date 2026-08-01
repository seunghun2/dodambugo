import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

function getUserIdFromToken(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    try {
        const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as any;
        return decoded.userId;
    } catch {
        return null;
    }
}

// 4자리 유니크 부고번호 생성
async function generateBugoNumber(): Promise<string> {
    for (let i = 0; i < 20; i++) {
        const num = Math.floor(1000 + Math.random() * 9000).toString();
        const { data } = await supabase
            .from('bugo')
            .select('bugo_number')
            .eq('bugo_number', num)
            .maybeSingle();
        if (!data) return num;
    }
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// 상주 토큰 생성
function generateOwnerToken(): string {
    return 'xxxxxxxxxxxx'.replace(/x/g, () =>
        Math.floor(Math.random() * 16).toString(16)
    );
}

export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { bugo_number } = body;

        if (!bugo_number) {
            return NextResponse.json({ error: '복제할 부고 번호가 필요합니다.' }, { status: 400 });
        }

        // 1. 원본 부고 조회
        const { data: originalBugo, error: fetchError } = await supabase
            .from('bugo')
            .select('*')
            .eq('bugo_number', bugo_number)
            .maybeSingle();

        if (fetchError || !originalBugo) {
            return NextResponse.json({ error: '복제할 원본 부고장을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 2. 새로운 부고번호 및 토큰 생성
        const newBugoNumber = await generateBugoNumber();
        const newOwnerToken = generateOwnerToken();

        // 3. 복제할 객체 생성 (id 및 타임스탬프 삭제/갱신)
        const { id, created_at, updated_at, ...cleanData } = originalBugo;

        const duplicatedBugo = {
            ...cleanData,
            bugo_number: newBugoNumber,
            owner_token: newOwnerToken,
            b2b_user_id: userId,
            deceased_name: originalBugo.deceased_name,
            created_at: new Date().toISOString(),
        };

        // 4. DB Insert
        const { error: insertError } = await supabase
            .from('bugo')
            .insert([duplicatedBugo]);

        if (insertError) {
            console.error('[API B2B BUGO DUPLICATE ERROR]:', insertError);
            return NextResponse.json({ error: `부고 복제 DB 실패: ${insertError.message}` }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            bugo_number: newBugoNumber,
            message: '부고장이 성공적으로 복제되었습니다.',
        });
    } catch (err: any) {
        console.error('[API B2B BUGO DUPLICATE EXCEPTION]:', err);
        return NextResponse.json({ error: '부고장 복제 과정에서 서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
