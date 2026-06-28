const { chromium } = require('playwright');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'maeumbugo-b2b-secret-key';
const B2B_USER_ID = '552650f0-3243-4e46-97ec-d2e7ff5de2e2';

const token = jwt.sign({ userId: B2B_USER_ID }, JWT_SECRET);
const b2bUserPayload = {
    id: B2B_USER_ID,
    phone: '01064262393',
    company_name: '부고온 파트너 상조',
    owner_name: '백승훈',
    identity_verified: true,
    partner_type: 'individual'
};

const LOCAL_SERVER_URL = 'http://localhost:3001';
const artifactDir = '/Users/el/.gemini/antigravity/brain/1483b4cf-04de-46a3-8d61-96c597cb6fbb';

async function capturePrint() {
    console.log('🚀 [START] Ritual Print QA Capture');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    // 1. 세션 주입
    console.log('1. Injecting B2B Session...');
    await page.goto(`${LOCAL_SERVER_URL}/b2b/login`);
    await page.evaluate(({ t, u }) => {
        localStorage.setItem('b2b_token', t);
        localStorage.setItem('b2b_user', JSON.stringify(u));
    }, { t: token, u: b2bUserPayload });

    // 2. 의례 페이지 이동
    console.log('2. Navigating to Ritual Page...');
    await page.goto(`${LOCAL_SERVER_URL}/b2b/ritual/8888`);
    await page.waitForTimeout(1500);

    // 3. 위패 탭 선택
    console.log('3. Selecting Wipae Tab...');
    const wipaeTab = page.locator('button:has-text("위패")');
    await wipaeTab.click();
    await page.waitForTimeout(500);

    // 4. 코너 스킨 선택
    console.log('4. Selecting Corner Skin...');
    await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        for (const s of selects) {
            if (s.querySelector('option[value="corner"]')) {
                s.value = 'corner';
                s.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    });
    await page.waitForTimeout(1000);

    // 5. 인쇄 버튼 클릭 및 팝업 대기
    console.log('5. Clicking Print Button...');
    const [printPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.locator('button:has-text("인쇄")').click()
    ]);
    
    console.log('6. Waiting for Print Page load...');
    await printPage.waitForLoadState('networkidle');
    await printPage.waitForTimeout(1000);

    // 7. 인쇄 팝업 내의 .container 영역 캡처
    console.log('7. Capturing Print container...');
    const container = printPage.locator('.container');
    await container.screenshot({ path: `${artifactDir}/corner_print_wipae.png` });
    console.log('✓ Saved: corner_print_wipae.png');

    await browser.close();
    console.log('🌟 [SUCCESS] Print Capture Completed!');
}

capturePrint().catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
