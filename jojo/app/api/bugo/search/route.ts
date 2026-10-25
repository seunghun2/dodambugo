import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// 부고 검색 (민감정보 제외 — 공개 표시 필드만 반환)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = (searchParams.get('q') || '').trim();

        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

        const sanitized = query.replace(/[,%()]/g, '').trim();
        if (query && !sanitized) {
            return NextResponse.json({ data: [] });
        }

        const supabase = getSupabase();
        let builder = supabase
            .from('bugo')
            .select('id, bugo_number, deceased_name, mourner_name, applicant_name, funeral_home, room_number, funeral_type, funeral_date, funeral_time, created_at')
            .is('deleted_at', null)
            .neq('bugo_number', '5169');
        if (sanitized) {
            builder = builder.or(`bugo_number.eq.${sanitized},deceased_name.ilike.%${sanitized}%,mourner_name.ilike.%${sanitized}%`);
        }
        const { data, error } = await builder
            .gte('funeral_date', oneMonthAgoStr)
            .order('created_at', { ascending: false })
            .limit(sanitized ? 50 : 100);

        if (error) {
            throw error;
        }

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        console.error('부고 검색 API 오류:', error);
        return NextResponse.json({ error: '검색 중 오류가 발생했습니다.', data: [] }, { status: 500 });
    }
}

// 부고 수정용 비밀번호(연락처 뒷 4자리) 서버 검증
export async function POST(request: NextRequest) {
    try {
        const { bugo_number, password } = await request.json();

        if (!bugo_number || !password) {
            return NextResponse.json({ valid: false, error: '부고번호와 비밀번호를 입력해주세요.' }, { status: 400 });
        }

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('bugo')
            .select('bugo_number, phone_password, applicant_phone')
            .eq('bugo_number', String(bugo_number))
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) {
            return NextResponse.json({ valid: false, error: '부고를 찾을 수 없습니다.' }, { status: 404 });
        }

        const rawPhone = data.phone_password || data.applicant_phone || '';
        const last4 = rawPhone.replace(/[^0-9]/g, '').slice(-4);
        const inputClean = String(password).replace(/[^0-9]/g, '');

        if (last4 && inputClean.length === 4 && inputClean === last4) {
            return NextResponse.json({ valid: true });
        }

        return NextResponse.json({ valid: false, error: '비밀번호가 일치하지 않습니다' }, { status: 401 });
    } catch (error) {
        console.error('부고 비밀번호 검증 오류:', error);
        return NextResponse.json({ valid: false, error: '검증 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
