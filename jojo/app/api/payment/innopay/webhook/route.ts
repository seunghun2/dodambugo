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

        console.log('📦 orderId:', orderId, 'moid:', moid);

        // DB 업데이트 - 입금 완료 상태로 변경
        let orderData: any = null;
        if (orderId) {
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
                                .select('company_id, company_name, recommender_id')
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
                                rewardAmount = companyRecord.wreath_member_commission_amount;
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

                            // 5. 추천인 보너스 적립 (개인/프리랜서 파트너만, 상조회사 소속 파트너는 추천수당 제외)
                            const { data: partnerInfo } = await supabase
                                .from('b2b_users')
                                .select('recommender_id, company_id, company_name, owner_name')
                                .eq('id', partnerId)
                                .single();

                            const isSangjoCorporate = Boolean(partnerInfo?.company_id);
                            if (!isSangjoCorporate && partnerInfo?.recommender_id) {
                                const { data: bonusSetting } = await supabase
                                    .from('b2b_settings')
                                    .select('value')
                                    .eq('key', 'referral_bonus_amount')
                                    .single();
                                const bonusAmount = parseInt(bonusSetting?.value || '2500');

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

                                // 추천인 적립 내역 기록
                                const sellerTitle = partnerInfo.owner_name ? `${partnerInfo.owner_name} 장례지도사님` : '추천 파트너';
                                await supabase
                                    .from('deposit_transactions')
                                    .insert({
                                        user_id: partnerInfo.recommender_id,
                                        amount: bonusAmount,
                                        type: 'referral_bonus',
                                        description: `추천 수당 (${sellerTitle}의 화환 판매)`,
                                        related_order_id: String(orderData.id || moid),
                                    });

                                console.log(`✅ [B2B-Webhook] 추천인 ${partnerInfo.recommender_id}에게 보너스 ${bonusAmount}원 적립 완료`);
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
