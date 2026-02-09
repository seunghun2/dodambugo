import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';
import { sendFlowerOrderNotification, sendCondolenceNotification } from '@/lib/slack';

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
        const { paymentToken, tid, mid, amt, taxFreeAmt, moid, orderId, payMethod } = body;

        console.log('📥 승인 요청 데이터:', { paymentToken: paymentToken?.substring(0, 20) + '...', tid, mid, amt, taxFreeAmt, moid, orderId, payMethod });

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

        // 승인 성공 체크 - INNOPAY는 success 필드 사용
        // 성공: {success: true, data: {...}}
        // 실패: {success: false, error: {...}} 또는 {resultCode: 'XXXX', resultMsg: '...'}
        const isSuccess = approveResult.success === true ||
            approveResult.resultCode === '0000' ||
            approveResult.resultCode === '00';

        if (!isSuccess) {
            const errorInfo = approveResult.error || {};
            return NextResponse.json(
                {
                    success: false,
                    error: errorInfo.message || approveResult.resultMsg || '결제 승인 실패',
                    code: errorInfo.code || approveResult.resultCode,
                    innopayResponse: approveResult,
                },
                { status: 400 }
            );
        }

        console.log('✅ INNOPAY 승인 성공!');

        // INNOPAY 응답에서 영수증 URL 추출
        const receiptUrl = approveResult.data?.receiptUrl || '';

        // mallReserved에서 orderId, bugoId 추출 (INNOPAY 응답에서 가져옴)
        let actualOrderId = '';
        let bugoNumber = '';
        try {
            const mallReserved = approveResult.data?.etc?.mallReserved;
            if (mallReserved) {
                const parsed = JSON.parse(mallReserved);
                actualOrderId = parsed.orderId || '';
                bugoNumber = parsed.bugoId || '';
                console.log('📦 mallReserved 추출:', { orderId: actualOrderId, bugoNumber });
            }
        } catch (e) {
            console.error('mallReserved 파싱 오류:', e);
        }

        // DB 업데이트 - 결제 완료 상태로 변경
        let orderData: any = null;
        // TID: INNOPAY 응답에서 가져오거나, 없으면 콜백에서 받은 원래 tid 사용
        const transactionId = approveResult.data?.tid || tid || '';

        if (actualOrderId) {
            // 1단계: status 먼저 업데이트 (확실히 작동)
            const { data: updatedOrder, error: updateError } = await supabase
                .from('flower_orders')
                .update({ status: 'completed' })
                .eq('id', actualOrderId)
                .select('*')
                .single();

            if (updateError) {
                console.error('주문 상태 업데이트 오류:', updateError);
            } else {
                orderData = updatedOrder;

                // 2단계: tid 별도 업데이트 (실패해도 OK)
                try {
                    await supabase
                        .from('flower_orders')
                        .update({ tid: transactionId })
                        .eq('id', actualOrderId);
                    console.log('✅ TID 저장 성공:', transactionId);
                } catch (tidError) {
                    console.error('TID 저장 실패 (무시):', tidError);
                }

                // 3단계: payment_method 저장 (INNOPAY에서 온 실제 결제수단)
                if (payMethod) {
                    try {
                        // INNOPAY payMethod를 DB 형식으로 변환
                        const paymentMethodMap: Record<string, string> = {
                            'CARD': 'card',
                            'EPAY': 'easy',
                            'VBANK': 'virtual',
                            'BANK': 'bank',
                        };
                        const dbPaymentMethod = paymentMethodMap[payMethod] || payMethod.toLowerCase();

                        await supabase
                            .from('flower_orders')
                            .update({ payment_method: dbPaymentMethod })
                            .eq('id', actualOrderId);
                        console.log('✅ 결제수단 저장 성공:', dbPaymentMethod);
                    } catch (pmError) {
                        console.error('결제수단 저장 실패 (무시):', pmError);
                    }
                }

                // bugo_number 별도 조회
                if (orderData.bugo_id) {
                    const { data: bugoData } = await supabase
                        .from('bugo')
                        .select('bugo_number, deceased_name, mourner_name, phone_password, mourners, address')
                        .eq('id', orderData.bugo_id)
                        .single();

                    if (bugoData) {
                        orderData.bugo = bugoData;

                        // mourners 배열에서 수신자 연락처 매칭
                        if (bugoData.mourners && Array.isArray(bugoData.mourners)) {
                            const matched = bugoData.mourners.find(
                                (m: any) => m.name === orderData.recipient_name && m.contact
                            );
                            if (matched) {
                                orderData.recipient_phone = matched.contact;
                            }
                        }
                    }
                }
            }
        }

        // 📱 알림톡 발송 (결제 완료)
        console.log('📱 알림톡 발송 체크:', {
            hasOrderData: !!orderData,
            senderPhone: orderData?.sender_phone,
            actualOrderId
        });

        if (orderData?.sender_phone) {
            const phoneNumber = orderData.sender_phone.replace(/-/g, '');
            try {
                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP2601311316586435pxsJOWuWbz',  // 화환 결제완료 템플릿
                    {
                        '상품명': orderData.product_name || '',
                        '금액': Number(amt).toLocaleString(),
                        '주문번호': orderData.order_number || moid,
                        '받는분': orderData.recipient_name || '',
                        '장례식장': `${orderData.funeral_home || ''} ${orderData.room || ''}`.trim(),
                        '부고번호': orderData.bugo?.bugo_number || orderData.bugo_id || '',
                    }
                );
                console.log('✅ 화환 결제완료 알림톡 발송:', phoneNumber);
            } catch (err) {
                console.error('❌ 화환 결제완료 알림톡 실패:', err);
            }
        }

        // 🔔 슬랙 알림 발송
        if (orderData) {
            try {
                await sendFlowerOrderNotification({
                    id: orderData.order_number || moid,
                    bugo_number: bugoNumber || orderData.bugo?.bugo_number || '',
                    deceased_name: orderData.bugo?.deceased_name || orderData.recipient_name || '',
                    sender_name: orderData.sender_name,
                    sender_phone: orderData.sender_phone,
                    recipient_name: orderData.recipient_name,
                    recipient_phone: orderData.recipient_phone || '',
                    product_name: orderData.product_name,
                    price: Number(amt),
                    ribbon_text1: orderData.ribbon_text1,
                    ribbon_text2: orderData.ribbon_text2,
                    funeral_hall: orderData.funeral_home,
                    room: orderData.room,
                    address: orderData.address || orderData.bugo?.address || '',
                    payment_method: 'card',
                    chief_mourner_name: orderData.bugo?.mourner_name || '',
                    chief_mourner_phone: orderData.bugo?.phone_password || '',
                });
                console.log('✅ 슬랙 알림 발송 완료');
            } catch (err) {
                console.error('❌ 슬랙 알림 실패:', err);
            }
        }

        // 💰 부의금 결제인 경우 - condolence_orders 테이블에 저장 + 슬랙 알림
        let condolenceOrderNumber = '';
        if (moid && moid.startsWith('COND_')) {
            try {
                // mallReserved에서 부의금 정보 추출
                const mallReservedData = approveResult.data?.etc?.mallReserved;
                let condolenceInfo: any = {};
                if (mallReservedData) {
                    try {
                        const decoded = decodeURIComponent(mallReservedData);
                        condolenceInfo = JSON.parse(decoded);
                        console.log('✅ condolenceInfo 파싱 성공:', condolenceInfo);
                    } catch (e) {
                        // decodeURIComponent 없이 직접 파싱 시도
                        try {
                            condolenceInfo = JSON.parse(mallReservedData);
                            console.log('✅ condolenceInfo 직접 파싱 성공:', condolenceInfo);
                        } catch (e2) {
                            console.error('❌ condolence mallReserved 파싱 오류:', e2);
                        }
                    }
                }

                const buyerInfo = approveResult.data?.buyer || {};
                const selectedAmount = condolenceInfo.selectedAmount || 0;
                const totalAmount = Number(amt) || condolenceInfo.totalAmount || 0;
                const fee = totalAmount - selectedAmount;

                // 부고 정보 조회
                let bugoData: any = null;
                const condBugoId = condolenceInfo.bugoId || bugoNumber;
                if (condBugoId) {
                    const { data } = await supabase
                        .from('bugo')
                        .select('bugo_number, deceased_name, mourner_name, funeral_home_name')
                        .eq('id', condBugoId)
                        .single();
                    bugoData = data;
                }

                // condolence_orders 테이블에 저장
                const { data: insertedOrder, error: insertError } = await supabase
                    .from('condolence_orders')
                    .insert({
                        bugo_number: condBugoId || '',
                        buyer_name: buyerInfo.name || '',
                        buyer_phone: buyerInfo.tel || '',
                        recipient_name: condolenceInfo.accountHolder || '',
                        amount: selectedAmount,
                        fee: fee,
                        total_amount: totalAmount,
                        payment_method: approveResult.data?.payMethod || 'CARD',
                        payment_type: 'card',
                        status: 'completed',
                        tid: transactionId,
                        moid: moid,
                        bank_name: condolenceInfo.bankName || '',
                        account_no: condolenceInfo.accountNo || '',
                        receipt_url: receiptUrl,
                    })
                    .select('id, order_number')
                    .single();

                if (insertError) {
                    console.error('❌ 부의금 주문 DB 저장 오류:', insertError);
                } else {
                    condolenceOrderNumber = insertedOrder?.order_number || String(insertedOrder?.id);
                    console.log('✅ 부의금 주문 DB 저장 성공:', condolenceOrderNumber);
                }

                // 🔔 부의금 슬랙 알림
                try {
                    await sendCondolenceNotification({
                        order_number: condolenceOrderNumber || moid,
                        bugo_number: condBugoId || '',
                        deceased_name: bugoData?.deceased_name || '',
                        buyer_name: buyerInfo.name || '',
                        buyer_phone: buyerInfo.tel || '',
                        recipient_name: condolenceInfo.accountHolder || buyerInfo.name || '',
                        amount: selectedAmount,
                        fee: fee,
                        total_amount: totalAmount,
                        payment_method: approveResult.data?.payMethod === 'EPAY' ? '간편결제' : '신용카드(개인)',
                        funeral_home: bugoData?.funeral_home_name || '',
                        bank_name: condolenceInfo.bankName || '',
                        account_no: condolenceInfo.accountNo || '',
                    });
                    console.log('✅ 부의금 슬랙 알림 발송 완료');
                } catch (slackErr) {
                    console.error('❌ 부의금 슬랙 알림 실패:', slackErr);
                }

                // 💸 상주 계좌로 즉시 송금 (서버에서 직접 처리)
                if (condolenceInfo.bankName && condolenceInfo.accountNo && selectedAmount > 0) {
                    try {
                        console.log('📤 부의금 송금 시작 (서버):', {
                            bankName: condolenceInfo.bankName,
                            accountNo: condolenceInfo.accountNo,
                            accountHolder: condolenceInfo.accountHolder,
                            amount: selectedAmount,
                        });

                        const transferUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://maeumbugo.co.kr'}/api/condolence/transfer`;
                        const transferRes = await fetch(transferUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                bankName: condolenceInfo.bankName,
                                accountNo: condolenceInfo.accountNo,
                                accountHolder: condolenceInfo.accountHolder,
                                amount: selectedAmount,
                                buyerName: buyerInfo.name || '',
                                bugoId: condBugoId || '',
                            }),
                        });

                        const transferResult = await transferRes.json();
                        console.log('📥 송금 결과:', transferResult);

                        if (transferResult.success) {
                            console.log('✅ 부의금 송금 성공! TID:', transferResult.data?.tid);
                            // DB에 송금 상태 업데이트
                            if (condolenceOrderNumber) {
                                await supabase
                                    .from('condolence_orders')
                                    .update({ status: 'transferred', settled_at: new Date().toISOString() })
                                    .eq('order_number', condolenceOrderNumber);
                            }
                        } else {
                            console.error('❌ 부의금 송금 실패:', transferResult.error);
                        }
                    } catch (transferErr) {
                        console.error('❌ 부의금 송금 API 오류:', transferErr);
                    }
                } else {
                    console.warn('⚠️ 송금 정보 부족 - bankName:', condolenceInfo.bankName, 'accountNo:', condolenceInfo.accountNo, 'amount:', selectedAmount);
                }
            } catch (condolenceErr) {
                console.error('❌ 부의금 처리 오류:', condolenceErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: '결제 승인 완료',
            data: {
                ...approveResult.data,  // INNOPAY 원본 데이터 (먼저 spread)
                tid,
                moid,
                amt,
                receiptUrl,
                orderNumber: condolenceOrderNumber || orderData?.order_number || moid,
                paymentType: moid?.startsWith('COND_') ? 'condolence' : 'flower',
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
