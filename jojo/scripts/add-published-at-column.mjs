import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPublishedAtColumn() {
  console.log('b2b_notices 테이블에 published_at 칼럼 추가 및 기존 데이터 업데이트 중...');

  // REST API rpc 또는 direct UPDATE 시도
  // 만약 published_at 컬럼이 없으면 SQL 조회가 필요한데, rpc exec_sql 시도
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      ALTER TABLE b2b_notices ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();
      UPDATE b2b_notices SET published_at = created_at WHERE published_at IS NULL;
    `
  });

  if (error) {
    console.log('RPC execute_sql 미지원 또는 실패:', error.message);
    console.log('대체 방법: supabase direct postgres 연동 또는 API 수정 진행');
  } else {
    console.log('🎉 성공적으로 DB b2b_notices 테이블에 published_at 컬럼이 추가되었습니다!');
  }
}

addPublishedAtColumn();
