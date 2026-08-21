import { verifyAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: B2B 파트너들이 작성한 1:1 문의 목록 조회
export async function GET(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        // 1. B2B 유저의 전화번호 및 회사명 정보를 가져옴
        const { data: b2bUsers, error: userError } = await supabase
            .from('b2b_users')
            .select('phone, company_name, owner_name');
        
        if (userError) throw userError;

        const b2bUserMap = new Map();
        b2bUsers?.forEach(user => {
            // 전화번호 포맷 통일 (하이픈 유무 대응)
            const cleanPhone = user.phone.replace(/-/g, '');
            b2bUserMap.set(cleanPhone, user);
            b2bUserMap.set(user.phone, user); // 원본도 등록
        });

        const phoneList = Array.from(b2bUserMap.keys());

        if (phoneList.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 2. inquiries 전체 조회
        const { data: inquiries, error: inqError } = await supabase
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (inqError) throw inqError;

        // 3. 문의글의 phone을 B2B 유저 목록과 매칭하여 B2B 문의만 필터링
        const b2bInquiries = inquiries?.filter(inq => {
            const cleanInqPhone = inq.phone.replace(/-/g, '');
            return b2bUserMap.has(cleanInqPhone) || b2bUserMap.has(inq.phone);
        }) || [];

        // 4. 문의글에 B2B 회사명 및 오너명 매핑
        const formattedInquiries = b2bInquiries.map(inq => {
            const cleanInqPhone = inq.phone.replace(/-/g, '');
            const b2bUser = b2bUserMap.get(cleanInqPhone) || b2bUserMap.get(inq.phone);
            return {
                ...inq,
                company: b2bUser?.company_name || inq.company || '알 수 없음',
                name: b2bUser?.owner_name || inq.name || '알 수 없음',
            };
        });

        return NextResponse.json({ success: true, data: formattedInquiries });
    } catch (error: any) {
        console.error('B2B inquiries fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: 1:1 문의 메모 수정
export async function PUT(request: NextRequest) {
    const isAdmin = verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, memo } = body;

        if (!id) {
            return NextResponse.json({ error: 'Inquiry ID가 필요합니다.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('inquiries')
            .update({ memo })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('B2B inquiries memo update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
