// 구글 공식 크롤러/페처 IPv4 대역 스냅샷 생성 → jojo/lib/googleIp.generated.ts
// 사용: node jojo/scripts/gen-google-ips.js  (구글이 대역을 갱신하면 재실행 후 커밋)
// 출처: https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests
const fs = require('fs');
const path = require('path');
const base = 'https://developers.google.com/static/crawling/ipranges/';
const files = ['common-crawlers', 'special-crawlers', 'user-triggered-fetchers', 'user-triggered-fetchers-google', 'user-triggered-agents'];
(async () => {
  const set = new Set();
  for (const f of files) {
    const r = await fetch(`${base}${f}.json`).then((x) => x.json());
    for (const p of r.prefixes || []) if (p.ipv4Prefix) set.add(p.ipv4Prefix);
  }
  const list = [...set].sort();
  const out = `// 자동 생성 파일 - 직접 수정 금지 (scripts/gen-google-ips.js)\n// 생성일: ${new Date().toISOString().slice(0, 10)} / ${list.length}개 CIDR\nexport const GOOGLE_CRAWLER_CIDRS: string[] = ${JSON.stringify(list)};\n`;
  fs.writeFileSync(path.join(__dirname, '../lib/googleIp.generated.ts'), out);
  console.log('written', list.length);
})();
