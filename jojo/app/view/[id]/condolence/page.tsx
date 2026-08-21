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

    // DB에서 bugo 계좌 정보 조회 (UUID 및 bugo_number 둘 다 완벽 지원)
    const isUUID = id.includes('-') && id.length > 10;
    const query = supabase
        .from('bugo')
        .select('mourner_name, account_info, mourners')
        .is('deleted_at', null);

    const { data: bugo } = isUUID
        ? await query.eq('id', id).single()
        : await query.eq('bugo_number', id).order('created_at', { ascending: false }).limit(1).single();

    let account = null;
    if (bugo) {
        let mournersArr: any[] = [];
        if (Array.isArray(bugo.mourners)) {
            mournersArr = bugo.mourners;
        } else if (typeof bugo.mourners === 'string') {
            try { mournersArr = JSON.parse(bugo.mourners); } catch (e) {}
        }

        const isNumeric = /^\d+$/.test(m || '');
        let targetMourner: any = null;

        if (m) {
            if (isNumeric) {
                const idx = parseInt(m, 10);
                if (idx >= 0 && idx < mournersArr.length) {
                    targetMourner = mournersArr[idx];
                }
            } else {
                targetMourner = mournersArr.find((item: any) => item.name === m);
            }
        }

        // 1. 지정된 상주의 계좌가 있으면 그 계좌 사용
        if (targetMourner && targetMourner.bank && (targetMourner.accountNumber || targetMourner.number)) {
            account = {
                relationship: targetMourner.relationship || '',
                name: targetMourner.name || targetMourner.accountHolder || '',
                bank: targetMourner.bank || '',
                holder: targetMourner.accountHolder || targetMourner.account_holder || targetMourner.holder || targetMourner.name || '',
                number: targetMourner.accountNumber || targetMourner.number || '',
            };
        }

        // 2. 만약 지정 상주 계좌가 없으면, mournersArr 전체 중 첫 번째 유효 계좌 찾기
        if (!account && mournersArr.length > 0) {
            const firstWithAcc = mournersArr.find((item: any) => item.bank && (item.accountNumber || item.number));
            if (firstWithAcc) {
                account = {
                    relationship: firstWithAcc.relationship || '',
                    name: firstWithAcc.name || firstWithAcc.accountHolder || '',
                    bank: firstWithAcc.bank || '',
                    holder: firstWithAcc.accountHolder || firstWithAcc.account_holder || firstWithAcc.holder || firstWithAcc.name || '',
                    number: firstWithAcc.accountNumber || firstWithAcc.number || '',
                };
            }
        }

        // 3. 그래도 없으면 account_info fallback
        if (!account && bugo.account_info) {
            try {
                const accounts = typeof bugo.account_info === 'string'
                    ? JSON.parse(bugo.account_info)
                    : bugo.account_info;
                if (Array.isArray(accounts) && accounts.length > 0) {
                    const acc = accounts[0];
                    account = {
                        relationship: '',
                        name: bugo.mourner_name || acc.holder || '',
                        bank: acc.bank || '',
                        holder: acc.holder || acc.accountHolder || '',
                        number: acc.number || acc.accountNumber || '',
                    };
                }
            } catch (e) {
                console.error('account_info 파싱 오류:', e);
            }
        }
    }

    return <CondolenceContent account={account} />;
}
