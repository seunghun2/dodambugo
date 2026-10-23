// 실제 서비스 부고장 화면(view.css + 동일 마크업)을 홍길동 샘플로 캡처하여 홈페이지 목업 이미지 생성
// 사용: node scripts/capture_templates.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const VIEW_CSS = path.join(ROOT, 'app/view/[id]/view.css');
const IMG = (n) => `file://${path.join(ROOT, 'public/images', n)}`;

function headerHtml(template, bgFile) {
    return `
    <div class="header-section template-${template}">
        <img src="${IMG(bgFile)}" class="header-bg" alt="" />
        <div class="header-text-overlay">
            <div class="header-deceased-info no-religious-title">
                <div class="header-deceased-title">故 홍길동님<span class="header-deceased-age"> (87세)</span></div>
            </div>
            <p class="header-dynamic-text">
                10월 5일 故 홍길동님께서<br />
                별세하셨기에 삼가 알려드립니다.<br />
                마음으로 따뜻한 위로 부탁드리며<br />
                고인의 명복을 빌어주시길 바랍니다.
            </p>
        </div>
    </div>`;
}

const INFO_TABLE = `
    <div class="section-divider"></div>
    <section class="section">
        <div class="funeral-info-table">
            <div class="funeral-info-row funeral-highlight"><span class="funeral-info-label">고인</span><span class="funeral-info-value">故홍길동 (향년 87세)</span></div>
            <div class="funeral-info-divider"></div>
            <div class="funeral-info-row funeral-highlight"><span class="funeral-info-label">발인</span><span class="funeral-info-value">2026.10.07(수) 08:00</span></div>
            <div class="funeral-info-divider"></div>
            <div class="funeral-info-row"><span class="funeral-info-label">별세</span><span class="funeral-info-value">2026.10.05(월) 21:55</span></div>
        </div>
    </section>`;

function page(inner) {
    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
    <link rel="stylesheet" href="file://${VIEW_CSS}">
    <style>html,body{margin:0;padding:0;background:#fff;overflow:hidden}</style>
    </head><body><main class="view-page">${inner}</main></body></html>`;
}

const TASKS = [
    // 폰 화면용: 헤더 + 고인 정보 일부 (폰이 짧아 첫 화면 분량만 사용)
    { out: 'mockup-bugo-main-v2.png', h: 759, html: page(headerHtml('basic', 'template-basic.png') + INFO_TABLE) },
    // 히어로 카드용: 헤더만
    { out: 'mockup-bugo-hero-v2.png', h: 650, html: page(headerHtml('basic', 'template-basic.png')) },
    { out: 'mockup-bugo-flower-v2.png', h: 650, html: page(headerHtml('flower', 'template-flower.png')) },
    { out: 'mockup-bugo-ribbon-v2.png', h: 650, html: page(headerHtml('ribbon', 'template-ribbon.png')) },
];

(async () => {
    const browser = await chromium.launch({ headless: true });
    const tmp = path.join(ROOT, 'scripts', '.tmp_capture.html');
    for (const t of TASKS) {
        const ctx = await browser.newContext({ viewport: { width: 360, height: t.h }, deviceScaleFactor: 2 });
        const p = await ctx.newPage();
        fs.writeFileSync(tmp, t.html);
        await p.goto(`file://${tmp}`, { waitUntil: 'networkidle' });
        await p.evaluate(() => document.fonts.ready);
        await p.waitForTimeout(600);
        await p.screenshot({ path: path.join(ROOT, 'public/images', t.out), clip: { x: 0, y: 0, width: 360, height: t.h } });
        console.log('Saved', t.out);
        await ctx.close();
    }
    fs.unlinkSync(tmp);
    await browser.close();
})();
