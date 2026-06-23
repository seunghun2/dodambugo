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

// 부고번호 생성 (4자리 유니크)
async function generateBugoNumber(): Promise<string> {
    for (let i = 0; i < 20; i++) {
        const num = Math.floor(1000 + Math.random() * 9000).toString();
        const { data } = await supabase
            .from('bugo')
            .select('bugo_number')
            .eq('bugo_number', num)
            .single();
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

// POST: B2B 부고 생성 또는 수정
export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { bugoData, isEditMode, editBugoNumber, mourners } = body;

        if (isEditMode) {
            if (!editBugoNumber) {
                return NextResponse.json({ error: '수정할 부고 번호가 없습니다.' }, { status: 400 });
            }

            // 1. 해당 부고가 존재하고 본인의 부고인지 확인
            const { data: existingBugo, error: findError } = await supabase
                .from('bugo')
                .select('b2b_user_id')
                .eq('bugo_number', editBugoNumber)
                .single();

            if (findError || !existingBugo) {
                return NextResponse.json({ error: '부고를 찾을 수 없습니다.' }, { status: 404 });
            }

            if (existingBugo.b2b_user_id !== userId) {
                return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
            }

            // 2. 부고 수정
            const { error: updateError } = await supabase
                .from('bugo')
                .update(bugoData)
                .eq('bugo_number', editBugoNumber);

            if (updateError) {
                console.error('[API B2B BUGO UPDATE ERROR]:', updateError);
                return NextResponse.json({ error: '부고 수정에 실패했습니다.' }, { status: 500 });
            }

            return NextResponse.json({ success: true, bugo_number: editBugoNumber });
        } else {
            // 부고 신규 생성
            const bugoNumber = await generateBugoNumber();
            const ownerToken = generateOwnerToken();

            const newBugoData = {
                ...bugoData,
                bugo_number: bugoNumber,
                template_id: 'basic',
                applicant_name: mourners?.[0]?.name || '',
                applicant_phone: mourners?.[0]?.contact || '',
                phone_password: mourners?.[0]?.contact || '',
                status: 'active',
                owner_token: ownerToken,
                b2b_user_id: userId,
            };

            const { error: insertError } = await supabase
                .from('bugo')
                .insert([newBugoData]);

            if (insertError) {
                console.error('[API B2B BUGO INSERT ERROR]:', insertError);
                return NextResponse.json({ error: '부고 생성에 실패했습니다.' }, { status: 500 });
            }

            return NextResponse.json({ success: true, bugo_number: bugoNumber });
        }
    } catch (err) {
        console.error('[API B2B BUGO SERVER ERROR]:', err);
        return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
