import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 임시저장 목록 조회 (어드민용)
export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabase
            .from('drafts')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// 임시저장 생성/업데이트
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { draftId, formData, templateId, ipAddress } = body;

        // 새 ID 생성 또는 기존 ID 사용
        const id = draftId || crypto.randomUUID();

        const draftData = {
            id,
            template: templateId,
            deceased_name: formData.deceased_name || null,
            gender: formData.gender || null,
            age: formData.age ? parseInt(formData.age) : null,
            religion: formData.religion || null,
            funeral_home: formData.funeral_home || null,
            room_number: formData.room_number || null,
            funeral_home_tel: formData.funeral_home_tel || null,
            address: formData.address || null,
            funeral_date: formData.funeral_date || null,
            funeral_time: formData.funeral_time || null,
            death_date: formData.death_date || null,
            death_time: formData.death_time || null,
            message: formData.message || null,
            applicant_name: formData.applicant_name || null,
            applicant_phone: formData.applicant_phone || null,
            ip_address: ipAddress || null,
            updated_at: new Date().toISOString(),
        };

        // upsert: 있으면 업데이트, 없으면 생성
        const { data, error } = await supabase
            .from('drafts')
            .upsert(draftData, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, draftId: data.id });
    } catch (error: any) {
        console.error('Draft save error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// 임시저장 삭제 (부고 생성 완료 시)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const draftId = searchParams.get('id');

        if (!draftId) {
            return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('drafts')
            .delete()
            .eq('id', draftId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
