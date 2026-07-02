const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const scratchDir = '/Users/el/Desktop/dodam/jojo/scratch';
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const bugoId = '7206eece-c432-45cb-9e64-43613b93b5d8'; // 정태우님 부고 ID

  console.log('브라우저 실행 중...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  // 1. 로그인 페이지
  console.log('1. 로그인 페이지 이동 중...');
  await page.goto('http://localhost:3001/b2b/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(scratchDir, '01_login.png') });
  console.log('Saved 01_login.png');

  // 로그인 폼 작성
  console.log('로그인 정보 입력 중...');
  await page.fill('input[placeholder="휴대폰 번호 입력"]', '01000000000');
  await page.fill('input[placeholder="비밀번호 입력"]', 'test1234!@');
  await page.click('button:has-text("로그인")');

  // 2. 대시보드 로드 대기
  console.log('2. 로그인 완료 및 대시보드 로딩 대기...');
  await page.waitForURL('**/b2b/dashboard', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(scratchDir, '02_dashboard.png') });
  console.log('Saved 02_dashboard.png');

  // 3. 부고장 작성 페이지 이동
  console.log('3. 부고장 작성 페이지 이동 중...');
  await page.goto('http://localhost:3001/b2b/create', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(scratchDir, '03_create.png') });
  console.log('Saved 03_create.png');

  // 4. 의례 문서 메인 페이지 이동 (지방/위패/축문 선택 화면)
  console.log('4. 의례 문서 페이지 이동 중...');
  await page.goto(`http://localhost:3001/b2b/ritual/${bugoId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(scratchDir, '04_ritual.png') });
  console.log('Saved 04_ritual.png');

  // 5. 위패 미리보기 화면
  console.log('5. 위패 미리보기 탭 캡처 진행 중...');
  // 탭바 내부의 두 번째 버튼(위패)을 클릭
  const tabButtons = await page.$$('div[class*="tabBar"] button, button[class*="tab"]');
  if (tabButtons.length >= 2) {
    await tabButtons[1].click(); // '위패' 탭 클릭
  } else {
    // 대체용 selector 클릭
    await page.click('button:text-is("위패")');
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(scratchDir, '05_wipae.png') });
  console.log('Saved 05_wipae.png');

  // 6. 설정 페이지 이동
  console.log('6. 설정 페이지 이동 중...');
  await page.goto('http://localhost:3001/b2b/settings', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(scratchDir, '06_settings.png') });
  console.log('Saved 06_settings.png');

  await browser.close();
  console.log('모든 스크린샷 캡처 완료!');
})().catch(err => {
  console.error('에러 발생:', err);
  process.exit(1);
});
