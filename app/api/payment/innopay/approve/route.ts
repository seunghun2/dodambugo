import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// INNOPAY 승인 API
export async function POST(request: NextRequest) {
    console.log('🔵 INNOPAY 승인 API 호출됨');

    try {
        const body = await request.json();
        const { paymentToken, tid, mid, amt, taxFreeAmt, moid, orderId } = body;

        console.log('📥 승인 요청 데이터:', { paymentToken: paymentToken?.substring(0, 20) + '...', tid, mid, amt, taxFreeAmt, moid, orderId });

        if (!paymentToken || !tid) {
            console.log('❌ 필수 파라미터 누락');
            return NextResponse.json(
                { success: false, error: '필수 결제 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // INNOPAY 승인 API 호출
        console.log('📤 INNOPAY API 호출 시작...');
        const approveResponse = await fetch('https://api.innopay.co.kr/v1/transactions/pay', {
            method: 'POST',
            headers: {
                'Payment-Token': paymentToken,
                'Merchant-Key': process.env.INNOPAY_LICENSE_KEY || '',
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                tid,
                mid: mid || process.env.INNOPAY_MID || 'pgmaeum01m',
                amt,
                taxFreeAmt: taxFreeAmt || '0',
                moid,
            }),
        });

        const approveResult = await approveResponse.json();
        console.log('📥 INNOPAY 승인 결과:', JSON.stringify(approveResult));

        // INNOPAY HTTP 에러 체크
        if (!approveResponse.ok) {
            console.log('❌ INNOPAY HTTP 에러:', approveResponse.status);
            return NextResponse.json(
                {
                    success: false,
                    error: approveResult.message || approveResult.resultMsg || '결제 승인 실패',
                    code: approveResult.code || approveResult.resultCode,
                    innopayResponse: approveResult,  // 전체 응답 포함
                },
                { status: 400 }
            );
        }

        // 승인 성공 체크 (INNOPAY 응답 형식에 따라 조정 필요)
        if (approveResult.resultCode !== '0000' && approveResult.resultCode !== '00') {
            return NextResponse.json(
                {
                    success: false,
                    error: approveResult.resultMsg || '결제 승인 실패',
                    code: approveResult.resultCode,
                    innopayResponse: approveResult,  // 전체 응답 포함
                },
                { status: 400 }
            );
        }

        // DB 업데이트 - 결제 완료 상태로 변경
        if (orderId) {
            const { error: updateError } = await supabase
                .from('flower_orders')
                .update({
                    payment_status: 'completed',
                    tid: tid,
                    approved_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (updateError) {
                console.error('주문 상태 업데이트 오류:', updateError);
            }
        }

        // Slack 알림 발송 (옵션)
        try {
            const slackWebhook = process.env.SLACK_WEBHOOK_URL;
            if (slackWebhook) {
                await fetch(slackWebhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `💐 화환 결제 완료!\n주문번호: ${moid}\n금액: ${Number(amt).toLocaleString()}원`,
                    }),
                });
            }
        } catch (slackError) {
            console.error('Slack 알림 오류:', slackError);
        }

        return NextResponse.json({
            success: true,
            message: '결제 승인 완료',
            data: {
                tid,
                moid,
                amt,
                approvedAt: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('결제 승인 처리 오류:', error);
        return NextResponse.json(
            { success: false, error: '결제 승인 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
