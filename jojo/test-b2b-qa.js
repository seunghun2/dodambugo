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

async function runB2B_QA() {
    console.log('🚀 [START] B2B End-to-End Funeral Creation Automation QA Test');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();

    try {
        // 1. 로그인 페이지 접속 및 세션 우회 주입
        console.log('STEP 1: Injecting B2B Session...');
        await page.goto(`${LOCAL_SERVER_URL}/b2b/login`, { timeout: 60000, waitUntil: 'load' });
        await page.evaluate(({ t, u }) => {
            localStorage.setItem('b2b_token', t);
            localStorage.setItem('b2b_user', JSON.stringify(u));
        }, { t: token, u: b2bUserPayload });

        // 2. 대시보드로 이동 및 수동 연동 제거 검증
        console.log('STEP 2: Navigating to B2B Dashboard...');
        await page.goto(`${LOCAL_SERVER_URL}/b2b/dashboard`, { timeout: 60000, waitUntil: 'load' });
        await page.waitForTimeout(1500);

        // 수동 연동 텍스트가 사라졌는지 검사
        const hasManualSync = await page.locator('text=수동 연동').count();
        if (hasManualSync > 0) {
            console.error('❌ FAIL: Dashboard still contains manual sync block.');
        } else {
            console.log('✓ SUCCESS: Manual sync block is successfully deleted from dashboard.');
        }
        await page.screenshot({ path: `${artifactDir}/02_dashboard_no_manual_sync.png` });

        // 3. 부고장 만들기 페이지 이동
        console.log('STEP 3: Clicking Create Funeral banner...');
        await page.goto(`${LOCAL_SERVER_URL}/b2b/create`);
        await page.waitForTimeout(2000);

        // 4. 고인 정보 기입
        console.log('STEP 4: Entering Deceased Section...');
        await page.locator('input[placeholder="고인명"]').fill('가상_백승훈고인');
        await page.locator('input[placeholder="고인나이"]').fill('88');
        
        // 성별 바텀시트 열고 '남성' 선택
        await page.locator('button:has-text("성별")').click();
        await page.waitForTimeout(500);
        await page.locator('button:has-text("남성")').click();
        await page.waitForTimeout(500);

        // 5. 장례식장 검색 모달 실행
        console.log('STEP 5: Searching Funeral Home in Modal...');
        // '장례식장을 검색해주세요' 텍스트 바 클릭
        await page.locator('text=장례식장을 검색해주세요').click();
        await page.waitForTimeout(500);
        
        // 검색창 입력 및 엔터
        await page.locator('input[placeholder*="장례식장명 또는 주소"]').fill('삼성서울병원');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // 검색 결과 중 첫 번째 리스트 항목 클릭해서 선택 (삼성서울병원 텍스트가 담긴 결과 div 클릭)
        await page.locator('div:has-text("삼성서울병원")').last().click();
        await page.waitForTimeout(1000);

        // 호실(빈소) 기입
        console.log('STEP 5-2: Typing room number...');
        await page.locator('input[placeholder*="호실"]').fill('특2호실');

        // 6. 발인 일정 입력 (발인일자 캘린더 바텀시트 열고 오늘 날짜 클릭)
        console.log('STEP 6: Entering Funeral Dates...');
        await page.locator('text=발인일자').click();
        await page.waitForTimeout(500);
        await page.locator('button[class*="calendarDayToday"]').click();
        await page.waitForTimeout(500);

        // 발인일시 시간 입력 (00:00 placeholder 타격)
        await page.locator('div[class*="dtCard"]:has-text("발인일시") input[placeholder="00:00"]').fill('09:00');
        await page.waitForTimeout(500);

        // 7. 상주 정보 기입
        console.log('STEP 7: Entering Mourner Section...');
        await page.locator('input[placeholder="성함"]').first().fill('가상_백승훈상주');
        
        // 대표상주 관계 선택 (초정밀 mnFieldRelation select 타깃팅)
        await page.locator('div[class*="mnFieldRelation"] select').first().selectOption('아들');
        await page.waitForTimeout(500);

        // 연락처 입력
        await page.locator('input[placeholder="연락처"]').first().fill('01064262393');

        // 8. 미리보기 및 제출
        console.log('STEP 8: Submitting Form for Preview...');
        await page.locator('button:has-text("저장하기")').click();
        await page.waitForTimeout(1500);

        // 미리보기 모달 내의 진짜 등록 버튼 클릭
        console.log('STEP 9: Confirming Submission...');
        await page.locator('button:has-text("최종 생성하기")').click();
        
        // 제출 대기 (API 응답 대기)
        console.log('STEP 10: Waiting for Creation API Response...');
        await page.waitForURL(/\/b2b\/create\/complete\/\d+/, { timeout: 15000 });
        
        const finalUrl = page.url();
        const bugoNumber = finalUrl.split('/').pop();
        console.log(`✓ SUCCESS: Funeral Created successfully! Bugo Number: ${bugoNumber}`);

        // 완료 화면 캡처
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${artifactDir}/03_complete_baek.png` });

        // 9. 부고장 관리 탭 이동 및 노출 확인
        console.log('STEP 11: Verifying in Manage Page...');
        await page.goto(`${LOCAL_SERVER_URL}/b2b/manage`);
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${artifactDir}/04_manage_baek.png` });
        console.log('✓ Manage Page verification screenshot captured.');

    } catch (error) {
        console.error('❌ FAIL: QA Automation execution encountered an error:', error);
        await page.screenshot({ path: `${artifactDir}/00_qa_error.png` });
    } finally {
        await browser.close();
        console.log('🏁 [END] B2B End-to-End QA Script Finished.');
    }
}

runB2B_QA();
