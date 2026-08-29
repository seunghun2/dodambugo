import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYNC_SECRET = process.env.MARKETING_SYNC_SECRET || 'maeumbugo-marketing-sync-2026';

// POST: Google Ads Script에서 전송한 일별 광고 데이터 수신 및 DB 동기화
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { secret, data } = body;

        if (secret !== SYNC_SECRET) {
            return NextResponse.json({ error: '인증 실패' }, { status: 401 });
        }

        if (!Array.isArray(data) || data.length === 0) {
            return NextResponse.json({ error: '데이터가 비어있습니다.' }, { status: 400 });
        }

        let insertedCount = 0;
        for (const item of data) {
            const { date, campaignName, cost, clicks, impressions, conversions } = item;
            if (!date) continue;

            const { error } = await supabase
                .from('marketing_ad_spends')
                .upsert({
                    platform: 'google',
                    spend_date: date,
                    campaign_name: campaignName || '구글 캠페인',
                    cost: Number(cost) || 0,
                    clicks: Number(clicks) || 0,
                    impressions: Number(impressions) || 0,
                    conversions: Number(conversions) || 0,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'platform,spend_date,campaign_name'
                });

            if (!error) insertedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `${insertedCount}건의 구글 광고 데이터가 성공적으로 동기화되었습니다.`,
            insertedCount
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}

// GET: 저장된 구글 광고 데이터 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year') || '2026';

        const { data, error } = await supabase
            .from('marketing_ad_spends')
            .select('*')
            .eq('platform', 'google')
            .gte('spend_date', `${year}-01-01`)
            .lte('spend_date', `${year}-12-31`)
            .order('spend_date', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}
