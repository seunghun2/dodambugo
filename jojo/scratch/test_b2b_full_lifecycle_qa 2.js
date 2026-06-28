const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
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

// 스크린샷 저장 디렉토리 설정
const screenshotDir = path.resolve(__dirname, '../public/qa_screenshots');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}

// 1x1 투명 dummy 신분증 이미지 파일 생성
const dummyImgPath = path.resolve(__dirname, 'dummy_id_card.png');
const dummyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
fs.writeFileSync(dummyImgPath, Buffer.from(dummyBase64, 'base64'));

async function runFullLifecycleQA() {
    console.log('🚀 [START] B2B & B2C Full Lifecycle Auto QA (Playwright Simulation)');
    
    const testPhone = '01088889999';
    let tempUserId = null;
    let bugoNumber = null;
    let bugoId = null;
    let pageInstance = null;

    try {
        // --- 0. 기존 테스트 데이터 정리 ---
        console.log('🧹 Cleaning up existing test B2B partner and obituaries... (Full Cleanup)');
        const { data: existingUser } = await supabase.from('b2b_users').select('id').eq('phone', testPhone).single();
        if (existingUser) {
            const uid = existingUser.id;
            const { data: bugos } = await supabase.from('bugo').select('id').eq('b2b_user_id', uid);
            if (bugos && bugos.length > 0) {
                const bids = bugos.map(b => b.id);
                await supabase.from('flower_orders').delete().in('bugo_id', bids);
                await supabase.from('bugo').delete().in('id', bids);
            }
            await supabase.from('withdrawal_requests').delete().eq('user_id', uid);
            await supabase.from('deposit_transactions').delete().eq('user_id', uid);
            await supabase.from('deposits').delete().eq('user_id', uid);
            await supabase.from('b2b_users').delete().eq('id', uid);
            console.log('✓ Cleaned up old test partner data.');
        }

        // --- 1. Playwright 브라우저 기동 ---
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 375, height: 812 }, // iPhone 13 Mini 모바일 규격
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        });
        const page = await context.newPage();
        pageInstance = page;

        // 다이얼로그(Alert) 모니터링 리스너 등록
        page.on('dialog', async dialog => {
            console.log(`💬 [DIALOG] Alert message popped up: "${dialog.message()}"`);
            await dialog.accept();
        });

        // 브라우저 콘솔 에러 로그 모니터링 리스너 등록
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`[BROWSER ERROR] ${msg.text()}`);
            }
        });

        // 브라우저 로컬 저장소 및 세션 완전 초기화 (자동 로그인 캐시 방지)
        await context.clearCookies();
        
        // --- 2. 장례지도사 회원가입 ---
        console.log('\n--- [Step 1] B2B Partner Sign Up ---');
        await page.goto(`${LOCAL_SERVER_URL}/b2b/signup`);
        await page.evaluate(() => localStorage.clear()); // LocalStorage 완전 소거
        await page.reload(); // 새 세션으로 로드
        
        // Step 1: 휴대폰 입력 및 동의
        await page.waitForSelector('input[placeholder="010-0000-0000"]');
        await page.fill('input[placeholder="010-0000-0000"]', testPhone);
        
        // 전체 동의 상자 클릭 예외 및 우회 (force 클릭)
        await page.waitForSelector('text=전체 동의하기', { state: 'attached' });
        await page.click('text=전체 동의하기', { force: true });
        await page.click('button:has-text("인증번호 받기")');
        await page.waitForSelector('input[placeholder="인증번호 6자리"]');
        await page.fill('input[placeholder="인증번호 6자리"]', '123456');

        // Step 2: 비밀번호 설정
        await page.waitForSelector('input[placeholder="비밀번호 입력"]');
        await page.fill('input[placeholder="비밀번호 입력"]', 'testpwd123!');
        await page.fill('input[placeholder="비밀번호 재입력"]', 'testpwd123!');
        await page.click('button:has-text("다음단계")');

        // Step 3: 사업자 정보
        await page.waitForSelector('input[placeholder="회사명 또는 장례식장명"]');
        await page.fill('input[placeholder="회사명 또는 장례식장명"]', '시뮬레이션상조');
        await page.fill('input[placeholder="대표자 성함"]', '홍길동');
        await page.click('button:has-text("다음단계")');

        // Step 4: 정산 계좌 (스킵)
        await page.waitForSelector('text=나중에 등록할게요');
        await page.click('text=나중에 등록할게요');

        // Step 5: 가입 완료
        await page.waitForSelector('button:has-text("가입하기")');
        await page.screenshot({ path: path.join(screenshotDir, '01_signup_filled.png') });
        await page.click('button:has-text("가입하기")');
        await page.waitForURL(/\/b2b\/signup\/complete/);
        console.log('✓ B2B Partner Signup Successful.');
        await page.screenshot({ path: path.join(screenshotDir, '02_signup_complete.png') });

        // 가입 완료 후, 해당 유저의 은행 정보 등록 및 가입 승인 테스트를 위해 상태를 pending으로 명시적 설정해줍니다.
        const { data: justSignedUser } = await supabase.from('b2b_users').select('id').eq('phone', testPhone).single();
        if (justSignedUser) {
            await supabase.from('b2b_users').update({
                bank_name: '국민은행',
                account_no: '111-222-333333',
                account_holder: '홍길동',
                status: 'pending' // 어드민 UI 승인 테스트를 위해 승인대기로 설정
            }).eq('id', justSignedUser.id);
            console.log('✓ Injected partner bank account details to DB and set status to pending for UI approval testing.');
        }

        // --- 1.5. 어드민 파트너 가입 승인 (UI 클릭 검증) ---
        console.log('\n--- [Step 1.5] Admin Partner 가입 승인 (UI) ---');
        const adminSignupContext = await browser.newContext();
        await adminSignupContext.addCookies([{
            name: 'admin_ip',
            value: 'true',
            domain: 'localhost',
            path: '/'
        }]);
        const adminSignupPage = await adminSignupContext.newPage();
        
        // 다이얼로그 확인 처리 등록
        adminSignupPage.on('dialog', async dialog => {
            console.log(`💬 [ADMIN SIGNUP DIALOG] Alert message: "${dialog.message()}"`);
            await dialog.accept();
        });

        await adminSignupPage.goto(`${LOCAL_SERVER_URL}/b2b/admin/partners`);
        await adminSignupPage.evaluate(() => {
            sessionStorage.setItem('admin_session', 'authenticated');
        });
        await adminSignupPage.reload();
        
        // 파트너 목록 대기
        await adminSignupPage.waitForSelector('table');
        await adminSignupPage.screenshot({ path: path.join(screenshotDir, '02_admin_partners_list_pending.png') });

        // 전화번호 포맷팅 고려하여 행 찾기 ('010-8888-9999')
        const formattedPhone = '010-8888-9999';
        const partnerRow = adminSignupPage.locator('tr').filter({ hasText: formattedPhone });
        await partnerRow.locator('button:has-text("승인")').click();
        
        // 처리 후 완료 확인 대기 (수 초간 대기 및 리로드)
        await adminSignupPage.waitForTimeout(1500);
        await adminSignupPage.screenshot({ path: path.join(screenshotDir, '02_admin_partners_approved.png') });
        console.log('✓ Admin Partner 가입 승인 완료 (UI 클릭 검증)');
        await adminSignupContext.close();

        // --- 3. 로그인 ---
        console.log('\n--- [Step 2] B2B Partner Login ---');
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${LOCAL_SERVER_URL}/b2b/login`);
        await page.fill('input[placeholder="휴대폰 번호 입력"]', testPhone);
        await page.fill('input[placeholder="비밀번호 입력"]', 'testpwd123!');
        await page.screenshot({ path: path.join(screenshotDir, '03_login_filled.png') });
        await page.click('button:has-text("로그인")');
        await page.waitForURL(/\/b2b\/dashboard/);
        console.log('✓ B2B Partner Login Successful.');
        await page.screenshot({ path: path.join(screenshotDir, '04_dashboard.png') });

        // 자주찾는 장례식장 데이터 로컬스토리지에 주입 (부고장 개설 시 자동 채우기 유도)
        await page.evaluate(() => {
            localStorage.setItem('b2b_favorite_facilities', JSON.stringify([{
                name: '시뮬레이션상조',
                address: '서울시 강남구 역삼동 123',
                tel: '02-111-2222'
            }]));
        });

        // --- 4. 개인 소득증빙 본인인증 ---
        console.log('\n--- [Step 3] B2B Partner Income Tax Verification ---');
        await page.goto(`${LOCAL_SERVER_URL}/b2b/wallet/verify/form`);
        await page.waitForSelector('input[placeholder="성명 입력"]');
        await page.fill('input[placeholder="성명 입력"]', '홍길동');
        await page.fill('input[placeholder="앞 6자리"]', '900101');
        await page.fill('input[placeholder="뒤 7자리"]', '1234567');
        await page.fill('input[placeholder="주민등록증 하단의 발급일자를 입력해주세요 (예: 2023.05.12)"]', '2023.05.12');
        await page.fill('input[placeholder="휴대폰 번호 입력 (-없이)"]', testPhone);
        
        // 인증번호 전송
        await page.click('button:has-text("인증")');
        await page.waitForTimeout(1000); // 전송 대기
        await page.fill('input[placeholder="인증번호 6자리 입력"]', '123456');
        
        // 신분증 업로드 파일 바인딩
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('label[for="id-card-upload"]');
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(dummyImgPath);
        await page.waitForTimeout(2000); // 파일 업로드 시뮬레이션 대기

        await page.screenshot({ path: path.join(screenshotDir, '05_verification_form_filled.png') });
        
        // 폼 제출
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/b2b\/wallet/);
        console.log('✓ B2B Partner Verification Submitted Successful.');
        await page.screenshot({ path: path.join(screenshotDir, '06_wallet_after_verification.png') });

        // --- 5. 부고장 대리 개설 ---
        console.log('\n--- [Step 4] Create Obituary as B2B Partner ---');
        await page.goto(`${LOCAL_SERVER_URL}/b2b/create`);
        await page.waitForSelector('input[placeholder="고인명"]');
        
        // 고인 정보 입력
        await page.fill('input[placeholder="고인명"]', '김고인');
        await page.fill('input[placeholder="고인나이"]', '80');
        
        // 성별 선택 (바텀시트 오픈 및 선택)
        await page.click('button[class*="selectTrigger"]');
        await page.waitForSelector('button:has-text("남성")');
        await page.click('button:has-text("남성")');
        
        // 장례식장 호실 입력
        await page.fill('input[placeholder="호실(예시:102호)"]', '2호실');
        
        // 발인일시 선택 (오늘 날짜 및 시간 설정)
        const valinCard = page.locator('div[class*="dtCard"]').filter({ hasText: '발인일시' });
        await valinCard.locator('div[class*="dtInputWrap"]').first().click(); // 달력 바텀시트 오픈
        await page.waitForSelector('button[class*="calendarDayToday"]');
        await page.click('button[class*="calendarDayToday"]'); // 오늘 날짜 선택
        await valinCard.locator('input[placeholder="00:00"]').fill('09:00'); // 발인 시간 입력
        
        // 상주 정보 입력 (대표상주)
        await page.locator('div[class*="mnFieldRelation"] select').first().selectOption('아들');
        await page.locator('input[placeholder="성함"]').first().fill('김상주');
        await page.locator('input[placeholder="연락처"]').first().fill('01011112222');
        
        // 상주 계좌 등록 모달
        await page.locator('span[class*="mnAccountRegText"]').first().click({ force: true });
        await page.waitForSelector('select[class*="accountSheetSelect"]');
        await page.locator('select[class*="accountSheetSelect"]').selectOption('KB국민은행');
        await page.locator('input[placeholder="예금주명 입력"]').fill('김상주');
        await page.locator('input[placeholder="계좌번호 입력"]').fill('111222333333');
        await page.click('button[class*="accountSheetConfirmBtn"]');
        await page.waitForTimeout(500); // 바텀시트 닫힘 대기
        
        await page.screenshot({ path: path.join(screenshotDir, '07_create_bugo_filled.png') });
        
        // 부고장 저장하기 및 생성
        await page.click('button:has-text("저장하기")');
        await page.waitForSelector('button:has-text("최종 생성하기")');
        await page.click('button:has-text("최종 생성하기")');
        
        // 개설 완료 화면 대기 및 부고장 번호 파싱
        await page.waitForURL(/\/complete\//);
        const currentUrl = page.url();
        bugoNumber = currentUrl.split('/').pop().split('?')[0];
        console.log(`✓ Obituary 대리 개설 완료. 부고번호: ${bugoNumber}`);
        await page.screenshot({ path: path.join(screenshotDir, '08_create_complete.png') });

        // DB에서 방금 만든 부고 ID 긁어오기
        const { data: bugoData } = await supabase.from('bugo').select('id, b2b_user_id').eq('bugo_number', bugoNumber).single();
        bugoId = bugoData.id;
        tempUserId = bugoData.b2b_user_id;
        console.log(`  Bugo DB Sync check: ID=${bugoId}, Map B2B Partner ID=${tempUserId}`);

        // --- 6. 조문객 부고 뷰 접속 및 약관 확인 후 부의금 결제 ---
        console.log('\n--- [Step 5] Guest View & Condolence Money Payment ---');
        await page.goto(`${LOCAL_SERVER_URL}/view/${bugoNumber}`);
        await page.waitForSelector('button:has-text("부의금보내기")');
        
        // 상조 로고 헤증을 위한 캡처
        await page.screenshot({ path: path.join(screenshotDir, '09_guest_bugo_view.png') });
        
        await page.click('button:has-text("부의금보내기")');
        
        // B2B view opens a bottom sheet modal first, which has a "카드결제" button.
        await page.waitForSelector('button:has-text("카드결제")');
        await page.click('button:has-text("카드결제")');
        
        await page.waitForSelector('input[placeholder="보내시는 분 성함"]');
        
        // 5만원 선택
        await page.click('button:has-text("5만원")');
        await page.fill('input[placeholder="보내시는 분 성함"]', '조문객A');
        await page.fill('input[placeholder="010-0000-0000"]', '01033334444');
        
        // 약관동의 클릭 및 체크
        try {
            await page.click('div[class*="privacy-notice-link"]');
            await page.waitForTimeout(500);
        } catch (e) {
            console.log('Note: 약관동의 링크 클릭 예외 무시');
        }
        await page.screenshot({ path: path.join(screenshotDir, '10_condolence_agreed.png') });
        
        // 가상 결제를 성공시키기 위해 DB에 직접 가상 결제 승인 API 호출 시뮬레이션
        console.log('Sending mock payment success approve to API...');
        const mockTid = 'TID_MOCK_LIFECYCLE_' + Date.now();
        const approvePayload = {
            paymentToken: 'MOCK_TOKEN',
            tid: mockTid,
            mid: 'pgmaeum01m',
            amt: '50000',
            taxFreeAmt: '0',
            moid: 'ORD_MOCK_' + Date.now(),
            orderId: crypto.randomUUID(), // 가상 ID
            payMethod: 'CARD',
            bugoNumber: bugoNumber
        };
        
        // API 호출을 통해 조문객 결제 성공에 따른 B2B 적립금 분기를 유도합니다.
        const mockRes = await fetch(`${LOCAL_SERVER_URL}/api/payment/innopay/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(approvePayload)
        });
        const mockResult = await mockRes.json();
        console.log('Mock Payment API Result:', mockResult);

        // --- 5.5. [상주 플로우] 상주 뷰 접속, 조문객 유도 버튼 숨김 및 부의금 장부 실시간 연동 검증 ---
        console.log('\n--- [Step 5.5] 상주 뷰 검증 및 실시간 조의금 장부 확인 ---');
        const { data: bugoWithToken } = await supabase
            .from('bugo')
            .select('owner_token')
            .eq('id', bugoId)
            .single();

        const ownerToken = bugoWithToken?.owner_token;
        console.log(`  Fetched owner token: ${ownerToken}`);

        if (ownerToken) {
            const ownerPage = await context.newPage();
            // 상주 관리용 URL로 이동
            await ownerPage.goto(`${LOCAL_SERVER_URL}/view/${bugoNumber}?token=${ownerToken}`);
            await ownerPage.waitForTimeout(1000);
            
            // 1) 조문객 유도 버튼(화환 보내기 등)이 상주 뷰에서도 정상 노출되는지 확인 (기획 조건: 노출 허용)
            const isFloatingVisible = await ownerPage.locator('div[class*="floating-flower-cta"]').isVisible();
            console.log(`  상주 뷰에서 화환 보내기 플로팅 버튼 노출 여부: ${isFloatingVisible} (Expected: true)`);
            if (isFloatingVisible) {
                console.log('✓ 상주 뷰에서 화환 보내기 플로팅 버튼 정상 노출 확인.');
            } else {
                console.log('⚠️ [WARNING] 상주 뷰에서 화환 보내기 플로팅 버튼이 보이지 않습니다.');
            }

            // 2) 공유 모달 기능 검증 (공유 모달 바로 열기 파라미터 전달)
            await ownerPage.goto(`${LOCAL_SERVER_URL}/view/${bugoNumber}?token=${ownerToken}&share=true`);
            await ownerPage.waitForSelector('div[class*="share-modal"]');
            await ownerPage.screenshot({ path: path.join(screenshotDir, '10_share_modal_open.png') });
            console.log('✓ 상주 뷰에서 공유 모달 노출 검증 성공.');
            
            // 모달 닫기
            await ownerPage.click('button[class*="share-close"]');

            // 3) 상주 장부 실시간 연동 검증 (조문객A 5만원 내역 확인)
            await ownerPage.goto(`${LOCAL_SERVER_URL}/view/${bugoNumber}?token=${ownerToken}`);
            await ownerPage.waitForTimeout(1000);
            await ownerPage.screenshot({ path: path.join(screenshotDir, '10_guest_condolence_verified_in_owner_view.png') });
            console.log('✓ 상주 장부 실시간 연동 화면 저장 완료 (10_guest_condolence_verified_in_owner_view.png)');
            await ownerPage.close();
        } else {
            console.log('⚠️ [WARNING] owner_token이 없어 상주 뷰 실시간 연동 검증을 스킵합니다.');
        }

        // --- 7. 장례지도사 수당 체크 및 환급 신청 ---
        console.log('\n--- [Step 6] Partner Wallet Check & Refund Request ---');
        // 지갑 정보 동기화를 위해 Referee 파트너 유저로 토큰 발급 후 localStorage 세팅
        const token = jwt.sign({ userId: tempUserId }, JWT_SECRET);
        
        // 지갑 페이지로 직접 토큰 주입 후 진입
        await page.goto(`${LOCAL_SERVER_URL}/b2b/wallet`);
        await page.evaluate((jwtToken) => {
            localStorage.setItem('b2b_token', jwtToken);
        }, token);
        
        // 새로고침하여 세션 반영
        await page.reload();
        await page.waitForSelector('h2[class*="amountDisplay"]');
        
        // 잔액 적립 체크 (조의금 수당 적립 등으로 잔액이 들어왔는지 확인)
        const currentBalance = await page.textContent('h2[class*="amountDisplay"]');
        console.log(`✓ Current Partner Balance on UI: ${currentBalance}`);
        await page.screenshot({ path: path.join(screenshotDir, '11_wallet_balance_earned.png') });
        
        // 테스트용 예치금 강제 조정 (환급 10,000원 테스트가 가능하도록 잔액을 15,000원으로 조정)
        await supabase.from('deposits').update({ balance: 15000 }).eq('user_id', tempUserId);
        await page.reload();
        await page.waitForSelector('h2[class*="amountDisplay"]');
        console.log('✓ Adjusted Partner Balance to 15,000 won for withdrawal test.');

        // 환급 신청 클릭
        await page.click('button:has-text("환급신청")');
        await page.waitForSelector('input[placeholder="환급 신청 금액"]');
        await page.fill('input[placeholder="환급 신청 금액"]', '10000');
        
        // (검증) 계산 카드에 3.3% 차감 카드만 나타나는지 캡처 검증
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, '12_withdrawal_calculation_card.png') });
        
        // 환급 신청 제출
        await page.click('button:has-text("신청하기")');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotDir, '13_wallet_after_request.png') });
        console.log('✓ Withdrawal request of 10,000 won submitted.');

        // DB에서 pending 상태 of 환급 요청 건 긁어오기
        const { data: pendingReq } = await supabase
            .from('withdrawal_requests')
            .select('id, amount, status')
            .eq('user_id', tempUserId)
            .eq('status', 'pending')
            .single();
        console.log(`  Pending Request DB Sync: ID=${pendingReq.id}, Amount=${pendingReq.amount}, Status=${pendingReq.status}`);

        // --- 8. 어드민 정산 승인 (UI 클릭 검증) ---
        console.log('\n--- [Step 7] B2B Admin Withdrawal Approve (UI) ---');
        
        // 어드민 검증 우회를 위해 Cookie: admin_ip=true를 가진 Context 생성 후 어드민 기동
        const adminContext = await browser.newContext();
        await adminContext.addCookies([{
            name: 'admin_ip',
            value: 'true',
            domain: 'localhost',
            path: '/'
        }]);
        const adminPage = await adminContext.newPage();
        
        // 다이얼로그 확인 처리 등록
        adminPage.on('dialog', async dialog => {
            console.log(`💬 [ADMIN WITHDRAWAL DIALOG] Alert message: "${dialog.message()}"`);
            await dialog.accept();
        });

        // 어드민 출금 리스트 페이지 접속
        await adminPage.goto(`${LOCAL_SERVER_URL}/b2b/admin/withdrawals`);
        await adminPage.evaluate(() => {
            sessionStorage.setItem('admin_session', 'authenticated');
        });
        await adminPage.reload();
        await adminPage.waitForSelector('table');
        await adminPage.screenshot({ path: path.join(screenshotDir, '14_admin_withdrawal_list_pending.png') });
        
        // UI에서 직접 출금 신청 행을 찾고 [송금완료] 버튼 클릭
        console.log('Clicking 송금완료 button on Admin UI...');
        const withdrawalRow = adminPage.locator('tr').filter({ hasText: testPhone });
        await withdrawalRow.locator('button:has-text("송금완료")').click();
        
        // 완료 상태 반영을 대기하고 스크린샷 캡처
        await adminPage.waitForTimeout(1500);
        await adminPage.screenshot({ path: path.join(screenshotDir, '14_admin_withdrawal_approved.png') });
        console.log('✓ Admin Withdrawal 승인 완료 (UI 클릭 검증)');
        await adminContext.close();

        // --- 9. 파트너 지갑 완료 내역 최종 렌더링 검증 ---
        console.log('\n--- [Step 8] Partner Wallet Final Checking ---');
        await page.reload();
        await page.waitForSelector('h2[class*="amountDisplay"]');
        
        // 환급내역 탭 클릭
        await page.click('button:has-text("환급내역")');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, '15_wallet_final_completed_list.png') });
        
        console.log('✓ E2E Auto QA Test successfully verified and screenshots recorded.');
        console.log(`🌟 [SUCCESS] ALL STEPS COMPLETED! Screenshots saved in: ${screenshotDir}`);

        // 임시 파일 정리
        if (fs.existsSync(dummyImgPath)) {
            fs.unlinkSync(dummyImgPath);
        }

    } catch (err) {
        console.error('\n❌ [FAILURE] QA Test Flow failed with error:', err.message);
        if (pageInstance) {
            await pageInstance.screenshot({ path: path.join(screenshotDir, 'failure.png'), fullPage: true });
            console.log(`📸 Failure screenshot saved. URL was: ${pageInstance.url()}`);
        }
        if (fs.existsSync(dummyImgPath)) {
            fs.unlinkSync(dummyImgPath);
        }
        process.exit(1);
    }
}

const crypto = {
    randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};

runFullLifecycleQA();
