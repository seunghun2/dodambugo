import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';
import { sendFlowerOrderNotification, sendCondolenceNotification } from '@/lib/slack';

// Supabase 클라이언트
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// INNOPAY 카드사 코드 → 카드사명 매핑 (공식 문서 기준)
const CARD_ISSUER_MAP: Record<string, string> = {
    '01': '비씨카드', '02': '국민카드', '03': '하나카드', '04': '삼성카드',
    '06': '신한카드', '07': '현대카드', '08': '롯데카드', '11': '씨티카드',
    '12': '농협카드', '13': '수협카드', '14': '협동조합카드', '15': '우리카드',
    '16': '하나카드', '20': '농협카드', '21': '광주카드', '22': '전북카드',
    '23': '제주카드', '24': '산은카드', '25': 'VISA', '26': 'Master',
    '27': 'Diners', '28': 'AMX', '29': 'JCB', '30': '유니온페이',
};

// INNOPAY epayCl 코드 → 간편결제 서비스명 매핑
const EPAY_CL_MAP: Record<string, string> = {
    '01': '카카오페이',
    '02': '네이버페이',
    '03': 'SSG페이',
    '04': '엘페이',
    '05': '페이코',
    '06': '삼성페이',
    '07': '애플페이',
    '08': '토스페이',
    '09': 'KB페이',
};

// 간편결제 코드/키워드 → 서비스명 매핑 (fallback)
const EASY_PAY_MAP: Record<string, string> = {
    'KAKAO': '카카오페이', 'KAKAOPAY': '카카오페이',
    'NAVER': '네이버페이', 'NAVERPAY': '네이버페이',
    'SSG': 'SSG페이', 'SSGPAY': 'SSG페이',
    'LPAY': '엘페이', 'L.PAY': '엘페이',
    'PAYCO': '페이코',
    'SAMSUNG': '삼성페이', 'SAMSUNGPAY': '삼성페이',
    'APPLE': '애플페이', 'APPLEPAY': '애플페이',
    'TOSS': '토스페이', 'TOSSPAY': '토스페이',
    'CHAI': '차이',
    'KB': 'KB페이', 'KBPAY': 'KB페이',
};

/**
 * 카드사 코드를 이름으로 변환 (코드/이름 모두 대응)
 */
function resolveCardIssuer(value: string): string {
    if (!value) return '';
    // 코드값이면 매핑에서 찾기
    if (CARD_ISSUER_MAP[value]) return CARD_ISSUER_MAP[value];
    // 해외카드 브랜드는 그대로
    const foreignBrands = ['VISA', 'Master', 'JCB', 'AMX', 'Diners', '유니온페이'];
    if (foreignBrands.some(b => value.includes(b))) return value;
    // 이름에 '카드'가 없으면 추가 (예: "국민" → "국민카드")
    if (!value.includes('카드') && !value.includes('Card')) return value + '카드';
    return value;
}

/**
 * 간편결제 코드/키워드를 서비스명으로 변환
 */
function resolveEasyPayName(value: string): string {
    if (!value) return '';
    const upper = value.toUpperCase().replace(/\s/g, '');
    if (EASY_PAY_MAP[upper]) return EASY_PAY_MAP[upper];
    // 부분 매칭
    for (const [key, name] of Object.entries(EASY_PAY_MAP)) {
        if (upper.includes(key)) return name;
    }
    return value;
}

/**
 * INNOPAY 응답에서 상세 결제수단 문자열 추출
 * 예: "신용카드(국민카드)", "간편결제(카카오페이)", "가상계좌"
 */
