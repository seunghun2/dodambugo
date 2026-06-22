import { createClient } from '@supabase/supabase-js';
import CondolenceContent from '@/app/view/[id]/condolence/CondolenceContent';

export const runtime = 'edge';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export default async function B2BCondolencePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ m?: string }>;
}) {
    const { id } = await params;
    const { m } = await searchParams;
    const mournerIndex = parseInt(m || '0', 10);
    const supabaseClient = getSupabase();

    const isUUID = id.includes('-') && id.length > 10;
    
    // DB에서 bugo 계좌 정보 조회 (B2B/B2C 모두 대응하도록 UUID도 체크)
    let bugoQuery = supabaseClient.from('bugo').select('mourner_name, account_info, mourners');
    if (isUUID) {
        bugoQuery = bugoQuery.eq('id', id);
    } else {
        bugoQuery = bugoQuery.eq('bugo_number', id);
    }
    
    const { data: bugo } = await bugoQuery.is('deleted_at', null).single();

    let account = null;
    if (bugo) {
        const allAccounts: Array<{
            relationship: string;
            name: string;
            bank: string;
            holder: string;
            number: string;
        }> = [];

        if (bugo.account_info) {
            try {
                const accounts = typeof bugo.account_info === 'string'
                    ? JSON.parse(bugo.account_info)
                    : bugo.account_info;
                if (Array.isArray(accounts) && accounts.length > 0) {
                    const acc = accounts[0];
                    allAccounts.push({
                        relationship: '',
                        name: bugo.mourner_name || acc.holder || '',
                        bank: acc.bank || '',
                        holder: acc.holder || '',
                        number: acc.number || '',
                    });
                }
            } catch (e) {
                console.error('account_info 파싱 오류:', e);
            }
        }

        if (bugo.mourners && Array.isArray(bugo.mourners)) {
            bugo.mourners.forEach((m: any) => {
                if (m.accountNumber && m.bank) {
                    allAccounts.push({
                        relationship: m.relationship || '',
                        name: m.name || m.accountHolder || '',
                        bank: m.bank || '',
                        holder: m.accountHolder || m.name || '',
                        number: m.accountNumber || '',
                    });
                }
            });
        }

        if (allAccounts.length > 0) {
            account = allAccounts[Math.min(mournerIndex, allAccounts.length - 1)];
        }
    }

    return <CondolenceContent account={account} />;
}
