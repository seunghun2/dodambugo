import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 임시저장 조회 (단건 id 조회는 복원용 허용, 전체 목록 조회는 어드민 전용)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (draftId) {
        try {
            const { data, error } = await supabase
                .from('drafts')
                .select('*')
                .eq('id', draftId)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
            return NextResponse.json({ data });
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    if (!verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { data, error } = await supabase
            .from('drafts')
            .select('*')
            .order('updated_at', { ascending: false });

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
        const {
            draftId,
            formData = {},
            mourners,
            accounts,
            isAccountSaved,
            showAccount,
            showBurial,
            showIlpo,
            hideFuneral,
            showPhoto,
            photoUrl,
            phoneVerified,
            templateId,
            ipAddress,
            b2bUserId,
        } = body;

        // 새 ID 생성 또는 기존 ID 사용
        const id = draftId || crypto.randomUUID();

        const resolvedFuneralTime =
            formData.funeral_time ||
            (formData.funeral_hour ? `${formData.funeral_hour}:${formData.funeral_minute || '00'}` : null);
        const resolvedDeathTime =
            formData.death_time ||
            (formData.death_hour ? `${formData.death_hour}:${formData.death_minute || '00'}` : null);
        const resolvedEncoffinTime =
            formData.encoffin_time ||
            (formData.encoffin_hour ? `${formData.encoffin_hour}:${formData.encoffin_minute || '00'}` : null);

        const resolvedMourners = Array.isArray(mourners)
            ? mourners
            : Array.isArray(formData.mourners)
                ? formData.mourners
                : null;
        const resolvedAccounts = Array.isArray(accounts)
            ? accounts
            : Array.isArray(formData.accounts)
                ? formData.accounts
                : null;
        const resolvedPhotoUrl = photoUrl ?? formData.photo_url ?? null;

        const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

        const draftData: Record<string, any> = {
            id,
            template: templateId || 'basic',
            deceased_name: formData.deceased_name || null,
            gender: formData.gender || null,
            age: formData.age ? parseInt(String(formData.age), 10) : null,
            religion: formData.religion || null,
            funeral_type: formData.funeral_type || null,
            funeral_home: formData.funeral_home || null,
            room_number: formData.room_number || null,
            funeral_home_tel: formData.funeral_home_tel || null,
            address: formData.address || null,
            funeral_date: formData.funeral_date || null,
            funeral_time: resolvedFuneralTime,
            death_date: formData.death_date || null,
            death_time: resolvedDeathTime,
            encoffin_date: formData.encoffin_date || null,
            encoffin_time: resolvedEncoffinTime,
            ilpo_date: formData.ilpo_date || null,
            ilpo_time: formData.ilpo_time || null,
            burial_place: formData.burial_place || null,
            burial_place2: formData.burial_place2 || null,
            message: formData.message || null,
            applicant_name: formData.applicant_name || null,
            applicant_phone: formData.applicant_phone || null,
            mourner_name: formData.primary_mourner || formData.mourner_name || null,
            relationship: formData.relationship || null,
            mourners: resolvedMourners,
            account_info: resolvedAccounts,
            photo_url: resolvedPhotoUrl || null,
            form_payload: {
                formData,
                mourners: resolvedMourners,
                accounts: resolvedAccounts,
                isAccountSaved: Boolean(isAccountSaved),
                showAccount: Boolean(showAccount),
                showBurial: Boolean(showBurial),
                showIlpo: Boolean(showIlpo),
                hideFuneral: Boolean(hideFuneral),
                showPhoto: Boolean(showPhoto),
                photoUrl: resolvedPhotoUrl || '',
                phoneVerified: Boolean(phoneVerified),
            },
            ip_address: ipAddress || forwardedIp,
            updated_at: new Date().toISOString(),
        };

        // B2B 사용자 ID가 있을 때만 포함
        if (b2bUserId) {
            draftData.b2b_user_id = b2bUserId;
        }

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
