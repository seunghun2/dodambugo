import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log('Testing Supabase query...');
  const start = Date.now();
  try {
    const res = await supabase.from('b2b_notices').select('*').limit(3);
    console.log('Done in', Date.now() - start, 'ms');
    console.log('Result:', res);
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
