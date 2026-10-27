import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export default async function EditRedirectPage({ params }: { params: Promise<{ bugoNumber: string }> }) {
    const { bugoNumber } = await params;
    const supabase = getSupabase();

    const { data } = await supabase
        .from('bugo')
        .select('template_id')
        .eq('bugo_number', bugoNumber)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle();

    const template = data?.template_id || 'basic';
    redirect(`/create/${template}?edit=${bugoNumber}`);
}
