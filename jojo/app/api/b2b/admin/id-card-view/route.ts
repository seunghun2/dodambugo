import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 어드민 보안 신분증 이미지 서빙 (Service Role 임시 서명 URL로 100% 원본 렌더링)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let path = searchParams.get('path');

        if (!path) {
            return new NextResponse('Path parameter missing', { status: 400 });
        }

        // 경로 표준화 (버킷명이 경로에 포함된 경우만 제거, id_cards/ 폴더는 유지)
        const cleanPath = path.replace(/^b2b-id-cards\//, '').replace(/^\/+/, '');

        // 1. Service Role 임시 서명 URL 생성 (1시간 유효, RLS 구애 없이 100% 렌더링)
        const { data: signedData, error: signedErr } = await supabase.storage
            .from('b2b-id-cards')
            .createSignedUrl(cleanPath, 3600);

        if (!signedErr && signedData?.signedUrl) {
            return NextResponse.redirect(signedData.signedUrl);
        }

        // 2. Fallback: 퍼블릭 URL 302 리다이렉트
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnlyqhrjnpbkleenmszm.supabase.co';
        const targetUrl = `${supabaseUrl}/storage/v1/object/public/b2b-id-cards/${cleanPath}`;
        return NextResponse.redirect(targetUrl);
    } catch (err: any) {
        console.error('❌ 신분증 이미지 서빙 API 에러:', err);
        return new NextResponse('Server Error', { status: 500 });
    }
}
