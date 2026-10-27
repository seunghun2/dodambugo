import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_COMPANIES = [
    { id: 'dodam', name: '도담상조' },
    { id: 'preed', name: '프리드라이프' },
    { id: 'boram', name: '보람상조' },
    { id: 'daemyung', name: '대명아임레디' },
    { id: 'kyowon', name: '교원라이프' },
    { id: 'thereborn', name: '더리본' },
    { id: 'general', name: '부고온 파트너 상조' },
];

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('b2b_companies')
            .select('id, name')
            .eq('is_active', true)
            .order('name');

        if (error || !data || data.length === 0) {
            return NextResponse.json({ success: true, companies: DEFAULT_COMPANIES });
        }

        return NextResponse.json({ success: true, companies: data });
    } catch {
        return NextResponse.json({ success: true, companies: DEFAULT_COMPANIES });
    }
}
