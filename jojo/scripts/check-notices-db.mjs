import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('현재 연결된 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotices() {
  const { data, error, count } = await supabase
    .from('b2b_notices')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('조회 오류:', error);
  } else {
    console.log(`현재 DB b2b_notices 레코드 개수: ${count}개`);
    console.log('데이터 샘플:', JSON.stringify(data, null, 2));
  }
}

checkNotices();
