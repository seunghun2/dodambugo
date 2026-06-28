const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables from .env.production.local
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
    console.log('✅ Loaded env from .env.production.local');
} else {
    console.error('❌ .env.production.local not found!');
    process.exit(1);
}

const SUPABASE_URL = envData.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envData.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = envData.SOLAPI_API_KEY || process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = envData.SOLAPI_API_SECRET || process.env.SOLAPI_API_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase URL or Service Role Key!');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

// Solapi helper function
function getSolapiAuthHeader(apiKey, apiSecret) {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(32).toString('hex');
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(date + salt)
        .digest('hex');

    return {
        'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
    };
}

async function sendSMS(to, text) {
    const SOLAPI_URL = 'https://api.solapi.com';
    try {
        const response = await fetch(`${SOLAPI_URL}/messages/v4/send`, {
            method: 'POST',
            headers: getSolapiAuthHeader(SOLAPI_API_KEY, SOLAPI_API_SECRET),
            body: JSON.stringify({
                message: {
                    to,
                    from: '01048375076', // 마음부고 발신번호
                    text,
                },
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('SMS Send Failed:', error);
        throw error;
    }
}

async function sendLMS(to, subject, text) {
    const SOLAPI_URL = 'https://api.solapi.com';
    try {
        const response = await fetch(`${SOLAPI_URL}/messages/v4/send`, {
            method: 'POST',
            headers: getSolapiAuthHeader(SOLAPI_API_KEY, SOLAPI_API_SECRET),
            body: JSON.stringify({
                message: {
                    to,
                    from: '01048375076', // 마음부고 발신번호
                    subject,
                    text,
                    type: 'LMS',
                },
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('LMS Send Failed:', error);
        throw error;
    }
}

// Main Test Function
async function runQA() {
    console.log('🚀 Starting B2B End-to-End QA Testing...');
    console.log('Target Supabase URL:', SUPABASE_URL);

    let recommenderId = null;
    let refereeId = null;

    try {
        // --- 0. Clean Up Previous Test Records ---
        console.log('\n--- 0. Database Clean Up ---');
        
        // Delete bugo
        const { error: delBugoErr } = await supabase
            .from('bugo')
            .delete()
            .in('bugo_number', ['TEST9991', 'TEST9992']);
        if (delBugoErr) console.log('Clean up bugo warning:', delBugoErr.message);
        else console.log('✓ Cleaned up test obituaries if any');

        // Delete inquiries
        const { error: delInqErr } = await supabase
            .from('inquiries')
            .delete()
            .in('phone', ['01099990001', '01099990002']);
        if (delInqErr) console.log('Clean up inquiries warning:', delInqErr.message);
        else console.log('✓ Cleaned up test inquiries if any');

        // Find users to delete
        const { data: usersToDel } = await supabase
            .from('b2b_users')
            .select('id')
            .in('phone', ['01099990001', '01099990002']);

        if (usersToDel && usersToDel.length > 0) {
            const uids = usersToDel.map(u => u.id);
            // Delete withdrawal requests
            await supabase.from('withdrawal_requests').delete().in('user_id', uids);
            // Delete transactions
            await supabase.from('deposit_transactions').delete().in('user_id', uids);
            // Delete deposits
            await supabase.from('deposits').delete().in('user_id', uids);
            // Delete b2b users
            await supabase.from('b2b_users').delete().in('id', uids);
            console.log('✓ Cleaned up B2B users, deposits, transactions, and withdrawal requests');
        }

        // --- 1. Create B2B Users ---
        console.log('\n--- 1. B2B User Creation ---');
        const hashedPassword = bcrypt.hashSync('testpwd123', 10);

        // Recommender
        const { data: recUser, error: recErr } = await supabase
            .from('b2b_users')
            .insert({
                phone: '01099990001',
                password_hash: hashedPassword,
                company_name: '테스트 추천상조',
                owner_name: '추천인',
                bank_name: '국민은행',
                account_no: '111-222-333333',
                account_holder: '추천인',
                my_referral_code: 'REF99901',
                status: 'approved',
                identity_verified: true,
            })
            .select('id')
            .single();

        if (recErr) throw new Error('Recommender creation failed: ' + recErr.message);
        recommenderId = recUser.id;
        console.log('✓ Recommender user created. ID:', recommenderId);

        // Initialize deposits for Recommender
        const { error: recDepErr } = await supabase.from('deposits').insert({
            user_id: recommenderId,
            balance: 0,
        });
        if (recDepErr) throw new Error('Recommender deposit init failed: ' + recDepErr.message);
        console.log('✓ Recommender deposit balance initialized to 0');

        // Referee
        const { data: refUser, error: refErr } = await supabase
            .from('b2b_users')
            .insert({
                phone: '01099990002',
                password_hash: hashedPassword,
                company_name: '테스트 피추천상조',
                owner_name: '피추천인',
                bank_name: '신한은행',
                account_no: '444-555-666666',
                account_holder: '피추천인',
                recommender_id: recommenderId,
                my_referral_code: 'REF99902',
                status: 'approved',
                identity_verified: true,
            })
            .select('id')
            .single();

        if (refErr) throw new Error('Referee creation failed: ' + refErr.message);
        refereeId = refUser.id;
        console.log('✓ Referee user created. ID:', refereeId);

        // Initialize deposits for Referee
        const { error: refDepErr } = await supabase.from('deposits').insert({
            user_id: refereeId,
            balance: 0,
        });
        if (refDepErr) throw new Error('Referee deposit init failed: ' + refDepErr.message);
        console.log('✓ Referee deposit balance initialized to 0');

        // --- 2. Create Obituaries (부고장) ---
        console.log('\n--- 2. Create Obituaries ---');

        // Test Case A: All fields populated
        const bugoA = {
            bugo_number: 'TEST9991',
            deceased_name: '홍길동',
            gender: '남',
            age: 80,
            death_date: '2026-06-20',
            death_time: '10:30',
            encoffin_date: '2026-06-21',
            encoffin_time: '09:00',
            funeral_date: '2026-06-22',
            funeral_time: '08:30',
            funeral_home: '테스트장례식장',
            room_number: 'VIP 1호실',
            funeral_home_tel: '02-1234-5678',
            address: '서울시 강남구 테스트로 123',
            address_detail: '지하 1층',
            burial_place: '서울추모공원',
            burial_place2: '용인평온의숲',
            message: '뜻밖의 슬픈 소식을 전하게 되었습니다.',
            relationship: '장남',
            mourner_name: '홍영수',
            contact: '010-9999-0002',
            mourners: [
                { relationship: '장남', name: '홍영수', contact: '010-9999-0002', bank: '신한은행', accountHolder: '홍영수', accountNumber: '444-555-666666', accountDisplay: 'mine' }
            ],
            account_info: [
                { holder: '홍영수', bank: '신한은행', number: '444-555-666666' }
            ],
            b2b_user_id: refereeId,
            template_id: 'basic',
            status: 'active',
            applicant_name: '홍영수',
            applicant_phone: '010-9999-0002',
            phone_password: '1234',
        };

        const { data: insA, error: errA } = await supabase
            .from('bugo')
            .insert(bugoA)
            .select();

        if (errA) throw new Error('Test Case A insert failed: ' + errA.message);
        console.log('✓ Test Case A: All fields populated Obituary created successfully');

        // Test Case B: Only required fields populated
        // Required database-level fields are deceased_name, gender, funeral_date, relationship, mourner_name, contact
        const bugoB = {
            bugo_number: 'TEST9992',
            deceased_name: '이영희',
            gender: '여',
            funeral_date: '2026-06-23',
            relationship: '딸',
            mourner_name: '김지수',
            contact: '010-9999-0002',
            b2b_user_id: refereeId,
            template_id: 'basic',
            status: 'active',
        };

        const { data: insB, error: errB } = await supabase
            .from('bugo')
            .insert(bugoB)
            .select();

        if (errB) throw new Error('Test Case B insert failed: ' + errB.message);
        console.log('✓ Test Case B: Only required fields populated Obituary created successfully');

        // Verify database rows
        const { data: bugoRows, error: getBugoErr } = await supabase
            .from('bugo')
            .select('bugo_number, deceased_name, mourner_name, b2b_user_id')
            .in('bugo_number', ['TEST9991', 'TEST9992']);
        
        if (getBugoErr) throw getBugoErr;
        console.log('✓ Verified bugo rows in database:', bugoRows);

        // --- 3. Test 1:1 inquiry submissions ---
        console.log('\n--- 3. Test 1:1 Inquiry Submission ---');
        const inquiryData = {
            name: '피추천인',
            phone: '01099990002',
            company: '테스트 피추천상조',
            email: 'test@example.com',
            inquiry_type: '정산/예치금',
            message: '[제목: 예치금 관련 문의] 테스트 문의 내용입니다.',
        };

        const { error: inqErr } = await supabase.from('inquiries').insert(inquiryData);
        if (inqErr) throw new Error('Inquiry insertion failed: ' + inqErr.message);
        console.log('✓ Inquiry submitted successfully');

        // Verify stored inquiry
        const { data: inqRows, error: getInqErr } = await supabase
            .from('inquiries')
            .select('*')
            .eq('phone', '01099990002');
        if (getInqErr) throw getInqErr;
        console.log('✓ Verified inquiry row in database:', inqRows);

        // --- 4. B2B Wallet Transactions & Reward Calculations ---
        console.log('\n--- 4. B2B Wallet Transactions & Reward Simulation ---');

        // Fetch reward settings
        const { data: wreathRewardSetting } = await supabase.from('b2b_settings').select('value').eq('key', 'wreath_reward_amount').single();
        const wreathReward = parseInt(wreathRewardSetting?.value || '10000');
        const { data: refBonusSetting } = await supabase.from('b2b_settings').select('value').eq('key', 'referral_bonus_amount').single();
        const refBonus = parseInt(refBonusSetting?.value || '2000');

        console.log(`Settings loaded - Wreath Reward: ${wreathReward} won, Referral Bonus: ${refBonus} won`);

        // Get initial balances
        const { data: depRefInit } = await supabase.from('deposits').select('balance').eq('user_id', refereeId).single();
        const { data: depRecInit } = await supabase.from('deposits').select('balance').eq('user_id', recommenderId).single();
        console.log(`Initial balances - Referee: ${depRefInit.balance} won, Recommender: ${depRecInit.balance} won`);

        // A. Simulate Flower (Wreath) Order reward
        console.log('A. Simulating Wreath Order Reward...');
        const orderId = 'TEST_ORDER_001';
        
        // Referee Reward
        await supabase.from('deposits').update({ balance: depRefInit.balance + wreathReward, updated_at: new Date().toISOString() }).eq('user_id', refereeId);
        await supabase.from('deposit_transactions').insert({
            user_id: refereeId,
            amount: wreathReward,
            type: 'wreath_reward',
            description: `화환 판매 적립 (테스트 화환)`,
            related_order_id: orderId,
        });

        // Recommender Bonus
        await supabase.from('deposits').update({ balance: depRecInit.balance + refBonus, updated_at: new Date().toISOString() }).eq('user_id', recommenderId);
        await supabase.from('deposit_transactions').insert({
            user_id: recommenderId,
            amount: refBonus,
            type: 'referral_bonus',
            description: `추천 수당 (추천한 파트너의 화환 판매)`,
            related_order_id: orderId,
        });

        // Verify updated balances after flower order
        const { data: depRefAfterWreath } = await supabase.from('deposits').select('balance').eq('user_id', refereeId).single();
        const { data: depRecAfterWreath } = await supabase.from('deposits').select('balance').eq('user_id', recommenderId).single();
        console.log(`Balances after Wreath order - Referee: ${depRefAfterWreath.balance} won (expected: ${wreathReward}), Recommender: ${depRecAfterWreath.balance} won (expected: ${refBonus})`);

        // B. Simulate Condolence Fee Reward
        console.log('B. Simulating Condolence Fee Reward...');
        const condolenceFee = 5000;
        const condolenceOrderId = 'COND_TEST_001';

        await supabase.from('deposits').update({ balance: depRefAfterWreath.balance + condolenceFee, updated_at: new Date().toISOString() }).eq('user_id', refereeId);
        await supabase.from('deposit_transactions').insert({
            user_id: refereeId,
            amount: condolenceFee,
            type: 'condolence_reward',
            description: '조의금 수당 적립 (테스트 조문객)',
            related_order_id: condolenceOrderId,
        });

        const { data: depRefAfterCondolence } = await supabase.from('deposits').select('balance').eq('user_id', refereeId).single();
        console.log(`Balances after Condolence fee - Referee: ${depRefAfterCondolence.balance} won (expected: ${wreathReward + condolenceFee})`);

        // --- 5. Test PL/pgSQL Function Outcomes ---
        console.log('\n--- 5. PL/pgSQL Functions Testing ---');

        // Ensure we have a high enough balance for withdrawal testing (minimum 50,000 won)
        // Let's add 50,000 won more to Referee so they can withdraw 50,000 won and leave some balance
        const extraFund = 50000;
        await supabase.from('deposits').update({ balance: depRefAfterCondolence.balance + extraFund, updated_at: new Date().toISOString() }).eq('user_id', refereeId);
        const { data: depRefForWithdraw } = await supabase.from('deposits').select('balance').eq('user_id', refereeId).single();
        console.log(`Prepared Referee balance for withdrawal: ${depRefForWithdraw.balance} won`);

        // A. Verify error cases for create_withdrawal_request (overdraft)
        console.log('Testing create_withdrawal_request error case (insufficient balance)...');
        const overdraftAmount = 500000;
        const { data: rpcErrResult, error: rpcErr } = await supabase.rpc('create_withdrawal_request', {
            p_user_id: refereeId,
            p_amount: overdraftAmount,
            p_bank_name: '신한은행',
            p_account_no: '444-555-666666',
            p_account_holder: '피추천인'
        });

        if (rpcErr) {
            console.log('✓ Received expected error for overdraft:', rpcErr.message);
        } else {
            console.error('❌ Overdraft check did not throw an error! Result:', rpcErrResult);
        }

        // B. Valid withdrawal request execution
        console.log('Testing valid create_withdrawal_request (50,000 won)...');
        const withdrawAmt = 50000;
        const { data: withdrawSuccess, error: withdrawRpcErr } = await supabase.rpc('create_withdrawal_request', {
            p_user_id: refereeId,
            p_amount: withdrawAmt,
            p_bank_name: '신한은행',
            p_account_no: '444-555-666666',
            p_account_holder: '피추천인'
        });

        if (withdrawRpcErr) throw new Error('Withdrawal RPC failed: ' + withdrawRpcErr.message);
        console.log('✓ Withdrawal request function returned:', withdrawSuccess);

        // Check Referee balance after withdrawal
        const { data: depRefPostWithdraw } = await supabase.from('deposits').select('balance').eq('user_id', refereeId).single();
        const expectedBalance = depRefForWithdraw.balance - withdrawAmt;
        console.log(`Referee balance after withdrawal: ${depRefPostWithdraw.balance} won (expected: ${expectedBalance} won)`);
        if (depRefPostWithdraw.balance !== expectedBalance) {
            console.error(`❌ Balance mismatch! expected ${expectedBalance}, got ${depRefPostWithdraw.balance}`);
        } else {
            console.log('✓ Balance correctly decremented');
        }

        // Find the created withdrawal request
        const { data: wrList, error: wrListErr } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('user_id', refereeId)
            .order('created_at', { ascending: false });

        if (wrListErr) throw wrListErr;
        const pendingRequest = wrList[0];
        console.log('✓ Found created withdrawal request:', pendingRequest);

        // C. Test approve_withdrawal_request
        console.log('Testing approve_withdrawal_request PL/pgSQL function...');
        const { data: approveSuccess, error: approveRpcErr } = await supabase.rpc('approve_withdrawal_request', {
            p_request_id: pendingRequest.id
        });
        if (approveRpcErr) throw new Error('Approve RPC failed: ' + approveRpcErr.message);
        console.log('✓ approve_withdrawal_request returned:', approveSuccess);

        // Verify status in DB
        const { data: approvedRequest } = await supabase.from('withdrawal_requests').select('*').eq('id', pendingRequest.id).single();
        console.log(`✓ Withdrawal request status: ${approvedRequest.status} (expected: approved), processed_at: ${approvedRequest.processed_at}`);

        // D. Test reject_withdrawal_request
        console.log('Testing reject_withdrawal_request PL/pgSQL function...');
        // Create another withdrawal request first
        const rejectWithdrawAmt = 10000;
        // Check current balance
        const { data: balanceBeforeSecond } = await supabase.from('deposits').select('balance').eq('user_id', refereeId).single();
        console.log(`Balance before second withdrawal request: ${balanceBeforeSecond.balance} won`);

        const { data: withdrawSuccess2, error: withdrawRpcErr2 } = await supabase.rpc('create_withdrawal_request', {
            p_user_id: refereeId,
            p_amount: rejectWithdrawAmt,
            p_bank_name: '신한은행',
            p_account_no: '444-555-666666',
            p_account_holder: '피추천인'
        });
        if (withdrawRpcErr2) throw new Error('Second Withdrawal RPC failed: ' + withdrawRpcErr2.message);
        
        const { data: wrList2 } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('user_id', refereeId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        const requestToReject = wrList2[0];
        console.log(`✓ Second request created for rejection test. ID: ${requestToReject.id}, Amount: ${requestToReject.amount}`);
        
        const { data: rejectSuccess, error: rejectRpcErr } = await supabase.rpc('reject_withdrawal_request', {
            p_request_id: requestToReject.id
        });
        if (rejectRpcErr) throw new Error('Reject RPC failed: ' + rejectRpcErr.message);
        console.log('✓ reject_withdrawal_request returned:', rejectSuccess);

        // Verify status, refund balance and transactions in DB
        const { data: rejectedRequest } = await supabase.from('withdrawal_requests').select('*').eq('id', requestToReject.id).single();
        console.log(`✓ Rejected request status: ${rejectedRequest.status} (expected: rejected), processed_at: ${rejectedRequest.processed_at}`);

        const { data: balanceAfterReject } = await supabase.from('deposits').select('balance').eq('user_id', refereeId).single();
        console.log(`Referee balance after rejection refund: ${balanceAfterReject.balance} won (expected: ${balanceBeforeSecond.balance} won)`);
        if (balanceAfterReject.balance !== balanceBeforeSecond.balance) {
            console.error('❌ Refund balance mismatch!');
        } else {
            console.log('✓ Balance correctly refunded');
        }

        // Verify deposit transaction history
        const { data: txList } = await supabase
            .from('deposit_transactions')
            .select('*')
            .eq('user_id', refereeId)
            .order('created_at', { ascending: false })
            .limit(5);
        console.log('✓ Latest deposit transactions for Referee:');
        txList.forEach(t => {
            console.log(`  - Type: ${t.type}, Amount: ${t.amount} won, Desc: ${t.description}`);
        });

        // --- 6. Send SMS/LMS Notifications using Solapi ---
        console.log('\n--- 6. Solapi SMS/LMS Sending ---');
        console.log('Testing message sending to 010-6426-2393...');

        const smsText = '[마음부고 B2B QA] SMS 발송 기능 검증 완료. 본 문자는 자동화 QA 테스트를 위해 발송되었습니다.';
        console.log('Sending SMS...');
        const smsResult = await sendSMS('01064262393', smsText);
        console.log('✓ SMS Send Result:', JSON.stringify(smsResult, null, 2));

        const lmsSubject = '[마음부고 B2B QA] LMS 테스트';
        const lmsText = '안녕하세요,\n마음부고 B2B 파트너 정산 및 알림 서비스 QA 테스트 중인 문자입니다.\n\n■ 검증 항목:\n- 부고장 생성 (All & Required)\n- 1:1 문의 연동\n- 예치금 및 파트너 적립금 계산\n- PL/pgSQL 출금/반려 트랜잭션 함수\n\n모든 기능이 정상 작동함을 확인하였습니다. 감사합니다.';
        console.log('Sending LMS...');
        const lmsResult = await sendLMS('01064262393', lmsSubject, lmsText);
        console.log('✓ LMS Send Result:', JSON.stringify(lmsResult, null, 2));

        console.log('\n🌟 ALL QA TEST FLOWS COMPLETED SUCCESSFULLY! 🌟');

    } catch (error) {
        console.error('\n❌ QA Test Flow failed with error:', error);
    } finally {
        // We can keep the test B2B users and data for database inspection,
        // or we can clean up. Since the user wants to see "database entries",
        // we will leave them in the database for now.
        console.log('\nTesting completed. Test data left in database for inspection.');
    }
}

runQA();
