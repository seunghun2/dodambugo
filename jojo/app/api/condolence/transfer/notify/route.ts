import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 이노페이 송금(입금이체) 결과 통보 + 입금 불능 결과 통보 수신 웹훅
// 2.6 송금 결과 통보: 이노페이PG서버 → 가맹점 (resultCode: 0000)
// 2.7 송금 결과 통보 응답: 가맹점 → 이노페이PG서버
// 2.8 입금 불능 결과 통보: 이노페이PG서버 → 가맹점 (resultCode: 2000)
// 2.9 입금 불능 결과 통보 응답: 가맹점 → 이노페이PG서버
// "0000" 이외 응답 시 약 1분 후 재전송됨 (중요)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('📥 송금 결과 통보 수신:', JSON.stringify(body, null, 2));

        const {
            mid,
            tid,
            moid,
            reqDt,
            bankCode,
            acntNo,
            acntNm,
            amt,
            remainAmt,
            depAcntNo,
            depAcntNm,
            resultCode,
            resultMsg,
            transDt,
        } = body;

        if (resultCode === '0000') {
            // 2.6 송금 성공 통보
            console.log('✅ 송금 성공 통보:', {
                tid, moid, amount: amt,
                recipient: acntNm,
                remainBalance: remainAmt,
                transferDate: transDt,
            });

            // DB 업데이트 - 송금 완료
            if (moid) {
                const rawMoid = moid.replace('CONDTX_', '').replace('BCTX_', '');
                const { error } = await supabase
                    .from('condolence_orders')
                    .update({
                        status: 'transferred',
                        settled_at: new Date().toISOString(),
                    })
                    .or(`order_number.eq.${moid},order_number.like.%${rawMoid}%,moid.like.%${rawMoid}%`);

                if (error) {
                    console.error('❌ DB 업데이트 오류:', error);
                } else {
                    console.log('✅ DB 송금 상태 업데이트 완료');
                }
            }
        } else if (resultCode === '2000') {
            // 2.8 입금 불능 결과 통보
            // 타행 이체 시 입금 대상 은행에서 정상 응답 송신 후 오류 발생 시
            // 산업, 기업, 수협, 농협, 우리, SC제일, 씨티, 대구, 부산, 경남, 신한 등
            console.error('⚠️ 입금 불능 통보:', {
                tid, moid, resultMsg,
                bankCode, acntNo, acntNm, amt,
                remainBalance: remainAmt,
            });

            // DB 업데이트 - 입금 불능
            if (moid) {
                const rawMoid = moid.replace('CONDTX_', '').replace('BCTX_', '');
                const { error } = await supabase
                    .from('condolence_orders')
                    .update({
                        status: 'transfer_failed',
                    })
                    .or(`order_number.eq.${moid},order_number.like.%${rawMoid}%,moid.like.%${rawMoid}%`);

                if (error) {
                    console.error('❌ DB 업데이트 오류:', error);
                }
            }

            // TODO: 슬랙 알림으로 입금 불능 통보
        } else {
            console.error('❌ 송금 실패 통보:', {
                tid, moid, resultCode, resultMsg,
            });
        }

        // 2.7 / 2.9 결과 통보 응답 - 반드시 mid, tid, resultCode 포함
        // "0000" 이외 코드 응답 시 이노페이가 약 1분 후 재전송
        return NextResponse.json({
            mid: mid,
            tid: tid,
            resultCode: '0000',
        });
    } catch (error: any) {
        console.error('❌ 결과 통보 처리 오류:', error);
        return NextResponse.json({
            mid: '',
            tid: '',
            resultCode: '9999',
        });
    }
}
