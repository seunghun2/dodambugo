import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function fix() {
    const { data } = await sb.from('Facility').select('pricing').eq('id', 'park-0024').single();
    const pi = typeof data!.pricing === 'string' ? JSON.parse(data!.pricing) : data!.pricing;
    let fixed = false;
    pi.standardizedPrices.forEach((g: any) => {
        g.rows.forEach((r: any) => {
            if (r.price === 1899999) { r.price = 1900000; fixed = true; console.log('Fixed: 시신매장비 1,899,999 → 1,900,000'); }
        });
    });
    if (fixed) {
        const { error } = await sb.from('Facility').update({ pricing: pi }).eq('id', 'park-0024');
        console.log(error ? 'Error: ' + error.message : 'Saved!');
    } else { console.log('Not found'); }
}
fix();
