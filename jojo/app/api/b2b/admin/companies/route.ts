import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 상조회사 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { data: companies, error } = await supabase
            .from('b2b_companies')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, companies });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// POST: 신규 상조회사 등록 (표준 사업자 정보 필드 추가)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, business_no, wreath_commission_amount, wreath_member_commission_amount, owner_name, address, business_type, business_item } = body;

        if (!name) {
            return NextResponse.json({ error: '상조회사명을 입력해주세요.' }, { status: 400 });
        }

        const insertPayload: Record<string, any> = {
            name,
            business_no: business_no || '',
            wreath_commission_amount: wreath_commission_amount !== undefined ? parseInt(wreath_commission_amount) : 10000,
            wreath_member_commission_amount: wreath_member_commission_amount !== undefined ? parseInt(wreath_member_commission_amount) : 10000,
        };
        if (owner_name) insertPayload.owner_name = owner_name;
        if (address) insertPayload.address = address;
        if (business_type) insertPayload.business_type = business_type;
        if (business_item) insertPayload.business_item = business_item;

        let { data: newCompany, error } = await supabase
            .from('b2b_companies')
            .insert(insertPayload)
            .select()
            .single();

        // 1차 폴백: 확장 칼럼만 제거하고 수당 칼럼 유지
        if (error && error.message.includes('Could not find')) {
            console.warn('⚠️ b2b_companies 스키마 칼럼 누락 1차 폴백:', error.message);
            const fb1 = await supabase
                .from('b2b_companies')
                .insert({
                    name,
                    business_no: business_no || '',
                    wreath_commission_amount: wreath_commission_amount !== undefined ? parseInt(wreath_commission_amount) : 10000,
                    wreath_member_commission_amount: wreath_member_commission_amount !== undefined ? parseInt(wreath_member_commission_amount) : 10000,
                })
                .select()
                .single();
            newCompany = fb1.data;
            error = fb1.error;
        }

        // 2차 폴백: wreath_member_commission_amount 등 추가 수당 칼럼도 누락된 경우 최소 안전 칼럼으로 insert
        if (error && error.message.includes('Could not find')) {
            console.warn('⚠️ b2b_companies 스키마 칼럼 누락 2차 폴백:', error.message);
            const fb2 = await supabase
                .from('b2b_companies')
                .insert({
                    name,
                    business_no: business_no || '',
                    wreath_commission_amount: wreath_commission_amount !== undefined ? parseInt(wreath_commission_amount) : 10000,
                })
                .select()
                .single();
            newCompany = fb2.data;
            error = fb2.error;
        }

        // 3차 최종 폴백: name, business_no 최원초 필드로 insert
        if (error && error.message.includes('Could not find')) {
            console.warn('⚠️ b2b_companies 스키마 칼럼 누락 3차 최종 폴백:', error.message);
            const fb3 = await supabase
                .from('b2b_companies')
                .insert({
                    name,
                    business_no: business_no || '',
                })
                .select()
                .single();
            newCompany = fb3.data;
            error = fb3.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, company: newCompany });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// PUT: 상조회사 정보 및 수당 수정 (표준 사업자 정보 필드 추가)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, business_no, wreath_commission_amount, wreath_member_commission_amount, owner_name, address, business_type, business_item } = body;

        if (!id || !name) {
            return NextResponse.json({ error: 'ID와 상조회사명은 필수 항목입니다.' }, { status: 400 });
        }

        const updatePayload: Record<string, any> = {
            name,
            business_no: business_no || '',
            wreath_commission_amount: wreath_commission_amount !== undefined ? parseInt(wreath_commission_amount) : 10000,
            wreath_member_commission_amount: wreath_member_commission_amount !== undefined ? parseInt(wreath_member_commission_amount) : 10000,
        };
        if (owner_name !== undefined) updatePayload.owner_name = owner_name;
        if (address !== undefined) updatePayload.address = address;
        if (business_type !== undefined) updatePayload.business_type = business_type;
        if (business_item !== undefined) updatePayload.business_item = business_item;

        let { data: updatedCompany, error } = await supabase
            .from('b2b_companies')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        // 1차 폴백
        if (error && error.message.includes('Could not find')) {
            const fb1 = await supabase
                .from('b2b_companies')
                .update({
                    name,
                    business_no: business_no || '',
                    wreath_commission_amount: wreath_commission_amount !== undefined ? parseInt(wreath_commission_amount) : 10000,
                    wreath_member_commission_amount: wreath_member_commission_amount !== undefined ? parseInt(wreath_member_commission_amount) : 10000,
                })
                .eq('id', id)
                .select()
                .single();
            updatedCompany = fb1.data;
            error = fb1.error;
        }

        // 2차 폴백
        if (error && error.message.includes('Could not find')) {
            const fb2 = await supabase
                .from('b2b_companies')
                .update({
                    name,
                    business_no: business_no || '',
                    wreath_commission_amount: wreath_commission_amount !== undefined ? parseInt(wreath_commission_amount) : 10000,
                })
                .eq('id', id)
                .select()
                .single();
            updatedCompany = fb2.data;
            error = fb2.error;
        }

        // 3차 폴백
        if (error && error.message.includes('Could not find')) {
            const fb3 = await supabase
                .from('b2b_companies')
                .update({
                    name,
                    business_no: business_no || '',
                })
                .eq('id', id)
                .select()
                .single();
            updatedCompany = fb3.data;
            error = fb3.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, company: updatedCompany });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// DELETE: 상조회사 삭제
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: '삭제할 상조회사의 ID가 필요합니다.' }, { status: 400 });
        }

        // 먼저 이 상조회사를 소속으로 가진 파트너 지도사가 있는지 체크하여 소속 해제(null 처리)
        await supabase
            .from('b2b_users')
            .update({ company_id: null })
            .eq('company_id', id);

        const { error } = await supabase
            .from('b2b_companies')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}
