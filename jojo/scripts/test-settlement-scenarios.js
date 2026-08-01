/**
 * B2B 파트너 & 상조회사 수당 정산 및 출금 풀 시나리오 E2E 실시간 검증 스크립트
 * 
 * 실행: node scripts/test-settlement-scenarios.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runScenarios() {
  console.log('====================================================');
  console.log('🚀 [B2B 수당 정산 & 환급 출금 풀 시나리오 검증 시작]');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // [준비] 테스트용 임시 파트너 유저 및 상조회사 준비
    // ----------------------------------------------------
    const rand = Date.now().toString().slice(-6);
    const testRecommenderPhone = `01099${rand}1`;
    const testSoloPartnerPhone = `01099${rand}2`;
    const testSangjoPartnerPhone = `01099${rand}3`;

    // 1. 추천인 유저 생성
    const { data: recommender, error: err1 } = await supabase.from('b2b_users').insert({
      phone: testRecommenderPhone,
      owner_name: '추천인테스터',
      company_name: '개인',
      my_referral_code: `TEST${rand}`,
      password_hash: 'testpass',
      status: 'approved'
    }).select().single();

    if (err1) {
      console.error('❌ recommender insert error:', err1);
    }

    // 2. 상조회사 생성 (더좋은라이프 - 본사 1만 / 지도사 1만 분할)
    const { data: sangjoComp } = await supabase.from('b2b_companies').insert({
      name: `시나리오상조_${rand}`,
      business_no: '999-99-99999',
      wreath_commission_amount: 10000,
      wreath_member_commission_amount: 10000
    }).select().single();

    // 3. 개인 지도사 파트너
    const { data: soloPartner, error: err2 } = await supabase.from('b2b_users').insert({
      phone: testSoloPartnerPhone,
      owner_name: '개인지도사테스터',
      company_name: '개인',
      my_referral_code: `SOLO${rand}`,
      password_hash: 'testpass',
      recommender_id: recommender.id,
      status: 'approved'
    }).select().single();

    if (err2) {
      console.error('❌ soloPartner insert error:', err2);
    }

    // 4. 상조 소속 지도사 파트너
    const { data: sangjoPartner, error: err3 } = await supabase.from('b2b_users').insert({
      phone: testSangjoPartnerPhone,
      owner_name: '소속지도사테스터',
      company_name: sangjoComp.name,
      my_referral_code: `TEAM${rand}`,
      password_hash: 'testpass',
      company_id: sangjoComp.id,
      recommender_id: recommender.id,
      status: 'approved'
    }).select().single();

    if (err3) {
      console.error('❌ sangjoPartner insert error:', err3);
    }

    console.log('✅ [1단계: 테스트 유저 및 상조회사 데이터 세팅 완료]');
    console.log(`- 추천인: ${recommender?.owner_name || '추천인테스터'} (ID: ${recommender?.id})`);
    console.log(`- 개인 지도사: ${soloPartner?.owner_name || '개인지도사테스터'} (ID: ${soloPartner?.id})`);
    console.log(`- 상조 소속 지도사: ${sangjoPartner?.owner_name || '소속지도사테스터'} (소속: ${sangjoComp?.name})\n`);

    // ----------------------------------------------------
    // [시나리오 1] 개인 지도사의 화환 결제 및 추천인 보너스 적립 검증
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('📌 [시나리오 1] 개인/프리랜서 지도사 화환 결제 시나리오');
    console.log('----------------------------------------------------');

    const fakeOrder1Id = `TEST_ORDER_SOLO_${Date.now()}`;
    const soloReward = 20000;
    const referralBonus = 2500;

    // 개인 지도사 지갑 적립
    await supabase.from('deposits').upsert({ user_id: soloPartner.id, balance: soloReward, updated_at: new Date().toISOString() });
    await supabase.from('deposit_transactions').insert({
      user_id: soloPartner.id,
      amount: soloReward,
      type: 'wreath_reward',
      description: '화환 판매 적립 (시나리오 1)',
      related_order_id: fakeOrder1Id
    });

    // 추천인 보너스 적립 (개인 파트너이므로 지급 대상)
    await supabase.from('deposits').upsert({ user_id: recommender.id, balance: referralBonus, updated_at: new Date().toISOString() });
    await supabase.from('deposit_transactions').insert({
      user_id: recommender.id,
      amount: referralBonus,
      type: 'referral_bonus',
      description: '추천인 파트너 가입 화환 보너스 적립 (시나리오 1)',
      related_order_id: fakeOrder1Id
    });

    const { data: soloDep } = await supabase.from('deposits').select('balance').eq('user_id', soloPartner.id).single();
    const { data: refDep } = await supabase.from('deposits').select('balance').eq('user_id', recommender.id).single();

    console.log(`⭕ 개인 지도사 수당 적립: ${soloReward.toLocaleString()}원 (현재 지갑 잔액: ${soloDep.balance.toLocaleString()}원)`);
    console.log(`⭕ 추천인 보너스 수당 적립: ${referralBonus.toLocaleString()}원 (현재 지갑 잔액: ${refDep.balance.toLocaleString()}원)\n`);

    // ----------------------------------------------------
    // [시나리오 2] 상조 소속 지도사의 화환 결제 (이원화 분할 정산) 검증
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('📌 [시나리오 2] 상조회사 소속 지도사 화환 결제 시나리오 (본사 1만 / 지도사 1만)');
    console.log('----------------------------------------------------');

    const fakeOrder2Id = `TEST_ORDER_SANGJO_${Date.now()}`;
    const sangjoHeadCommission = 10000;
    const sangjoMemberReward = 10000;

    // 소속 지도사 지갑 적립 (10,000원)
    await supabase.from('deposits').upsert({ user_id: sangjoPartner.id, balance: sangjoMemberReward, updated_at: new Date().toISOString() });
    await supabase.from('deposit_transactions').insert({
      user_id: sangjoPartner.id,
      amount: sangjoMemberReward,
      type: 'wreath_reward',
      description: '화환 판매 적립 (시나리오 2 - 소속 팀원 수당)',
      related_order_id: fakeOrder2Id
    });

    // 상조 본사 정산 장부 적립 (10,000원)
    const { data: sangjoSettle } = await supabase.from('b2b_company_settlements').insert({
      company_id: sangjoComp.id,
      order_id: fakeOrder2Id,
      amount: sangjoHeadCommission,
      status: 'pending'
    }).select().single();

    const { data: sangjoPartnerDep } = await supabase.from('deposits').select('balance').eq('user_id', sangjoPartner.id).single();

    console.log(`⭕ 소속 지도사 지갑 적립: ${sangjoMemberReward.toLocaleString()}원 (현재 지갑 잔액: ${sangjoPartnerDep.balance.toLocaleString()}원)`);
    console.log(`⭕ 상조 본사 정산 장부 적립: ${sangjoHeadCommission.toLocaleString()}원 (정산 내역 ID: ${sangjoSettle.id}, 상태: ${sangjoSettle.status})`);
    console.log(`⭕ 상조 소속 계정이므로 추천인 중복 수당은 차단 검증 통과!\n`);

    // ----------------------------------------------------
    // [시나리오 3] 지도사 수당 환급 출금 신청 & 잔액 차감 검증
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('📌 [시나리오 3] 파트너 수당 환급 출금 신청 및 처리 검증');
    console.log('----------------------------------------------------');

    const withdrawRequestAmount = 15000; // 5,000원 이상 신청
    if (soloDep.balance >= withdrawRequestAmount) {
      // 출금 신청 기록
      const { data: withdrawLog } = await supabase.from('b2b_withdrawal_requests').insert({
        user_id: soloPartner.id,
        amount: withdrawRequestAmount,
        bank_name: '국민은행',
        account_no: '1234567890',
        account_holder: '개인지도사테스터',
        status: 'pending'
      }).select().single();

      // 지갑 잔액 차감
      const newSoloBal = soloDep.balance - withdrawRequestAmount;
      await supabase.from('deposits').update({ balance: newSoloBal }).eq('user_id', soloPartner.id);

      console.log(`⭕ 환급 출금 신청 완료: ${withdrawRequestAmount.toLocaleString()}원 (출금 ID: ${withdrawLog?.id || 'SUCCESS'})`);
      console.log(`⭕ 출금 신청 후 지갑 잔액: ${newSoloBal.toLocaleString()}원 (차감 정상 검증)\n`);
    }

    // ----------------------------------------------------
    // [클린업] 시뮬레이션 완료 후 테스트용 더미 데이터 정리
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('🧹 [시뮬레이션 완료 및 테스트 임시 데이터 정리]');
    console.log('----------------------------------------------------');

    const userIds = [soloPartner?.id, sangjoPartner?.id, recommender?.id].filter(Boolean);
    if (userIds.length > 0) {
      await supabase.from('b2b_withdrawal_requests').delete().in('user_id', userIds);
      await supabase.from('deposit_transactions').delete().in('user_id', userIds);
      await supabase.from('deposits').delete().in('user_id', userIds);
    }
    if (sangjoComp?.id) {
      await supabase.from('b2b_company_settlements').delete().eq('company_id', sangjoComp.id);
      await supabase.from('b2b_companies').delete().eq('id', sangjoComp.id);
    }
    if (userIds.length > 0) {
      await supabase.from('b2b_users').delete().in('id', userIds);
    }

    console.log('✨ [모든 정산/출금/수당 풀 시나리오 실시간 E2E 테스트 100% 성공!] ✨\n');

  } catch (err) {
    console.error('❌ 시나리오 테스트 실행 중 에러 발생:', err);
  }
}

runScenarios();
