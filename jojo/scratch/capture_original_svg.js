const { chromium } = require('playwright');
const path = require('path');

const originalSvgUrl = 'file://' + path.resolve(__dirname, '../위패 관련/아트보드 – 1.svg');
const artifactDir = '/Users/el/.gemini/antigravity/brain/1483b4cf-04de-46a3-8d61-96c597cb6fbb';

async function captureOriginal() {
    console.log('🚀 Capturing original SVG layout...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1600, height: 1200 }
    });
    const page = await context.newPage();
    
    await page.goto(originalSvgUrl);
    await page.waitForTimeout(1000);

    // B2B 이용신청서 위패축문확인에 해당하는 영역 크기나 뷰박스
    // 아트보드 1.svg의 전체 스크린샷 저장
    await page.screenshot({ path: `${artifactDir}/original_artboard_1.png` });
    console.log('✓ Saved: original_artboard_1.png');

    // 특정 그룹 (g#그룹_876 이나 코너장식 부근) 캡처
    // svg 파일 내부의 rect나 특정 id를 타겟으로 크롭 캡처 가능
    // g#그룹_876의 bounding box를 구해서 크롭해본다.
    // translate(320.827 141.932) 내부의 translate(994.081 76.118) 부근
    // 절대좌표: X = 320.827 + 994.081 = 1314.9, Y = 141.932 + 76.118 = 218.0
    // 가로 40, 세로 40 크기로 캡처해보자.
    await page.screenshot({
        path: `${artifactDir}/original_corner_detail.png`,
        clip: {
            x: 1300,
            y: 200,
            width: 80,
            height: 80
        }
    });
    console.log('✓ Saved: original_corner_detail.png');

    await browser.close();
    console.log('🌟 Done!');
}

captureOriginal();
