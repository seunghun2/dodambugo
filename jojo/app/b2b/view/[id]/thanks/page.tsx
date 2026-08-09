import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ThanksContent from '@/app/view/[id]/thanks/ThanksContent';
import '@/app/view/[id]/thanks/thanks.css';

export const runtime = 'edge';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function B2BThanksPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = getSupabase();

    const isUUID = id.includes('-') && id.length > 10;
    let data = null;

    if (isUUID) {
        const result = await supabase
            .from('bugo')
            .select('id, deceased_name, mourner_name, religion, funeral_date, thanks_message, thanks_religion')
            .eq('id', id)
            .single();
        data = result.data;
    } else {
        const result = await supabase
            .from('bugo')
            .select('id, deceased_name, mourner_name, religion, funeral_date, thanks_message, thanks_religion')
            .eq('bugo_number', id)
            .single();
        data = result.data;
    }

    if (!data) {
        notFound();
    }

    return <ThanksContent bugo={data} bugoId={id} isB2bPage={true} />;
}
