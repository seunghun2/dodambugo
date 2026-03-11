import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendBurialReviewNotification } from '@/lib/slack';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 부고번호 → 랜덤 보이는 코드 생성 (항상 동일한 결과)
export function generateReviewCode(bugoNumber: string): string {
    return crypto
        .createHash('md5')
        .update('maeum-review-' + bugoNumber)
        .digest('hex')
        .substring(0, 10);
}

// 리뷰 제출 API
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { reviewCode, burialPlace, mournerName, rating, reviewText, photos, consentAgreed } = body;

        if (!reviewCode || !rating) {
            return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
        }

        // 리뷰코드로 부고번호 역추적
        const { data: bugo } = await supabase
            .from('bugo')
            .select('bugo_number, burial_place, mourner_name')
            .is('deleted_at', null);

        const matched = bugo?.find(b => generateReviewCode(String(b.bugo_number)) === reviewCode);
        if (!matched) {
            return NextResponse.json({ error: '잘못된 접근입니다.' }, { status: 403 });
        }

        const bugoNumber = String(matched.bugo_number);

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: '별점은 1~5 사이여야 합니다.' }, { status: 400 });
        }

        // 중복 체크 (같은 부고번호 + 같은 장지)
        const { data: existing } = await supabase
            .from('burial_reviews')
            .select('id')
            .eq('bugo_number', bugoNumber)
            .eq('burial_place', burialPlace || matched.burial_place)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: '이미 후기를 작성하셨습니다.' }, { status: 400 });
        }

        // 리뷰 저장
        const { data, error } = await supabase
            .from('burial_reviews')
            .insert({
                bugo_number: bugoNumber,
                burial_place: burialPlace || matched.burial_place,
                mourner_name: mournerName || matched.mourner_name || null,
                rating,
                review_text: reviewText || null,
                photos: photos || [],
                consent_agreed: consentAgreed || false,
            })
            .select('id')
            .single();

        if (error) {
            console.error('리뷰 저장 오류:', error);
            return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 });
        }

        // 슬랙 알림 (#99_99_장지이용후기)
        try {
            await sendBurialReviewNotification({
                bugo_number: bugoNumber,
                burial_place: burialPlace || matched.burial_place,
                mourner_name: mournerName || matched.mourner_name,
                rating,
                review_text: reviewText,
                photo_count: photos?.length || 0,
                consent_agreed: consentAgreed,
            });
        } catch (slackErr) {
            console.error('슬랙 알림 실패 (무시):', slackErr);
        }

        return NextResponse.json({ success: true, id: data.id });
    } catch (err) {
        console.error('리뷰 API 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// 부고 정보 조회 (리뷰 페이지용)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reviewCode = searchParams.get('code');

        if (!reviewCode) {
            return NextResponse.json({ error: '코드가 필요합니다.' }, { status: 400 });
        }

        // 리뷰코드로 부고 찾기
        const { data: bugos } = await supabase
            .from('bugo')
            .select('bugo_number, mourner_name, burial_place, burial_place2, funeral_home')
            .is('deleted_at', null)
            .not('burial_place', 'is', null);

        const matched = bugos?.find(b => generateReviewCode(String(b.bugo_number)) === reviewCode);
        if (!matched) {
            return NextResponse.json({ error: '잘못된 접근입니다.' }, { status: 403 });
        }

        // 이미 리뷰 작성했는지 체크
        const { data: existing } = await supabase
            .from('burial_reviews')
            .select('id')
            .eq('bugo_number', String(matched.bugo_number))
            .maybeSingle();

        return NextResponse.json({
            burialPlace: matched.burial_place,
            burialPlace2: matched.burial_place2 || null,
            mournerName: matched.mourner_name,
            funeralHome: matched.funeral_home,
            alreadyReviewed: !!existing,
        });
    } catch (err) {
        console.error('부고 조회 오류:', err);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
