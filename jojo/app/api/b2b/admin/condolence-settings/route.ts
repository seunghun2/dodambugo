import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: B2B 조의금 설정 & 금액 옵션 조회
export async function GET(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const { data: config, error: configError } = await supabase
            .from('condolence_config')
            .select('*')
            .limit(1)
            .single();

        if (configError) throw configError;

        const { data: amounts, error: amountsError } = await supabase
            .from('condolence_amounts')
            .select('*')
            .order('sort_order', { ascending: true });

        if (amountsError) throw amountsError;

        return NextResponse.json({
            success: true,
            config,
            amounts,
        });
    } catch (error: any) {
        console.error('B2B 조의금 설정 조회 오류:', error);
        return NextResponse.json({ error: '설정 정보를 가져오는데 실패했습니다.' }, { status: 500 });
    }
}

// PATCH: B2B 조의금 설정 & 금액 옵션 업데이트
export async function PATCH(request: NextRequest) {
    const isAdmin = request.cookies.get('admin_ip')?.value === 'true';
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { type } = body;

        // type이 'amount'이거나 body에 id가 존재하는 경우 금액 옵션 업데이트로 판별
        const isAmountUpdate = type === 'amount' || body.id !== undefined;

        if (isAmountUpdate) {
            const { id, is_active } = body;
            if (id === undefined || is_active === undefined) {
                return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
            }

            const { error: updateError } = await supabase
                .from('condolence_amounts')
                .update({ is_active })
                .eq('id', id);

            if (updateError) throw updateError;

            return NextResponse.json({
                success: true,
                message: '금액 옵션 상태가 변경되었습니다.',
            });
        } else {
            // 조의금 기본 설정 업데이트
            const { is_active, fee_rate, daily_limit, min_amount, max_amount } = body;

            // 업데이트할 설정의 id 조회
            const { data: currentConfig, error: fetchError } = await supabase
                .from('condolence_config')
                .select('id')
                .limit(1)
                .single();

            if (fetchError || !currentConfig) {
                return NextResponse.json({ error: '기본 설정 정보를 찾을 수 없습니다.' }, { status: 404 });
            }

            const updateData: any = { updated_at: new Date().toISOString() };
            if (is_active !== undefined) updateData.is_active = is_active;
            if (fee_rate !== undefined) updateData.fee_rate = fee_rate;
            if (daily_limit !== undefined) updateData.daily_limit = daily_limit;
            if (min_amount !== undefined) updateData.min_amount = min_amount;
            if (max_amount !== undefined) updateData.max_amount = max_amount;

            const { error: updateError } = await supabase
                .from('condolence_config')
                .update(updateData)
                .eq('id', currentConfig.id);

            if (updateError) throw updateError;

            return NextResponse.json({
                success: true,
                message: '조의금 설정이 저장되었습니다.',
            });
        }
    } catch (error: any) {
        console.error('B2B 조의금 설정 업데이트 오류:', error);
        return NextResponse.json({ error: '설정 저장에 실패했습니다.' }, { status: 500 });
    }
}
