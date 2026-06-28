const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// 1. .env.local 환경 변수 로드
const envPath = path.resolve(__dirname, '../.env.local');
let envData = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] ? match[2].trim() : '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            envData[match[1]] = value;
        }
    });
    console.log('✅ Loaded env from .env.local');
} else {
    console.error('❌ .env.local not found!');
    process.exit(1);
}

const SUPABASE_URL = envData.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envData.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = envData.JWT_SECRET || 'maeumbugo-b2b-secret-key';
const LOCAL_SERVER_URL = 'http://localhost:3000';

const crypto = require('crypto');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase config in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

async function runE2ETests() {
    console.log('🚀 [START] B2B E2E API & Database Validation Test');
    console.log('Target Database:', SUPABASE_URL);

    let recommenderId = null;
    let refereeId = null;
    let testBugoId = null;
    let testOrderId = crypto.randomUUID();
    let withdrawalRequestId = null;

    try {
        // --- 0. 기존 테스트 데이터 정리 ---
        console.log('\n--- 0. Database Clean Up ---');
        
        // 가상 주문 삭제
        await supabase.from('flower_orders').delete().eq('id', testOrderId);
        console.log('✓ Cleaned up test order:', testOrderId);

        // B2B 유저 및 연관 데이터 정리
        const { data: usersToDel } = await supabase
            .from('b2b_users')
            .select('id')
            .in('phone', ['01099991001', '01099991002']);

        if (usersToDel && usersToDel.length > 0) {
            const uids = usersToDel.map(u => u.id);
            // 1. flower_orders 삭제 (테스트 유저들이 생성한 부고를 참조하는 주문들)
            const { data: bugosToDel } = await supabase.from('bugo').select('id').in('b2b_user_id', uids);
            if (bugosToDel && bugosToDel.length > 0) {
                const bugoIds = bugosToDel.map(b => b.id);
                await supabase.from('flower_orders').delete().in('bugo_id', bugoIds);
                // 2. bugo 삭제
                await supabase.from('bugo').delete().in('id', bugoIds);
            }
            // 3. withdrawal_requests, transactions, deposits, users 삭제
            await supabase.from('withdrawal_requests').delete().in('user_id', uids);
            await supabase.from('deposit_transactions').delete().in('user_id', uids);
            await supabase.from('deposits').delete().in('user_id', uids);
            await supabase.from('b2b_users').delete().in('id', uids);
            console.log('✓ Cleaned up B2B users and all referenced data hierarchically');
        }

        // 가상 부고 직접 삭제 (b2b_user_id 없이 생성되었을 수 있는 건)
        await supabase.from('bugo').delete().eq('bugo_number', 'TEST9999');

        // --- 1. [1단계] 테스트용 B2B 부고장 개설 및 b2b_user_id 매핑 검증 ---
        console.log('\n--- 1. [Step 1] Create B2B Users & B2B Obituary ---');
        const hashedPassword = bcrypt.hashSync('testpwd123', 10);

        // 추천인 생성
        const { data: recUser, error: recErr } = await supabase
            .from('b2b_users')
            .insert({
                phone: '01099991001',
                password_hash: hashedPassword,
                company_name: '테스트 추천상조',
                owner_name: '추천인',
                bank_name: '국민은행',
                account_no: '111-222-333333',
                account_holder: '추천인',
                my_referral_code: 'REF99991',
                status: 'approved',
            })
            .select('id')
            .single();

        if (recErr) throw new Error('Recommender creation failed: ' + recErr.message);
        recommenderId = recUser.id;
        console.log('✓ Recommender user created. ID:', recommenderId);

        await supabase.from('deposits').insert({ user_id: recommenderId, balance: 0 });
        console.log('✓ Recommender deposit balance initialized to 0');

        // 피추천인 생성 (추천코드로 매핑)
        const { data: refUser, error: refErr } = await supabase
            .from('b2b_users')
            .insert({
                phone: '01099991002',
                password_hash: hashedPassword,
                company_name: '테스트 피추천상조',
                owner_name: '피추천인',
                bank_name: '신한은행',
                account_no: '444-555-666666',
                account_holder: '피추천인',
                recommender_id: recommenderId,
                my_referral_code: 'REF99992',
                status: 'approved',
                identity_verified: true, // 본인인증 완료 상태
            })
            .select('id')
            .single();

        if (refErr) throw new Error('Referee creation failed: ' + refErr.message);
        refereeId = refUser.id;
        console.log('✓ Referee user created. ID:', refereeId);

        await supabase.from('deposits').insert({ user_id: refereeId, balance: 0 });
        console.log('✓ Referee deposit balance initialized to 0');

        // B2B 부고 개설 및 b2b_user_id 매핑
        const bugoPayload = {
            bugo_number: 'TEST9999',
            deceased_name: '홍길동',
            gender: '남',
            funeral_date: '2026-06-25',
            relationship: '장남',
            mourner_name: '홍영수',
            contact: '010-9999-1002',
            b2b_user_id: refereeId, // 파트너 매핑
            template_id: 'basic',
            status: 'active',
        };

        const { data: insertedBugo, error: bugoErr } = await supabase
            .from('bugo')
            .insert(bugoPayload)
            .select('*')
            .single();

        if (bugoErr) throw new Error('Obituary creation failed: ' + bugoErr.message);
        testBugoId = insertedBugo.id;
        console.log(`✓ Obituary TEST9999 created. ID: ${testBugoId}, Map b2b_user_id: ${insertedBugo.b2b_user_id}`);

        if (insertedBugo.b2b_user_id !== refereeId) {
            throw new Error('❌ [ERROR] b2b_user_id mismatch on created obituary!');
        }
        console.log('★ [1단계 통과] b2b_user_id 매핑 검증 완료!');

        // --- 2. [2단계] /api/payment/innopay/approve 모의 호출 및 수당 적립 검증 ---
        console.log('\n--- 2. [Step 2] Approve Payment API Mock Call & Reward Checking ---');

        // 2-1. flower_orders 에 가상 주문 행 삽입
        const { error: orderInsertErr } = await supabase.from('flower_orders').insert({
            id: testOrderId,
            order_number: 'ORD_TEST_9999',
            bugo_id: testBugoId,
            product_id: 'wreath_01',
            product_name: '테스트 고급화환',
            sender_name: '테스트조문객',
            sender_phone: '010-0000-0000',
            recipient_name: '홍영수',
            status: 'pending',
            product_price: 100000,
        });
        if (orderInsertErr) throw new Error('Order creation failed: ' + orderInsertErr.message);
        console.log('✓ Virtual flower order created.');

        // 2-2. /api/payment/innopay/approve 모의 호출
        console.log('Calling /api/payment/innopay/approve...');
        const approvePayload = {
            paymentToken: 'MOCK_TOKEN',
            tid: 'TEST_TID_MOCK',
            mid: 'pgmaeum01m',
            amt: '100000',
            taxFreeAmt: '0',
            moid: 'ORD_TEST_9999',
            orderId: testOrderId,
            payMethod: 'CARD'
        };

        const approveRes = await fetch(`${LOCAL_SERVER_URL}/api/payment/innopay/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(approvePayload)
        });

        const approveResult = await approveRes.json();
        console.log('API Response:', approveResult);

        if (!approveRes.ok || !approveResult.success) {
            throw new Error('Approve API call failed: ' + JSON.stringify(approveResult));
        }
        console.log('✓ API call returned success.');

        // 2-3. 적립 현황 DB 검증
        const { data: depRef } = await supabase.from('deposits').select('balance').eq('user_id', refereeId).single();
        const { data: depRec } = await supabase.from('deposits').select('balance').eq('user_id', recommenderId).single();

        console.log(`- Referee Balance: ${depRef.balance} won (Expected: 10000)`);
        console.log(`- Recommender Balance: ${depRec.balance} won (Expected: 2000)`);

        if (depRef.balance !== 10000 || depRec.balance !== 2000) {
            throw new Error('❌ [ERROR] Reward or Referral Bonus balance mismatch!');
        }

        // 거래 내역 테이블(deposit_transactions) 검증
        const { data: txRef } = await supabase.from('deposit_transactions').select('*').eq('user_id', refereeId).eq('type', 'wreath_reward').single();
        const { data: txRec } = await supabase.from('deposit_transactions').select('*').eq('user_id', recommenderId).eq('type', 'referral_bonus').single();

        console.log(`- Referee Transaction: Type=${txRef?.type}, Amount=${txRef?.amount}, RelatedOrder=${txRef?.related_order_id}`);
        console.log(`- Recommender Transaction: Type=${txRec?.type}, Amount=${txRec?.amount}, RelatedOrder=${txRec?.related_order_id}`);

        if (!txRef || !txRec) {
            throw new Error('❌ [ERROR] Deposit transaction record not found!');
        }
        console.log('★ [2단계 통과] 수당 적립 및 보너스 DB 트랜잭션 정상 수행 완료!');

        // --- 3. [3단계] 파트너 지갑 출금 신청 API 모의 호출 및 검증 ---
        console.log('\n--- 3. [Step 3] Partner Wallet Withdrawal Request API Call ---');

        // 3-1. Referee 잔액을 60,000원으로 맞추어 최소 출금금액(50,000원) 조건을 만족시킴
        await supabase.from('deposits').update({ balance: 60000 }).eq('user_id', refereeId);
        console.log('✓ Prepared Referee balance to 60,000 won for withdrawal test.');

        // 3-2. Referee 유저 JWT 토큰 생성
        const token = jwt.sign({ userId: refereeId }, JWT_SECRET);
        console.log('✓ Mock JWT Token generated for Referee.');

        // 3-3. /api/b2b/wallet POST 출금 신청 API 호출
        console.log('Calling /api/b2b/wallet (POST)...');
        const withdrawRes = await fetch(`${LOCAL_SERVER_URL}/api/b2b/wallet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount: 50000 })
        });

        const withdrawResult = await withdrawRes.json();
        console.log('API Response:', withdrawResult);

        if (!withdrawRes.ok || !withdrawResult.success) {
            throw new Error('Withdrawal API call failed: ' + JSON.stringify(withdrawResult));
        }
        console.log('✓ API call returned success.');

        // 3-4. DB 검증: 잔액 차감 & pending 출금 신청 & 거래 내역 기록
        const { data: depRefAfterWd } = await supabase.from('deposits').select('balance').eq('user_id', refereeId).single();
        console.log(`- Referee Balance after withdrawal: ${depRefAfterWd.balance} won (Expected: 10000)`);
        if (depRefAfterWd.balance !== 10000) {
            throw new Error('❌ [ERROR] Referee balance not decremented correctly!');
        }

        const { data: wdRequest, error: getWdErr } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('user_id', refereeId)
            .eq('status', 'pending')
            .single();

        if (getWdErr || !wdRequest) {
            throw new Error('❌ [ERROR] Pending withdrawal request record not found! ' + (getWdErr?.message || ''));
        }
        withdrawalRequestId = wdRequest.id;
        console.log(`- Found Pending Withdrawal Request ID: ${withdrawalRequestId}, Amount: ${wdRequest.amount}`);

        const { data: txWd } = await supabase
            .from('deposit_transactions')
            .select('*')
            .eq('user_id', refereeId)
            .eq('type', 'withdrawal')
            .single();

        if (!txWd || txWd.amount !== -50000) {
            throw new Error(`❌ [ERROR] Withdrawal transaction mismatch! Amount: ${txWd?.amount}`);
        }
        console.log('★ [3단계 통과] 출금 신청 API 및 DB 갱신(잔액 차감, 대기 레코드 인서트) 검증 완료!');

        // --- 4. [4단계] 어드민 출금 완료 처리 API 기동 검증 ---
        console.log('\n--- 4. [Step 4] B2B Admin Withdrawal Completion API Call ---');

        // 4-1. /api/b2b/admin/withdrawals POST API 호출
        // 어드민 검증 우회를 위해 Cookie: admin_ip=true 전달
        console.log('Calling /api/b2b/admin/withdrawals (POST)...');
        const adminRes = await fetch(`${LOCAL_SERVER_URL}/api/b2b/admin/withdrawals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'admin_ip=true'
            },
            body: JSON.stringify({
                requestId: withdrawalRequestId,
                action: 'approve'
            })
        });

        const adminResult = await adminRes.json();
        console.log('API Response:', adminResult);

        if (!adminRes.ok || !adminResult.success) {
            throw new Error('Admin Withdrawal Approve API failed: ' + JSON.stringify(adminResult));
        }
        console.log('✓ API call returned success.');

        // 4-2. DB 검증: status가 'approved'로 변경되었는지 확인
        const { data: approvedWd } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('id', withdrawalRequestId)
            .single();

        console.log(`- Withdrawal Request Status: ${approvedWd.status} (Expected: approved), ProcessedAt: ${approvedWd.processed_at}`);
        if (approvedWd.status !== 'approved') {
            throw new Error(`❌ [ERROR] Withdrawal request status is ${approvedWd.status}, not approved!`);
        }
        console.log('★ [4단계 통과] 어드민 출금 완료 처리 API 기동 및 DB 승인(status=approved) 검증 완료!');

        console.log('\n🌟 [SUCCESS] ALL 4 STEPS OF B2B SCENARIOS COMPLETED SUCCESSFULLY! 🌟');

    } catch (err) {
        console.error('\n❌ [FAILURE] QA Test Flow failed with error:', err.message);
        process.exit(1);
    }
}

runE2ETests();
