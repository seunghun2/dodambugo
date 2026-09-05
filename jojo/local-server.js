const { createServer } = require('http');
const next = require('next');

const app = next({ dev: false, hostname: '0.0.0.0', port: 3333 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(3333, (err) => {
    if (err) throw err;
    console.log('🚀 부고온 로컬 프로덕션 서버가 정상 작동 중입니다: http://localhost:3333');
  });
}).catch((err) => {
  console.error('서버 시작 에러:', err);
});
