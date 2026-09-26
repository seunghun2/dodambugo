import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAlimtalk } from '@/lib/solapi';
import { sendFlowerOrderNotification } from '@/lib/slack';
import { normalizeCompanyData } from '@/lib/b2b-company';

// Supabase 클라이언트
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// INNOPAY 가상계좌 입금 웹훅
export async function POST(request: NextRequest) {
    console.log('🔔 INNOPAY 가상계좌 웹훅 수신');

    try {
        const body = await request.json();
        console.log('📥 웹훅 데이터:', JSON.stringify(body));

        // INNOPAY 가상계좌 입금 통보 파라미터
        const {
            mid,
            tid,
            moid,      // 주문번호
            amt,       // 입금액
            status,    // 입금상태 (0: 입금완료)
            bankCode,  // 은행코드
            accountNo, // 계좌번호
            depositName, // 입금자명
            mallReserved, // 가맹점 예약 필드 (orderId 포함)
        } = body;

        // 입금 완료 상태가 아니면 무시
        if (status !== '0' && status !== 0) {
            console.log('⏳ 입금 완료 아님, 상태:', status);
            return NextResponse.json({ success: true, message: '대기 상태' });
        }

        // mallReserved에서 orderId 추출
        let orderId = '';
        try {
            if (mallReserved) {
                const parsed = JSON.parse(mallReserved);
                orderId = parsed.orderId || '';
            }
        } catch (e) {
            console.error('mallReserved 파싱 오류:', e);
        }

        // orderId가 누락된 경우 moid(주문번호)로 조회 폴백
        if (!orderId && moid) {
            const { data: matchedOrder } = await supabase
                .from('flower_orders')
                .select('id')
                .eq('order_number', moid)
                .maybeSingle();
            if (matchedOrder?.id) {
                orderId = matchedOrder.id;
            }
        }

        console.log('📦 orderId:', orderId, 'moid:', moid);

        // DB 업데이트 - 입금 완료 상태로 변경
        let orderData: any = null;
        if (orderId) {
            // 🛡️ 1. 가상계좌 중복 웹훅 처리 방지 (이미 입금 완료된 주문이면 중복 수당 적립/알림 원천 차단)
            const { data: existingOrder } = await supabase
                .from('flower_orders')
                .select('id, status, order_number')
                .eq('id', orderId)
                .maybeSingle();

            if (existingOrder?.status === 'completed') {
                console.log(`ℹ️ [B2B-Webhook] 이미 입금 처리 완료된 주문 (중복 웹훅 차단): ${orderId}`);
                return NextResponse.json({ success: true, message: '이미 입금 완료된 주문입니다.' });
            }

            if (existingOrder?.status === 'cancelled') {
                console.warn(`⚠️ [B2B-Webhook] 취소된 주문에 입금 웹훅 인입 (부활 및 오발주 차단): ${orderId}`);
                return NextResponse.json({ success: true, message: '취소된 주문입니다. (환불 대상)' });
            }
            const { data: updatedOrder, error: updateError } = await supabase
                .from('flower_orders')
                .update({ status: 'completed' })
                .eq('id', orderId)
                .select('*')
                .single();

            if (updateError) {
                console.error('주문 상태 업데이트 오류:', updateError);
            } else {
                orderData = updatedOrder;
                console.log('✅ 주문 상태 업데이트 완료');

                // =============================================
                // [B2B] 화환 판매 시 파트너 예치금 자동 적립 (가상계좌)
                // =============================================
                if (orderData?.bugo_id) {
                    try {
                        // 1. 이 부고에 연결된 B2B 파트너 조회
                        const { data: bugoRecord } = await supabase
                            .from('bugo')
                            .select('b2b_user_id')
                            .eq('id', orderData.bugo_id)
                            .single();

                        if (bugoRecord) {
                            orderData.bugo = bugoRecord;
                        }

                        if (bugoRecord?.b2b_user_id) {
                            const partnerId = bugoRecord.b2b_user_id;

                            // 2. 파트너 정보 및 소속 상조회사 수당 분배 구조 조회
                            const { data: partnerUser } = await supabase
                                .from('b2b_users')
                                .select('company_id, company_name, recommender_id, owner_name')
                                .eq('id', partnerId)
                                .single();

                            let rewardAmount = 20000;
                            let companyCommission = 0;

                            if (partnerUser?.company_id) {
                                const { data: rawCompany } = await supabase
                                    .from('b2b_companies')
                                    .select('*')
                                    .eq('id', partnerUser.company_id)
                                    .single();

                                const companyRecord = normalizeCompanyData(rawCompany);
                                companyCommission = companyRecord.wreath_commission_amount;

                                // 상품별 차등 수수료 분기: DB b2b_companies 설정값 동적 적용 (하드코딩 0개)
                                const pName = (orderData.product_name || '').trim();
                                if (pName.includes('바구니')) {
                                    rewardAmount = companyRecord.wreath_basket_amount; // 근조바구니 (DB 설정값)
                                } else if (pName.includes('오브제')) {
                                    rewardAmount = companyRecord.wreath_objet_amount; // 오브제 1단 (DB 설정값)
                                } else if (pName.includes('고급')) {
                                    rewardAmount = companyRecord.wreath_deluxe_amount; // 고급 근조 3단 (DB 설정값)
                                } else if (pName.includes('프리미엄') || pName.includes('특대')) {
                                    rewardAmount = companyRecord.wreath_premium_amount; // 특대 근조 3단 (DB 설정값)
                                } else if (pName.includes('VIP') || pName.includes('4단')) {
                                    rewardAmount = companyRecord.wreath_vip_amount; // 근조 4단 화환 (DB 설정값)
                                } else {
                                    rewardAmount = companyRecord.wreath_basic_amount || companyRecord.wreath_member_commission_amount; // 근조 3단 기본형 (DB 설정값)
                                }
                                console.log(`✅ [B2B-Webhook] 상조회사 [${companyRecord.name || partnerUser.company_name}] 상품별 수수료 DB 동적 적용: [${pName}] ➡️ 지도사 수당 ${rewardAmount}원, 본사 ${companyCommission}원`);
                            } else {
                                // 개인/프리랜서 파트너: 기본 지도사 수당 (20,000원) 100% 지급
                                const { data: rewardSetting } = await supabase
                                    .from('b2b_settings')
                                    .select('value')
                                    .eq('key', 'wreath_reward_amount')
                                    .single();
                                rewardAmount = parseInt(rewardSetting?.value || '20000');
                            }

                            // 3. 파트너 예치금 적립
                            if (rewardAmount > 0) {
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
                                        description: `화환 판매 적립 (가상계좌 입금 완료 - ${orderData.product_name || '화환'})`,
                                        related_order_id: String(orderData.id || moid),
                                    });

                                console.log(`✅ [B2B-Webhook] 파트너 ${partnerId}에게 ${rewardAmount}원 적립 완료`);
                            }

                            // 4-2. 상조회사 소속인 경우 본사 수수료 정산 내역 추가
                            try {
                                if (partnerUser?.company_id && companyCommission > 0) {
                                    await supabase.from('b2b_company_settlements').insert({
                                        company_id: partnerUser.company_id,
                                        order_id: String(orderData.id || moid),
                                        amount: companyCommission,
                                        status: 'pending'
                                    });

                                    console.log(`✅ [B2B-Webhook] 상조회사 본사 ${partnerUser.company_id}에 ${companyCommission}원 정산 내역 추가 완료`);
                                }
                            } catch (companyErr) {
                                console.error('❌ [B2B-Webhook] 상조회사 본사 정산 적재 중 오류:', companyErr);
                            }

                            // 인앱 알람: 화환 주문 + 수당 적립 (비동기)
                            import('@/lib/partner-notification').then(({ insertInAppAlarm }) => {
                                insertInAppAlarm(
                                    partnerId, 'flower_order',
                                    '화환 주문이 접수되었습니다',
                                    `${orderData.product_name || '화환'} | 주문자: ${orderData.sender_name || ''}`,
                                    '/b2b/wallet', 'alarm_order'
                                );
                                if (rewardAmount > 0) {
                                    insertInAppAlarm(
                                        partnerId, 'flower_commission',
                                        '화환 판매 수당이 적립되었습니다',
                                        `${rewardAmount.toLocaleString()}원 적립 (${orderData.product_name || '화환'})`,
                                        '/b2b/wallet', 'alarm_reward'
                                    );
                                }
                            });

                            // 5. 추천인 보너스 적립 (개인/프리랜서 파트너의 판매인 경우만, 상조회사 소속 파트너는 추천수당 제외)
                            const isSangjoCorporate = Boolean(partnerUser?.company_id);
                            const isValidRecommender = partnerUser?.recommender_id && partnerUser.recommender_id !== partnerId;
                            if (!isSangjoCorporate && isValidRecommender) {
                                // 추천인의 소속 정보 확인 (상조회사 소속인지 여부 및 활성 상태)
                                const { data: recommenderUser } = await supabase
                                    .from('b2b_users')
                                    .select('id, company_id, owner_name, status, deleted_at')
                                    .eq('id', partnerUser.recommender_id)
                                    .maybeSingle();

                                const isRecommenderActive = recommenderUser && recommenderUser.status !== 'blocked' && !recommenderUser.deleted_at;

                                if (isRecommenderActive) {
                                    const isRecommenderCorporate = Boolean(recommenderUser?.company_id);

                                    let recommenderBonus = 2500;
                                    let corporateBonus = 0;

                                if (isRecommenderCorporate && recommenderUser?.company_id) {
                                    // 추천인 소속 상조회사의 DB 설정값(referral_member_bonus, referral_company_bonus) 동적 조회
                                    const { data: recCompanyRaw } = await supabase
                                        .from('b2b_companies')
                                        .select('*')
                                        .eq('id', recommenderUser.company_id)
                                        .maybeSingle();
                                    const recCompany = normalizeCompanyData(recCompanyRaw);

                                    recommenderBonus = recCompany.referral_member_bonus; // 추천 지도사 몫 (DB 값, 기본 3,500원)
                                    corporateBonus = recCompany.referral_company_bonus; // 상조 본사 몫 (DB 값, 기본 6,500원)
                                } else {
                                    // 일반 프리랜서 추천인: 설정값(기본 2,500원)
                                    const { data: bonusSetting } = await supabase
                                        .from('b2b_settings')
                                        .select('value')
                                        .eq('key', 'referral_bonus_amount')
                                        .single();
                                    recommenderBonus = parseInt(bonusSetting?.value || '2500');
                                }

                                // 5-1. 추천인 지도사에게 보너스 적립
                                if (recommenderBonus > 0) {
                                    const { data: refDeposit } = await supabase
                                        .from('deposits')
                                        .select('balance')
                                        .eq('user_id', partnerUser.recommender_id)
                                        .single();

                                    if (refDeposit) {
                                        await supabase
                                            .from('deposits')
                                            .update({
                                                balance: (refDeposit.balance || 0) + recommenderBonus,
                                                updated_at: new Date().toISOString(),
                                            })
                                            .eq('user_id', partnerUser.recommender_id);
                                    } else {
                                        await supabase
                                            .from('deposits')
                                            .insert({
                                                user_id: partnerUser.recommender_id,
                                                balance: recommenderBonus,
                                                updated_at: new Date().toISOString(),
                                            });
                                    }

                                    const sellerTitle = partnerUser.owner_name ? `${partnerUser.owner_name} 장례지도사님` : '추천 파트너';
                                    // 추천인 내역 기록
                                    await supabase
                                        .from('deposit_transactions')
                                        .insert({
                                            user_id: partnerUser.recommender_id,
                                            amount: recommenderBonus,
                                            type: 'referral_bonus',
                                            description: `추천 수당 (${sellerTitle}의 화환 판매 - 가상계좌)`,
                                            related_order_id: String(orderData.id || moid),
                                        });

                                    // 추천인 인앱 알람 발송
                                    import('@/lib/partner-notification').then(({ insertInAppAlarm }) => {
                                        insertInAppAlarm(
                                            partnerUser.recommender_id, 'referral_bonus',
                                            '추천 수당이 적립되었습니다',
                                            `추천 수당 ${recommenderBonus.toLocaleString()}원 적립 (${sellerTitle}의 화환 판매)`,
                                            '/b2b/wallet', 'alarm_reward'
                                        );
                                    });

                                    console.log(`✅ [B2B-Webhook] 추천인 ${partnerUser.recommender_id}에게 보너스 ${recommenderBonus}원 적립 완료`);
                                }

                                // 5-2. 추천인이 상조회사 소속인 경우 본사에 분할 수수료(6,500원) 정산 적재
                                if (isRecommenderCorporate && corporateBonus > 0 && recommenderUser?.company_id) {
                                    await supabase
                                        .from('b2b_company_settlements')
                                        .insert({
                                            company_id: recommenderUser.company_id,
                                            order_id: String(orderData.id || moid),
                                            amount: corporateBonus,
                                            status: 'pending'
                                        });

                                    console.log(`✅ [B2B-Webhook] 추천인 소속 상조회사 ${recommenderUser.company_id}에 추천 분할 수수료 ${corporateBonus}원 정산 내역 추가 완료`);
                                }
                            }
                        }
                    }
                } catch (b2bErr) {
                        console.error('❌ [B2B-Webhook] 가상계좌 입금 파트너 적립 중 에러:', b2bErr);
                    }
                }
            }
        }


        // 📱 알림톡 발송 (입금 완료)
        if (orderData?.sender_phone) {
            const phoneNumber = orderData.sender_phone.replace(/-/g, '');
            const isB2B = !!orderData?.bugo?.b2b_user_id;
            sendAlimtalk(
                phoneNumber,
                'KA01TP2601311316586435pxsJOWuWbz',  // 화환 결제완료 템플릿
                {
                    '상품명': orderData.product_name || '',
                    '금액': Number(amt).toLocaleString(),
                    '주문번호': orderData.order_number || moid,
                    '받는분': orderData.recipient_name || '',
                    '장례식장': `${orderData.funeral_home || ''} ${orderData.room || ''}`.trim(),
                },
                undefined,
                isB2B
            ).then(() => {
                console.log('✅ 가상계좌 입금완료 알림톡 발송:', phoneNumber);
            }).catch(err => console.error('❌ 가상계좌 입금완료 알림톡 실패:', err));
        }

        // 🔔 슬랙 알림 발송
        if (orderData) {
            // 부고 데이터 조회 (대표상주, 주소 포함)
            let bugoData: any = null;
            if (orderData.bugo_id) {
                const { data } = await supabase
                    .from('bugo')
                    .select('bugo_number, deceased_name, mourner_name, phone_password, mourners, address')
                    .eq('id', orderData.bugo_id)
                    .single();
                bugoData = data;
            }

            // mourners에서 수신자 연락처 매칭
            let recipientPhone = '';
            if (bugoData?.mourners && Array.isArray(bugoData.mourners)) {
                const matched = bugoData.mourners.find(
                    (m: any) => m.name === orderData.recipient_name && m.contact
                );
                if (matched) recipientPhone = matched.contact;
            }

            sendFlowerOrderNotification({
                id: orderData.order_number || moid,
                bugo_number: bugoData?.bugo_number || '',
                deceased_name: bugoData?.deceased_name || orderData.recipient_name || '',
                sender_name: orderData.sender_name,
                sender_phone: orderData.sender_phone,
                recipient_name: orderData.recipient_name,
                recipient_phone: recipientPhone,
                product_name: orderData.product_name,
                price: Number(amt),
                ribbon_text1: orderData.ribbon_text1,
                ribbon_text2: orderData.ribbon_text2,
                funeral_hall: orderData.funeral_home,
                room: orderData.room,
                address: orderData.address || bugoData?.address || '',
                payment_method: 'vbank',
                chief_mourner_name: bugoData?.mourner_name || '',
                chief_mourner_phone: bugoData?.phone_password || '',
            }, !!bugoData?.b2b_user_id).catch(err => console.error('❌ 슬랙 알림 실패:', err));
        }

        return NextResponse.json({ success: true, message: '입금 처리 완료' });

    } catch (error) {
        console.error('웹훅 처리 오류:', error);
        return NextResponse.json(
            { success: false, error: '웹훅 처리 중 오류 발생' },
            { status: 500 }
        );
    }
}
