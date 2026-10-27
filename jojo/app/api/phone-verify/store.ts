import { createClient } from '@supabase/supabase-js';

// 인증번호 인메모리 캐시 (동일 인스턴스 내 빠른 조회 및 폴백용)
export const verificationCodes: Map<string, { code: string; expires: number }> = new Map();

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

export async function saveVerificationCode(phone: string, code: string, ttlMs: number = 3 * 60 * 1000) {
    const expires = Date.now() + ttlMs;
    verificationCodes.set(phone, { code, expires });

    try {
        const supabase = getSupabase();
        if (supabase) {
            await supabase
                .from('b2b_settings')
                .upsert(
                    {
                        key: `sms_verify_${phone}`,
                        value: JSON.stringify({ code, expires }),
                        description: 'SMS 본인인증 임시 코드',
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'key' }
                );
        }
    } catch (err) {
        console.error('[SMS Store] DB 저장 실패 (인메모리 폴백 유지):', err);
    }
}

export async function getVerificationCode(phone: string): Promise<{ code: string; expires: number } | null> {
    try {
        const supabase = getSupabase();
        if (supabase) {
            const { data } = await supabase
                .from('b2b_settings')
                .select('value')
                .eq('key', `sms_verify_${phone}`)
                .maybeSingle();

            if (data?.value) {
                const parsed = JSON.parse(data.value);
                if (parsed?.code && parsed?.expires) {
                    return { code: String(parsed.code), expires: Number(parsed.expires) };
                }
            }
        }
    } catch (err) {
        console.error('[SMS Store] DB 조회 실패 (인메모리 폴백 사용):', err);
    }

    return verificationCodes.get(phone) || null;
}

export async function deleteVerificationCode(phone: string) {
    verificationCodes.delete(phone);
    try {
        const supabase = getSupabase();
        if (supabase) {
            await supabase
                .from('b2b_settings')
                .delete()
                .eq('key', `sms_verify_${phone}`);
        }
    } catch (err) {
        console.error('[SMS Store] DB 삭제 실패:', err);
    }
}
