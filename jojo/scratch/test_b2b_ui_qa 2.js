const { chromium } = require('playwright');
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
} else {
    console.error('❌ .env.local not found!');
    process.exit(1);
}

const SUPABASE_URL = envData.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envData.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = envData.JWT_SECRET || 'maeumbugo-b2b-secret-key';
const LOCAL_SERVER_URL = 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

async function runUIQA() {
    console.log('🚀 [START] B2B UI/UX Auto QA (Tax & Wallet Calculation & Verify Form)');
    
    // 임시 테스트 유저 정보 정의
    const testPhone = '01099998888';
    const hashedPassword = bcrypt.hashSync('testpwd123', 10);
    let tempUserId = null;

    try {
        // 기존 동일 번호 임시 클린업
        await supabase.from('deposits').delete().eq('user_id', '00000000-0000-0000-0000-000000000000'); // Dummy check
        const { data: oldUser } = await supabase.from('b2b_users').select('id').eq('phone', testPhone).single();
        if (oldUser) {
            await supabase.from('deposits').delete().eq('user_id', oldUser.id);
            await supabase.from('b2b_users').delete().eq('id', oldUser.id);
        }

        // 1. 임시 파트너 유저 생성 (미인증 상태)
        const { data: newUser, error: userErr } = await supabase
            .from('b2b_users')
            .insert({
                phone: testPhone,
                password_hash: hashedPassword,
                company_name: 'QA 테스트 상조',
                owner_name: 'QA테스터',
                identity_verified: false,
                partner_type: 'individual',
                verification_status: 'unverified',
                my_referral_code: 'QATESTCODE'
            })
            .select('id')
            .single();

        if (userErr || !newUser) {
            throw new Error('임시 유저 생성 실패: ' + JSON.stringify(userErr));
        }
        tempUserId = newUser.id;

        // 예치금 지갑 생성 (잔액 100,000원 부여)
        await supabase.from('deposits').insert({
            user_id: tempUserId,
            balance: 100000
        });

        // 2. JWT 토큰 발급
        const token = jwt.sign({ userId: tempUserId }, JWT_SECRET);
        const b2bUserPayload = {
            id: tempUserId,
            phone: testPhone,
            company_name: 'QA 테스트 상조',
            owner_name: 'QA테스터',
            identity_verified: false,
            partner_type: 'individual'
        };

        // 3. Playwright 브라우저 가동
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 375, height: 812 }, // iPhone 13 Mini 모바일 뷰
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        });
        const page = await context.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // 캡처 디렉토리
        const artifactDir = '/Users/el/.gemini/antigravity/brain/138fdf56-14b0-44e6-ac98-f17d84055273';

        // --- 시나리오 A: 원천징수 동의서 페이지 검증 ---
        console.log('\n--- 1. [Scenario A] /b2b/income-tax Page Check ---');
        await page.goto(`${LOCAL_SERVER_URL}/b2b/income-tax`);
        await page.waitForTimeout(1000); // 렌더링 대기
        
        const headingText = await page.textContent('h1');
        console.log('✓ Heading text found:', headingText.trim());

        await page.screenshot({ path: path.join(artifactDir, 'b2b_income_tax_page.png'), fullPage: true });
        console.log('✓ Screenshot saved: b2b_income_tax_page.png');


        // --- 시나리오 B: 본인인증 폼 (개인 vs 사업자) UI 검증 ---
        console.log('\n--- 2. [Scenario B] /b2b/wallet/verify/form Page Check ---');
        // 세션 강제 주입
        await page.goto(`${LOCAL_SERVER_URL}/b2b`);
        await page.evaluate(({ t, u }) => {
            localStorage.setItem('b2b_token', t);
            localStorage.setItem('b2b_user', JSON.stringify(u));
        }, { t: token, u: b2bUserPayload });

        // 본인인증 양식 이동
        await page.goto(`${LOCAL_SERVER_URL}/b2b/wallet/verify/form`);
        await page.waitForTimeout(1000);

        // 개인 탭 상태 캡처
        console.log('  - Testing Individual verification form');
        await page.screenshot({ path: path.join(artifactDir, 'b2b_verify_individual.png') });
        console.log('✓ Screenshot saved: b2b_verify_individual.png');

        // 사업자 탭 클릭
        console.log('  - Clicking Business tab');
        const bizTabSelector = 'div[class*="tab"]:has-text("사업자"), button:has-text("사업자")';
        // HTML 상의 클래스 이름 대조하여 클릭
        await page.click('text=사업자 (세금계산서)');
        await page.waitForTimeout(500);

        await page.screenshot({ path: path.join(artifactDir, 'b2b_verify_business.png') });
        console.log('✓ Screenshot saved: b2b_verify_business.png');


        // --- 시나리오 C: 지갑 및 실시간 계산기 검증 ---
        console.log('\n--- 3. [Scenario C] /b2b/wallet Calculation (Individual) ---');
        // DB에서 임시 유저 정보를 인증 완료 및 개인 유형으로 업데이트
        await supabase
            .from('b2b_users')
            .update({ identity_verified: true, partner_type: 'individual' })
            .eq('id', tempUserId);

        const verifiedIndividualPayload = {
            ...b2bUserPayload,
            identity_verified: true,
            partner_type: 'individual'
        };

        await page.goto(`${LOCAL_SERVER_URL}/b2b`);
        await page.evaluate((u) => {
            localStorage.setItem('b2b_user', JSON.stringify(u));
        }, verifiedIndividualPayload);

        await page.goto(`${LOCAL_SERVER_URL}/b2b/wallet`);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(artifactDir, 'debug_wallet_before_click.png') });

        // 환급 신청 모달 열기
        console.log('  - Opening Withdrawal Modal (Individual)');
        await page.click('button:has-text("환급신청")');
        await page.waitForTimeout(500);

        // 금액 입력
        console.log('  - Inputting 50,000 won for Individual');
        await page.fill('input[class*="amountInput"]', '50000');
        await page.waitForTimeout(500);

        await page.screenshot({ path: path.join(artifactDir, 'b2b_wallet_individual_calc.png') });
        console.log('✓ Screenshot saved: b2b_wallet_individual_calc.png');

        // 모달 닫기
        await page.click('button:has-text("취소")');
        await page.waitForTimeout(500);


        // --- 사업자 실시간 계산기 검증 ---
        console.log('\n--- 4. [Scenario D] /b2b/wallet Calculation (Business) ---');
        // DB에서 임시 유저 정보를 인증 완료 및 사업자 유형으로 업데이트
        const { data: dbUpRes, error: dbUpErr } = await supabase
            .from('b2b_users')
            .update({ identity_verified: true, partner_type: 'business' })
            .eq('id', tempUserId)
            .select();
        console.log('✓ DB Update Result partner_type:', dbUpRes?.[0]?.partner_type, 'Error:', dbUpErr);

        // API 직접 확인
        const apiRes = await supabase.from('b2b_users').select('partner_type').eq('id', tempUserId).single();
        console.log('✓ DB Select Check partner_type:', apiRes.data?.partner_type);

        const verifiedBusinessPayload = {
            ...b2bUserPayload,
            identity_verified: true,
            partner_type: 'business'
        };

        await page.goto(`${LOCAL_SERVER_URL}/b2b`);
        await page.evaluate((u) => {
            localStorage.setItem('b2b_user', JSON.stringify(u));
        }, verifiedBusinessPayload);

        await page.goto(`${LOCAL_SERVER_URL}/b2b/wallet`);
        await page.waitForTimeout(1000);

        console.log('  - Opening Withdrawal Modal (Business)');
        await page.click('button:has-text("환급신청")');
        await page.waitForTimeout(500);

        console.log('  - Inputting 50,000 won for Business');
        await page.fill('input[class*="amountInput"]', '50000');
        await page.waitForTimeout(500);

        await page.screenshot({ path: path.join(artifactDir, 'b2b_wallet_business_calc.png') });
        console.log('✓ Screenshot saved: b2b_wallet_business_calc.png');

        await browser.close();
        console.log('\n🌟 [SUCCESS] ALL UI QA SCENARIOS COMPLETED!');

    } catch (err) {
        console.error('❌ QA Test failed with error:', err);
    } finally {
        // 임시 데이터 정리
        if (tempUserId) {
            console.log('\n--- 5. Clean up QA Temp Data ---');
            await supabase.from('deposits').delete().eq('user_id', tempUserId);
            await supabase.from('b2b_users').delete().eq('id', tempUserId);
            console.log('✓ Database cleaned up successfully');
        }
    }
}

runUIQA();
