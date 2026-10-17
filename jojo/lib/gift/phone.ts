// 답례품 받는 사람 전화번호 처리 (클라이언트/서버 공용)

export interface GiftRecipient {
    name: string;
    phone: string; // 숫자만 (01012345678)
    source: 'contact' | 'excel' | 'manual' | 'condolence' | 'flower';
}

/** 숫자만 남기고 +82 / 82 국가번호를 010 형태로 정규화 */
export function normalizePhone(raw: string | null | undefined): string {
    let digits = String(raw ?? '').replace(/[^0-9+]/g, '');
    if (digits.startsWith('+82')) digits = '0' + digits.slice(3);
    else if (digits.startsWith('82') && digits.length >= 11) digits = '0' + digits.slice(2);
    digits = digits.replace(/\D/g, '');
    // 10으로 시작하는 10자리(앞 0 누락, 엑셀에서 흔함) 보정
    if (/^10\d{8}$/.test(digits)) digits = '0' + digits;
    return digits;
}

/** 직접 입력창용: 숫자만 허용, 최대 11자리 제한, 자동 하이픈(010-1234-5678) 포맷 */
export function formatPhoneInput(raw: string | null | undefined): string {
    const digits = String(raw ?? '')
        .replace(/\D/g, '')
        .slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

/**
 * 클라이언트/서버 공용 전화번호 중복 통합 키 (원본 번호 노출 없이 조의금·화환·직접입력 동일인 판별)
 */
export function phoneDedupeKey(rawPhone: string | null | undefined): string {
    const p = normalizePhone(rawPhone);
    if (!p) return '';
    const salted = `maeum-gift-dedupe-v1:${p}`;
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < salted.length; i++) {
        const c = salted.charCodeAt(i);
        h1 ^= c;
        h1 = Math.imul(h1, 0x01000193);
        h2 ^= c + i;
        h2 = Math.imul(h2, 0x811c9dc5);
    }
    return `dk_${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

/** 휴대폰 번호만 허용 (010/011/016/017/018/019, 10~11자리) */
export function isValidMobile(phone: string): boolean {
    return /^01[016789]\d{7,8}$/.test(phone);
}

export function formatPhone(phone: string): string {
    const p = normalizePhone(phone);
    if (p.length === 11) return `${p.slice(0, 3)}-${p.slice(3, 7)}-${p.slice(7)}`;
    if (p.length === 10) return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;
    return p;
}

/** 개인정보 보호용 마스킹: 010-****-1234 */
export function maskPhone(phone: string): string {
    const p = normalizePhone(phone);
    if (p.length < 8) return '***';
    return `${p.slice(0, 3)}-****-${p.slice(-4)}`;
}

/** 번호 기준 중복 제거 (먼저 들어온 항목 유지). 잘못된 번호는 invalid로 분리 */
export function dedupeRecipients(list: GiftRecipient[]): {
    valid: GiftRecipient[];
    invalid: GiftRecipient[];
    duplicated: number;
} {
    const seen = new Set<string>();
    const valid: GiftRecipient[] = [];
    const invalid: GiftRecipient[] = [];
    let duplicated = 0;
    for (const r of list) {
        const phone = normalizePhone(r.phone);
        const item = { ...r, phone, name: (r.name || '').trim().slice(0, 20) };
        if (!isValidMobile(phone)) {
            invalid.push(item);
            continue;
        }
        if (seen.has(phone)) {
            duplicated++;
            continue;
        }
        seen.add(phone);
        valid.push(item);
    }
    return { valid, invalid, duplicated };
}
