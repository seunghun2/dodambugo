import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_SETTINGS = {
    wreath_reward_amount: '20000',
    referral_bonus_amount: '2500',
    min_withdrawal_amount: '5000',
};

// GET: B2B 설정 전체 조회
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { data: settingsData, error } = await supabase
            .from('b2b_settings')
            .select('key, value');

        if (error) throw error;

        // 키-값 매핑
        const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
        settingsData?.forEach(item => {
            settings[item.key] = item.value;
        });

        return NextResponse.json({
            success: true,
            settings: {
                wreath_reward_amount: parseInt(settings.wreath_reward_amount),
                referral_bonus_amount: parseInt(settings.referral_bonus_amount),
                min_withdrawal_amount: parseInt(settings.min_withdrawal_amount),
            }
        });
    } catch (error: any) {
        console.error('B2B 설정 조회 오류:', error);
        return NextResponse.json({ error: '설정 정보를 가져오는데 실패했습니다.' }, { status: 500 });
    }
}

// PUT: B2B 설정 업데이트
export async function PUT(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { wreath_reward_amount, referral_bonus_amount, min_withdrawal_amount } = body;

        // 입력값 검증 (양의 정수)
        if (
            wreath_reward_amount === undefined || wreath_reward_amount < 0 ||
            referral_bonus_amount === undefined || referral_bonus_amount < 0 ||
            min_withdrawal_amount === undefined || min_withdrawal_amount < 0
        ) {
            return NextResponse.json({ error: '올바른 설정값을 입력해주세요.' }, { status: 400 });
        }

        const updates = [
            { key: 'wreath_reward_amount', value: String(wreath_reward_amount) },
            { key: 'referral_bonus_amount', value: String(referral_bonus_amount) },
            { key: 'min_withdrawal_amount', value: String(min_withdrawal_amount) },
        ];

        // 다중 Upsert 실행
        const { error } = await supabase
            .from('b2b_settings')
            .upsert(updates, { onConflict: 'key' });

        if (error) throw error;

        console.log(`⚙️ B2B 어드민 설정 업데이트 완료:`, body);

        return NextResponse.json({ success: true, message: '설정이 저장되었습니다.' });
    } catch (error: any) {
        console.error('B2B 설정 업데이트 오류:', error);
        return NextResponse.json({ error: '설정 저장에 실패했습니다.' }, { status: 500 });
    }
}
