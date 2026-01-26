import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = getSupabase();

        // 부고 정보 조회
        const isUUID = id.includes('-') && id.length > 10;
        let bugo = null;

        if (isUUID) {
            const { data } = await supabase
                .from('bugo')
                .select('deceased_name')
                .eq('id', id)
                .single();
            bugo = data;
        } else {
            const { data } = await supabase
                .from('bugo')
                .select('deceased_name')
                .eq('bugo_number', id)
                .single();
            bugo = data;
        }

        const deceasedName = bugo?.deceased_name || '고인';

        // 배경 이미지 fetch
        const url = new URL(request.url);
        const baseUrl = url.origin;
        const bgImageRes = await fetch(`${baseUrl}/images/og-thanks-bg.png`);
        const bgImageData = await bgImageRes.arrayBuffer();

        // 나눔명조 폰트 fetch
        const fontRes = await fetch(`${baseUrl}/fonts/NanumMyeongjo-Regular.ttf`);
        const fontData = await fontRes.arrayBuffer();

        return new ImageResponse(
            (
                <div
                    style={{
                        width: '800px',
                        height: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        position: 'relative',
                    }}
                >
                    {/* 배경 이미지 */}
                    <img
                        src={`data:image/png;base64,${Buffer.from(bgImageData).toString('base64')}`}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '800px',
                            height: '400px',
                        }}
                    />
                    {/* 감사 문구 */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            zIndex: 1,
                            padding: '40px 50px',
                            marginTop: '130px',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '26px',
                                color: '#CCCCCC',
                                fontFamily: 'NanumMyeongjo',
                                margin: '0 0 6px 0',
                                lineHeight: 1.5,
                            }}
                        >
                            故 {deceasedName}님의 마지막 길을 함께해 주셔서
                        </p>
                        <p
                            style={{
                                fontSize: '26px',
                                color: '#CCCCCC',
                                fontFamily: 'NanumMyeongjo',
                                margin: 0,
                                lineHeight: 1.5,
                            }}
                        >
                            진심으로 감사드립니다.
                        </p>
                    </div>
                </div>
            ),
            {
                width: 800,
                height: 400,
                fonts: [
                    {
                        name: 'NanumMyeongjo',
                        data: fontData,
                        style: 'normal',
                        weight: 400,
                    },
                ],
            }
        );
    } catch (error) {
        console.error('OG Image Error:', error);
        return new Response('Error generating image', { status: 500 });
    }
}
