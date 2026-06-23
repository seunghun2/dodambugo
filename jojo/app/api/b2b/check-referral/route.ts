import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 추천인 코드로 회원 정보 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { error: '추천 코드를 입력해주세요.' },
                { status: 400 }
            );
        }

        const { data: recommender } = await supabase
            .from('b2b_users')
            .select('id, company_name, owner_name')
            .eq('my_referral_code', code.trim().toUpperCase())
            .single();

        if (!recommender) {
            return NextResponse.json(
                { valid: false, error: '존재하지 않는 추천 코드입니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            valid: true,
            recommender: {
                company_name: recommender.company_name,
                owner_name: recommender.owner_name,
            },
        });
    } catch (error) {
        console.error('추천 코드 확인 오류:', error);
        return NextResponse.json(
            { error: '추천 코드 확인 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
