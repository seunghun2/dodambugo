import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function main() {
    const { data } = await sb.from('Facility').select('id, name, category').order('id').limit(20);
    if (data) {
        data.forEach((f: any, i: number) => {
            console.log(`${i + 1}. ${f.id} | ${f.name} | ${f.category}`);
        });
    }
}
main();
