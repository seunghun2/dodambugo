import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 허용 MIME 타입
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const reviewCode = formData.get('reviewCode') as string | null;

        if (!file || !reviewCode) {
            return NextResponse.json({ error: '파일과 리뷰코드가 필요합니다.' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: '지원하지 않는 파일 형식입니다.' }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
        }

        // 파일 확장자 추출
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${reviewCode}/${crypto.randomUUID()}.${ext}`;

        // ArrayBuffer로 변환
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Supabase Storage 업로드
        const { data, error } = await supabase.storage
            .from('review-photos')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error('Storage 업로드 오류:', error);
            return NextResponse.json({ error: '사진 업로드에 실패했습니다.' }, { status: 500 });
        }

        // Public URL 생성
        const { data: urlData } = supabase.storage
            .from('review-photos')
            .getPublicUrl(data.path);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
        });
    } catch (err) {
        console.error('사진 업로드 API 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