function getDetailedPaymentMethod(payMethod: string, responseData: any): string {
    // 카드사 이름/코드 추출 (INNOPAY 실제 필드: card.fnName, card.fnCd, card.acquCardName)
    const rawCardIssuer = responseData?.card?.fnName
        || responseData?.card?.acquCardName
        || responseData?.card?.fnCd
        || responseData?.fnName
        || responseData?.fnNm
        || responseData?.fnCd
        || '';
    const cardIssuer = resolveCardIssuer(String(rawCardIssuer));

    // 간편결제 서비스명 추출 (INNOPAY 실제 필드: epay.epayCl)
    const epayCl = responseData?.epay?.epayCl || '';
    let easyPayName = EPAY_CL_MAP[epayCl] || '';
    // epayCl로 못찾으면 다른 필드 fallback
    if (!easyPayName) {
        const rawEasyPay = responseData?.epay?.name
            || responseData?.easyPayMethod
            || responseData?.easyPayName
            || '';
        easyPayName = resolveEasyPayName(String(rawEasyPay));
    }

    switch (payMethod) {
        case 'CARD':
            return cardIssuer ? `신용카드(${cardIssuer})` : '신용카드';
        case 'EPAY':
            if (easyPayName) return `간편결제(${easyPayName})`;
            if (cardIssuer) return `간편결제(${cardIssuer})`;
            return '간편결제';
        case 'VBANK':
            return '가상계좌';
        case 'BANK':
            return '계좌이체';
        default:
            return payMethod || '카드결제';
    }
}

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

        let approveResult: any;
        let isHttpOk = true;
        let httpStatus = 200;

        if (paymentToken === 'MOCK_TOKEN') {
            console.log('⚠️ [MOCK] Bypassing INNOPAY API call for testing');
            approveResult = {
                success: true,
                resultCode: '0000',
                data: {
                    tid: tid || 'MOCK_TID',
                    payMethod: payMethod || 'CARD',
                    receiptUrl: 'https://mock-receipt-url.com',
                    card: {
                        fnName: '비씨카드',
                        fnCd: '01'
                    },
                    etc: {
                        mallReserved: JSON.stringify({
                            orderId: orderId || moid,
                            bugoId: body.bugoNumber || ''
                        })
                    }
                }
            };
        } else {
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

            isHttpOk = approveResponse.ok;
            httpStatus = approveResponse.status;
            approveResult = await approveResponse.json();
            console.log('📥 INNOPAY 승인 결과:', JSON.stringify(approveResult));
        }

        // 상세 결제정보 필드 로깅 (카드사/간편결제 종류 확인용)
        if (approveResult.data) {
            console.log('🔍 INNOPAY data 키:', Object.keys(approveResult.data));
            console.log('🔍 결제상세:', JSON.stringify({
                payMethod: approveResult.data.payMethod,
                card: approveResult.data.card,
                epay: approveResult.data.epay,
            }));
        }

        // INNOPAY HTTP 에러 체크
        if (!isHttpOk) {
            console.log('❌ INNOPAY HTTP 에러:', httpStatus);
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

                // bugoId가 UUID 형태면 실제 bugo_number 조회
                if (bugoNumber && bugoNumber.includes('-') && bugoNumber.length > 10) {
                    try {
                        const { data: bugoData } = await supabase
                            .from('bugo')
                            .select('bugo_number')
                            .eq('id', bugoNumber)
                            .single();
                        if (bugoData?.bugo_number) {
                            console.log(`🔄 UUID → bugo_number 변환: ${bugoNumber} → ${bugoData.bugo_number}`);
                            bugoNumber = String(bugoData.bugo_number);
                        }
                    } catch (e) {
                        console.error('bugo_number 조회 실패:', e);
                    }
                }
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

                // 3단계: payment_method 저장 (상세 결제수단 포함)
                const actualPayMethod = approveResult.data?.payMethod || payMethod;
                if (actualPayMethod) {
                    try {
                        const detailedMethod = getDetailedPaymentMethod(actualPayMethod, approveResult.data);

                        await supabase
                            .from('flower_orders')
                            .update({ payment_method: detailedMethod })
                            .eq('id', actualOrderId);
                        console.log('✅ 결제수단 저장 성공:', detailedMethod);
                    } catch (pmError) {
                        console.error('결제수단 저장 실패 (무시):', pmError);
                    }
                }

                // bugo_number 별도 조회
                if (orderData.bugo_id) {
                    const { data: bugoData } = await supabase
                        .from('bugo')
                        .select('bugo_number, deceased_name, mourner_name, phone_password, mourners, address, b2b_user_id')
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
                const isB2B = !!orderData?.bugo?.b2b_user_id;
                await sendAlimtalk(
                    phoneNumber,
                    'KA01TP2601311316586435pxsJOWuWbz',  // 화환 결제완료 템플릿
                    {
                        '상품명': orderData.product_name || '',
                        '금액': ((Number(amt) || 0) + (Number(taxFreeAmt) || 0)).toLocaleString(),
                        '주문번호': orderData.order_number || moid,
                        '받는분': orderData.recipient_name || '',
                        '장례식장': `${orderData.funeral_home || ''} ${orderData.room || ''}`.trim(),
                        '부고번호': orderData.bugo?.bugo_number || orderData.bugo_id || '',
                    },
                    undefined,
                    isB2B
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
                    price: (Number(amt) || 0) + (Number(taxFreeAmt) || 0),
                    ribbon_text1: orderData.ribbon_text1,
                    ribbon_text2: orderData.ribbon_text2,
                    funeral_hall: orderData.funeral_home,
                    room: orderData.room,
                    address: orderData.address || orderData.bugo?.address || '',
                    payment_method: getDetailedPaymentMethod(approveResult.data?.payMethod || payMethod || 'CARD', approveResult.data),
                    chief_mourner_name: orderData.bugo?.mourner_name || '',
                    chief_mourner_phone: orderData.bugo?.phone_password || '',
                });
                console.log('✅ 슬랙 알림 발송 완료');
            } catch (err) {
                console.error('❌ 슬랙 알림 실패:', err);
            }
        }

        // =============================================
        // [B2B] 화환 판매 시 파트너 예치금 자동 적립
        // =============================================
        if (orderData?.bugo_id) {
            try {
                // 1. 이 부고에 연결된 B2B 파트너 조회
                const { data: bugoRecord } = await supabase
                    .from('bugo')
                    .select('b2b_user_id')
                    .eq('id', orderData.bugo_id)
                    .single();

                if (bugoRecord?.b2b_user_id) {
                    const partnerId = bugoRecord.b2b_user_id;

                    // 2. 적립금액 설정 조회
                    const { data: rewardSetting } = await supabase
                        .from('b2b_settings')
                        .select('value')
                        .eq('key', 'wreath_reward_amount')
                        .single();
                    const rewardAmount = parseInt(rewardSetting?.value || '20000');

                    // 3. 파트너 예치금 적립 (직접 잔액 업데이트)
                    const { data: currentDeposit } = await supabase
                        .from('deposits')
                        .select('balance')
                        .eq('user_id', partnerId)
                        .single();

                    if (currentDeposit) {
                        await supabase
                            .from('deposits')
                            .update({
                                balance: (currentDeposit.balance || 0) + rewardAmount,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('user_id', partnerId);
                    } else {
                        await supabase
                            .from('deposits')
                            .insert({
                                user_id: partnerId,
                                balance: rewardAmount,
                                updated_at: new Date().toISOString(),
                            });
                    }

                    // 4. 적립 내역 기록
                    await supabase
                        .from('deposit_transactions')
                        .insert({
                            user_id: partnerId,
                            amount: rewardAmount,
                            type: 'wreath_reward',
                            description: `화환 판매 적립 (${orderData.product_name || '화환'})`,
                            related_order_id: actualOrderId || moid,
                        });

                    console.log(`✅ [B2B] 파트너 ${partnerId}에게 ${rewardAmount}원 적립 완료`);

                    // 4-2. 상조회사 본사 수수료 정산 내역 추가
                    try {
                        const { data: partnerUser } = await supabase
                            .from('b2b_users')
                            .select('company_id')
                            .eq('id', partnerId)
                            .single();

                        if (partnerUser?.company_id) {
                            const { data: companyRecord } = await supabase
                                .from('b2b_companies')
                                .select('wreath_commission_amount')
                                .eq('id', partnerUser.company_id)
                                .single();

                            const companyCommission = companyRecord?.wreath_commission_amount !== undefined 
                                ? companyRecord.wreath_commission_amount 
                                : 5000;

                            await supabase.from('b2b_company_settlements').insert({
                                company_id: partnerUser.company_id,
                                order_id: actualOrderId || moid,
                                amount: companyCommission,
                                status: 'pending'
                            });

                            console.log(`✅ [B2B] 상조회사 본사 ${partnerUser.company_id}에 ${companyCommission}원 정산 내역 추가 완료`);
                        }
                    } catch (companyErr) {
                        console.error('❌ [B2B] 상조회사 본사 정산 적재 중 오류:', companyErr);
                    }

                    // 인앱 알람: 화환 주문 + 수당 적립 (비동기)
                    import('@/lib/partner-notification').then(({ insertInAppAlarm }) => {
                        // 화환 주문 알람
                        insertInAppAlarm(
                            partnerId, 'flower_order',
                            '화환 주문이 접수되었습니다',
                            `${orderData.product_name || '화환'} | 주문자: ${orderData.sender_name || ''}`,
                            '/b2b/wallet', 'alarm_order'
                        );
                        // 화환 수당 적립 알람
                        insertInAppAlarm(
                            partnerId, 'flower_commission',
                            '화환 판매 수당이 적립되었습니다',
                            `${(rewardAmount || 0).toLocaleString()}원 적립 (${orderData.product_name || '화환'})`,
                            '/b2b/wallet', 'alarm_reward'
                        );
                    });

                    // 5. 추천인 보너스 적립
                    const { data: partnerInfo } = await supabase
                        .from('b2b_users')
                        .select('recommender_id')
                        .eq('id', partnerId)
                        .single();

                    if (partnerInfo?.recommender_id) {
                        const { data: bonusSetting } = await supabase
                            .from('b2b_settings')
                            .select('value')
                            .eq('key', 'referral_bonus_amount')
                            .single();
                        const bonusAmount = parseInt(bonusSetting?.value || '2000');

                        // 추천인 잔액 업데이트
                        const { data: refDeposit } = await supabase
                            .from('deposits')
                            .select('balance')
                            .eq('user_id', partnerInfo.recommender_id)
                            .single();

                        if (refDeposit) {
                            await supabase
                                .from('deposits')
                                .update({
                                    balance: (refDeposit.balance || 0) + bonusAmount,
                                    updated_at: new Date().toISOString(),
                                })
                                .eq('user_id', partnerInfo.recommender_id);
                        } else {
                            await supabase
                                .from('deposits')
                                .insert({
                                    user_id: partnerInfo.recommender_id,
                                    balance: bonusAmount,
                                    updated_at: new Date().toISOString(),
                                });
                        }

                        // 추천인 내역 기록
                        await supabase
                            .from('deposit_transactions')
                            .insert({
                                user_id: partnerInfo.recommender_id,
                                amount: bonusAmount,
                                type: 'referral_bonus',
                                description: `추천 수당 (추천한 파트너의 화환 판매)`,
                                related_order_id: actualOrderId || moid,
                            });

                        console.log(`✅ [B2B] 추천인 ${partnerInfo.recommender_id}에게 ${bonusAmount}원 보너스 적립`);
                    }
                }
            } catch (b2bError) {
                // B2B 적립 실패해도 결제 자체는 정상 처리
                console.error('❌ [B2B] 예치금 적립 오류 (결제는 정상):', b2bError);
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
                const totalAmount = (Number(amt) || 0) + (Number(taxFreeAmt) || 0) || condolenceInfo.totalAmount || 0;  // 복합과세: 실제 결제액 = amt(과세) + taxFreeAmt(비과세)
                const fee = totalAmount - selectedAmount;

                // 부고 정보 조회
                let bugoData: any = null;
                const condBugoId = condolenceInfo.bugoId || bugoNumber;
                if (condBugoId) {
                    // bugo_number(숫자) 또는 id(UUID) 둘 다 시도
                    const isNumeric = /^\d+$/.test(condBugoId);
                    const { data, error: bugoError } = await supabase
                        .from('bugo')
                        .select('bugo_number, deceased_name, mourner_name, funeral_home, phone_password, applicant_phone, mourners, b2b_user_id')
                        .eq(isNumeric ? 'bugo_number' : 'id', condBugoId)
                        .is('deleted_at', null)
                        .single();
                    bugoData = data;
                    console.log('📋 bugoData 조회 결과:', {
                        condBugoId,
                        isNumeric,
                        queryValue: isNumeric ? Number(condBugoId) : condBugoId,
                        found: !!data,
                        error: bugoError?.message,
                        mourner_name: data?.mourner_name,
                        applicant_phone: data?.applicant_phone,
                        phone_password: data?.phone_password,
                        mourners: data?.mourners,
                    });
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
                        payment_method: getDetailedPaymentMethod(approveResult.data?.payMethod || payMethod || 'CARD', approveResult.data),
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

                    // =============================================
                    // [B2B] 조의금 결제 시 파트너 예치금 자동 적립
                    // =============================================
                    if (bugoData?.b2b_user_id && fee > 0) {
                        try {
                            const partnerId = bugoData.b2b_user_id;

                            // 파트너 예치금 조회
                            const { data: currentDeposit } = await supabase
                                .from('deposits')
                                .select('balance')
                                .eq('user_id', partnerId)
                                .single();

                            if (currentDeposit) {
                                await supabase
                                    .from('deposits')
                                    .update({
                                        balance: (currentDeposit.balance || 0) + fee,
                                        updated_at: new Date().toISOString(),
                                    })
                                    .eq('user_id', partnerId);
                            } else {
                                // 예치금 테이블에 없으면 새로 생성
                                await supabase
                                    .from('deposits')
                                    .insert({
                                        user_id: partnerId,
                                        balance: fee,
                                        updated_at: new Date().toISOString(),
                                    });
                            }

                            // 적립 내역 기록
                            await supabase
                                .from('deposit_transactions')
                                .insert({
                                    user_id: partnerId,
                                    amount: fee,
                                    type: 'condolence_reward',
                                    description: `조의금 수당 적립 (${buyerInfo.name || '조문객'})`,
                                    related_order_id: condolenceOrderNumber || moid,
                                });

                            console.log(`✅ [B2B] 파트너 ${partnerId}에게 조의금 수당 ${fee}원 적립 완료`);
                        } catch (b2bCondolenceError) {
                            console.error('❌ [B2B] 조의금 예치금 적립 오류 (결제는 정상):', b2bCondolenceError);
                        }
                    }
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
                        payment_method: getDetailedPaymentMethod(approveResult.data?.payMethod || payMethod || 'CARD', approveResult.data),
                        funeral_home: bugoData?.funeral_home || '',
                        bank_name: condolenceInfo.bankName || '',
                        account_no: condolenceInfo.accountNo || '',
                    });
                    console.log('✅ 부의금 슬랙 알림 발송 완료');
                } catch (slackErr) {
                    console.error('❌ 부의금 슬랙 알림 실패:', slackErr);
                }

                // 📱 부의금 결제완료 알림톡 (조문객에게 발송)
                if (buyerInfo.tel) {
                    try {
                        const buyerPhone = (buyerInfo.tel || '').replace(/-/g, '');
                        const isB2B = !!bugoData?.b2b_user_id;
                        await sendAlimtalk(
                            buyerPhone,
                            'KA01TP260213055510356BnS8IHlKvWB',  // 부의금 결제완료 템플릿
                            {
                                '부의금액': (selectedAmount || 0).toLocaleString(),
                                '결제금액': (totalAmount || 0).toLocaleString(),
                                '상주명': condolenceInfo.accountHolder || bugoData?.mourner_name || '',
                                '주문번호': condolenceOrderNumber || moid,
                            },
                            undefined,
                            isB2B
                        );
                        console.log('✅ 부의금 결제완료 알림톡 발송:', buyerPhone);
                    } catch (alimErr) {
                        console.error('❌ 부의금 결제완료 알림톡 실패:', alimErr);
                    }
                }

                // 💸 상주 계좌로 즉시 송금 (서버에서 직접 처리 - 외부 API 호출 없이 이노페이 프록시로 직접)
                // ✅ 이노페이 IP 등록 완료 (2026-02-13) - 프록시 서버 49.50.139.204 경유
                if (condolenceInfo.bankName && condolenceInfo.accountNo && selectedAmount > 0) {
                    try {
                        console.log('📤 부의금 송금 시작 (서버 직접):', {
                            bankName: condolenceInfo.bankName,
                            accountNo: condolenceInfo.accountNo,
                            accountHolder: condolenceInfo.accountHolder,
                            amount: selectedAmount,
                        });

                        // 은행코드 매핑
                        const BANK_CODE_MAP: Record<string, string> = {
                            'KB국민': '004', '국민': '004', '국민은행': '004',
                            '신한': '088', '신한은행': '088', '우리': '020', '우리은행': '020',
                            '하나': '081', '하나은행': '081', 'NH농협': '011', '농협': '011', '농협은행': '011',
                            'IBK기업': '003', '기업': '003', '기업은행': '003',
                            'SC제일': '023', '제일은행': '023',
                            '케이뱅크': '089', '카카오뱅크': '090', '카카오': '090',
                            '토스뱅크': '092', '토스': '092',
                            '새마을금고': '045', '새마을': '045', '우체국': '071',
                            '부산': '032', '부산은행': '032', '대구': '031', '대구은행': '031',
                            '경남': '039', '경남은행': '039', '수협': '007', '수협은행': '007',
                            '신협': '048', '신협은행': '048',
                        };
                        const getBankCode = (name: string) => {
                            if (BANK_CODE_MAP[name]) return BANK_CODE_MAP[name];
                            for (const key in BANK_CODE_MAP) { if (name.includes(key) || key.includes(name)) return BANK_CODE_MAP[key]; }
                            return null;
                        };

                        const bankCode = getBankCode(condolenceInfo.bankName);
                        if (!bankCode) {
                            console.error('❌ 지원하지 않는 은행:', condolenceInfo.bankName);
                        } else {
                            const cleanAccNo = (condolenceInfo.accountNo || '').replace(/-/g, '');
                            const txMoid = `CONDTX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            const now2 = new Date();
                            const reqDt = now2.getFullYear().toString() +
                                String(now2.getMonth() + 1).padStart(2, '0') +
                                String(now2.getDate()).padStart(2, '0') +
                                String(now2.getHours()).padStart(2, '0') +
                                String(now2.getMinutes()).padStart(2, '0') +
                                String(now2.getSeconds()).padStart(2, '0');

                            const transferRes = await fetch('http://49.50.139.204/proxy/transfer', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    mid: 'bumaeum02m',
                                    merkey: '7bYbeddYcp6/zom99bje/iNEqLO3HFx2wcWGFgKeSCg95b8kRx9IcQtx3aoL3C6BufEXAD/V7bd6INig0ge0Zw==',
                                    moid: txMoid,
                                    req_dt: reqDt,
                                    bankCode: bankCode,
                                    acntNo: cleanAccNo,
                                    acntNm: condolenceInfo.accountHolder,
                                    amt: String(selectedAmount),
                                    depAcntNo: '66400001397152',
                                    depAcntNm: buyerInfo.name || '마음부고',
                                }),
                            });

                            const transferResult = await transferRes.json();
                            console.log('📥 송금 결과:', transferResult);

                            if (transferResult.resultCode === '0000') {
                                console.log('✅ 부의금 송금 성공! TID:', transferResult.tid);
                                if (condolenceOrderNumber) {
                                    await supabase
                                        .from('condolence_orders')
                                        .update({ status: 'transferred', settled_at: new Date().toISOString() })
                                        .eq('order_number', condolenceOrderNumber);
                                }

                                // 📱 [B2B] 파트너에게 "조의금 수당 적립 및 상주 이체 완료" 문자 알림 발송
                                if (bugoData?.b2b_user_id) {
                                    try {
                                        const { data: partnerUser } = await supabase
                                            .from('b2b_users')
                                            .select('phone, company_name, owner_name')
                                            .eq('id', bugoData.b2b_user_id)
                                            .single();

                                        if (partnerUser?.phone) {
                                            const partnerPhone = partnerUser.phone.replace(/-/g, '');
                                            const { sendLMS } = await import('@/lib/solapi');
                                            
                                            const partnerMsg = `[부고온] 조의금 수당 적립 및 이체 완료 안내

안녕하세요, ${partnerUser.company_name} ${partnerUser.owner_name} 파트너님.
개설하신 부고에서 조의금 이체 및 수당 적립이 완료되었습니다.

■ 고인명: 故 ${bugoData.deceased_name || ''}
■ 조문객: ${buyerInfo.name || ''}
■ 이체금액: ${(selectedAmount || 0).toLocaleString()}원
■ 파트너 수당: ${(fee || 0).toLocaleString()}원 적립 완료

적립 현황은 파트너 앱에서 확인 가능합니다.
■ 파트너 정산: https://bugoon.co.kr/b2b/wallet`;

                                            await sendLMS(partnerPhone, '[부고온] 조의금 수당 적립 안내', partnerMsg);
                                            console.log(`📱 [B2B] 파트너 조의금 수당 적립 문자 발송 완료: ${partnerPhone}`);
                                        }
                                    } catch (partnerSmsErr) {
                                        console.error('❌ [B2B] 파트너 조의금 알림 발송 실패:', partnerSmsErr);
                                    }
                                }


                                // 📱 상주에게 "부의금 전달 완료" 알림톡 발송
                                try {
                                    // 계좌 수신 상주에게만 알림 (전화번호 없으면 미발송)
                                    let mournerPhone = '';
                                    const recipientName = condolenceInfo.accountHolder || '';

                                    // 1. mourners 배열에서 계좌 수신자명 매칭
                                    if (bugoData?.mourners && Array.isArray(bugoData.mourners)) {
                                        const matched = bugoData.mourners.find(
                                            (m: any) => m.name === recipientName && m.contact
                                        );
                                        if (matched) {
                                            mournerPhone = matched.contact;
                                        }
                                    }
                                    // 2. 대표상주 본인 계좌면 대표상주 번호 사용
                                    if (!mournerPhone && recipientName === bugoData?.mourner_name) {
                                        mournerPhone = bugoData?.applicant_phone || bugoData?.phone_password || '';
                                    }

                                    if (mournerPhone) {
                                        const cleanPhone = mournerPhone.replace(/-/g, '');
                                        const isB2B = !!bugoData?.b2b_user_id;
                                        await sendAlimtalk(
                                            cleanPhone,
                                            'KA01TP260213060236557haj4AEvPgIn',  // 부의금 전달 완료 (상주용)
                                            {
                                                '수신자명': recipientName,
                                                '보내는분': buyerInfo.name || '',
                                                '부의금액': (selectedAmount || 0).toLocaleString(),
                                                '은행명': condolenceInfo.bankName || '',
                                                '계좌번호': condolenceInfo.accountNo || '',
                                            },
                                            undefined,
                                            isB2B
                                        );
                                        console.log('✅ 상주 부의금 입금 알림톡 발송:', cleanPhone);
                                    } else {
                                        console.warn('⚠️ 상주 연락처를 찾을 수 없어 알림톡 미발송');
                                    }
                                } catch (mournerAlimErr) {
                                    console.error('❌ 상주 부의금 입금 알림톡 실패:', mournerAlimErr);
                                }
                            } else {
                                console.error('❌ 부의금 송금 실패:', transferResult);
                            }
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
