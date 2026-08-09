import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeCompanyData } from '@/lib/b2b-company';

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

        const packedCompanies = (companies || []).map(normalizeCompanyData);

        return NextResponse.json({ success: true, companies: packedCompanies });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// POST: 신규 상조회사 등록 (표준 사업자 정보 및 부의금 수수료 칼럼 지원)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            name, business_no, wreath_commission_amount, wreath_member_commission_amount, 
            owner_name, address, business_type, business_item,
            condolence_fee_rate, condolence_pg_rate, condolence_platform_rate, condolence_vat_enabled
        } = body;

        if (!name) {
            return NextResponse.json({ error: '상조회사명을 입력해주세요.' }, { status: 400 });
        }

        const insertPayload: Record<string, any> = {
            name,
            business_no: business_no || '',
            wreath_commission_amount: wreath_commission_amount !== undefined ? parseInt(wreath_commission_amount, 10) : 10000,
            wreath_member_commission_amount: wreath_member_commission_amount !== undefined ? parseInt(wreath_member_commission_amount, 10) : 10000,
        };
        if (owner_name !== undefined) insertPayload.owner_name = owner_name;
        if (address !== undefined) insertPayload.address = address;
        if (business_type !== undefined) insertPayload.business_type = business_type;
        if (business_item !== undefined) insertPayload.business_item = business_item;
        if (condolence_fee_rate !== undefined) insertPayload.condolence_fee_rate = parseFloat(condolence_fee_rate);
        if (condolence_pg_rate !== undefined) insertPayload.condolence_pg_rate = parseFloat(condolence_pg_rate);
        if (condolence_platform_rate !== undefined) insertPayload.condolence_platform_rate = parseFloat(condolence_platform_rate);
        if (condolence_vat_enabled !== undefined) insertPayload.condolence_vat_enabled = Boolean(condolence_vat_enabled);

        let { data: newCompany, error } = await supabase
            .from('b2b_companies')
            .insert(insertPayload)
            .select()
            .single();

        // 칼럼 미생성 구 DB 환경 대비 2중 하위 호환 폴백 실행
        if (error && error.message.includes('Could not find')) {
            console.warn('⚠️ b2b_companies 레거시 DB 환경 2중 하위호환 폴백 실행:', error.message);
            const encodedBizNo = `${business_no || ''}::${owner_name || ''}::${address || ''}::${business_type || ''}::${business_item || ''}::${wreath_member_commission_amount !== undefined ? wreath_member_commission_amount : 10000}`;
            
            const fbRes = await supabase
                .from('b2b_companies')
                .insert({
                    name,
                    business_no: encodedBizNo,
                    wreath_commission_amount: wreath_commission_amount !== undefined ? parseInt(wreath_commission_amount, 10) : 10000,
                })
                .select()
                .single();
            newCompany = fbRes.data;
            error = fbRes.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, company: normalizeCompanyData(newCompany) });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// PUT: 상조회사 정보 및 수당 수정 (표준 사업자 정보 및 부의금 수수료 칼럼 지원)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            id, name, business_no, wreath_commission_amount, wreath_member_commission_amount, 
            owner_name, address, business_type, business_item,
            condolence_fee_rate, condolence_pg_rate, condolence_platform_rate, condolence_vat_enabled
        } = body;

        if (!id || !name) {
            return NextResponse.json({ error: 'ID와 상조회사명은 필수 항목입니다.' }, { status: 400 });
        }

        const updatePayload: Record<string, any> = {
            name,
            business_no: business_no || '',
            wreath_commission_amount: wreath_commission_amount !== undefined ? parseInt(wreath_commission_amount, 10) : 10000,
            wreath_member_commission_amount: wreath_member_commission_amount !== undefined ? parseInt(wreath_member_commission_amount, 10) : 10000,
        };
        if (owner_name !== undefined) updatePayload.owner_name = owner_name;
        if (address !== undefined) updatePayload.address = address;
        if (business_type !== undefined) updatePayload.business_type = business_type;
        if (business_item !== undefined) updatePayload.business_item = business_item;
        if (condolence_fee_rate !== undefined) updatePayload.condolence_fee_rate = parseFloat(condolence_fee_rate);
        if (condolence_pg_rate !== undefined) updatePayload.condolence_pg_rate = parseFloat(condolence_pg_rate);
        if (condolence_platform_rate !== undefined) updatePayload.condolence_platform_rate = parseFloat(condolence_platform_rate);
        if (condolence_vat_enabled !== undefined) updatePayload.condolence_vat_enabled = Boolean(condolence_vat_enabled);

        let { data: updatedCompany, error } = await supabase
            .from('b2b_companies')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        // 칼럼 미생성 구 DB 환경 대비 2중 하위 호환 폴백 실행
        if (error && error.message.includes('Could not find')) {
            console.warn('⚠️ b2b_companies 레거시 DB 환경 2중 하위호환 폴백 실행 (PUT):', error.message);
            const encodedBizNo = `${business_no || ''}::${owner_name || ''}::${address || ''}::${business_type || ''}::${business_item || ''}::${wreath_member_commission_amount !== undefined ? wreath_member_commission_amount : 10000}`;

            const fbRes = await supabase
                .from('b2b_companies')
                .update({
                    name,
                    business_no: encodedBizNo,
                    wreath_commission_amount: wreath_commission_amount !== undefined ? parseInt(wreath_commission_amount, 10) : 10000,
                })
                .eq('id', id)
                .select()
                .single();
            updatedCompany = fbRes.data;
            error = fbRes.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, company: normalizeCompanyData(updatedCompany) });
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

