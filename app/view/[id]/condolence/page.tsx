import { supabase } from '@/lib/supabase';
import CondolenceContent from './CondolenceContent';

export default async function CondolencePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ m?: string }>;
}) {
    const { id } = await params;
    const { m } = await searchParams;
    const mournerIndex = parseInt(m || '0', 10);

    // DB에서 bugo 계좌 정보 조회
    const { data: bugo } = await supabase
        .from('bugo')
        .select('mourner_name, account_info, mourners')
        .eq('bugo_number', id)
        .is('deleted_at', null)
        .single();

    let account = null;
    if (bugo) {
        const allAccounts: Array<{
            relationship: string;
            name: string;
            bank: string;
            holder: string;
            number: string;
        }> = [];

        // 대표상주 계좌 (account_info는 JSON 문자열)
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

        // 추가상주 계좌 (mourners 배열)
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

        // 선택된 상주 계좌
        if (allAccounts.length > 0) {
            account = allAccounts[Math.min(mournerIndex, allAccounts.length - 1)];
        }
    }

    return <CondolenceContent account={account} />;
}
