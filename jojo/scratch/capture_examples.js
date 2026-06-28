const { chromium } = require('playwright');
const path = require('path');

const artifactDir = '/Users/el/.gemini/antigravity/brain/1483b4cf-04de-46a3-8d61-96c597cb6fbb';

async function captureExamples() {
    console.log('🚀 Capturing example SVGs...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // 1. (00)예시_위패사이즈 및 디자인.svg
    const file1 = 'file://' + path.resolve(__dirname, '../위패 관련/(00)예시_위패사이즈 및 디자인.svg');
    await page.goto(file1);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${artifactDir}/example_wipae_design.png` });
    console.log('✓ Saved: example_wipae_design.png');

    // 2. (00)예시_위패사이즈 및 디자인변경.svg
    const file2 = 'file://' + path.resolve(__dirname, '../위패 관련/(00)예시_위패사이즈 및 디자인변경.svg');
    await page.goto(file2);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${artifactDir}/example_wipae_design_change.png` });
    console.log('✓ Saved: example_wipae_design_change.png');

    await browser.close();
    console.log('🌟 Done!');
}

captureExamples().catch(err => {
    console.error(err);
});
