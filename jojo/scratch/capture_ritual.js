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

async function captureRitual() {
    console.log('🚀 [START] Ritual Skin QA Screenshot Capture');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1200, height: 1200 }
    });
    const page = await context.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // 1. 세션 강제 주입
    console.log('1. Injecting B2B Session...');
    await page.goto(`${LOCAL_SERVER_URL}/b2b/login`);
    await page.evaluate(({ t, u }) => {
        localStorage.setItem('b2b_token', t);
        localStorage.setItem('b2b_user', JSON.stringify(u));
    }, { t: token, u: b2bUserPayload });

    // 2. 위패 페이지 이동
    console.log('2. Navigating to Ritual Detail page for Bugo 8888...');
    await page.goto(`${LOCAL_SERVER_URL}/b2b/ritual/8888`);
    await page.waitForTimeout(2000); // 데이터 로드 및 렌더 대기

    // 3. 위패(wipae) 탭 클릭
    console.log('3. Clicking wipae tab...');
    // tabBar 안의 버튼들 중 텍스트가 '위패'인 것을 찾아 클릭
    await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            if (btn.textContent.trim() === '위패') {
                btn.click();
            }
        }
    });
    await page.waitForTimeout(1000);

    // 4. 스킨을 'scallop'으로 설정하고 캡처
    console.log('4. Selecting Scallop skin...');
    await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        for (const s of selects) {
            if (s.querySelector('option[value="scallop"]')) {
                s.value = 'scallop';
                s.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    });
    await page.waitForTimeout(1000);
    
    // 미리보기 엘리먼트 캡처
    const paper = await page.$('div[class*="jibangPaper"]');
    if (paper) {
        await paper.scrollIntoViewIfNeeded();
        await paper.screenshot({ path: `${artifactDir}/scallop_wipae.png` });
        console.log('✓ Saved: scallop_wipae.png');
    } else {
        await page.screenshot({ path: `${artifactDir}/scallop_wipae_full.png` });
        console.log('✓ Saved: scallop_wipae_full.png (fallback)');
    }

    // 5. 스킨을 'corner'로 설정하고 캡처
    console.log('5. Selecting Corner skin...');
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
    if (paper) {
        await paper.scrollIntoViewIfNeeded();
        await paper.screenshot({ path: `${artifactDir}/corner_wipae.png` });
        console.log('✓ Saved: corner_wipae.png');
    } else {
        await page.screenshot({ path: `${artifactDir}/corner_wipae_full.png` });
        console.log('✓ Saved: corner_wipae_full.png (fallback)');
    }

    await browser.close();
    console.log('🌟 [SUCCESS] Capture completed!');
}

captureRitual();
