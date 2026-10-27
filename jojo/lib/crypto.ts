import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
    const secret =
        process.env.RRN_ENCRYPTION_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.JWT_SECRET ||
        'maeumbugo-b2b-rrn-secret-key';
    return crypto.createHash('sha256').update(secret).digest();
}

/**
 * 주민등록번호 뒷자리 등 민감정보 양방향 암호화 (AES-256-GCM)
 * 반환 포맷: enc:<ivHex>:<authTagHex>:<cipherHex>
 */
export function encryptRRN(plainText: string | null | undefined): string {
    if (!plainText) return '';
    const trimmed = String(plainText).trim();
    if (!trimmed) return '';
    // 이미 암호화된 문자열이면 재암호화 방지
    if (trimmed.startsWith('enc:')) return trimmed;

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * 암호화된 주민등록번호 뒷자리 복호화 (기존 평문 데이터 하위 호환 지원)
 */
export function decryptRRN(cipherText: string | null | undefined): string {
    if (!cipherText) return '';
    const trimmed = String(cipherText).trim();
    if (!trimmed) return '';
    // 평문 레거시 데이터는 그대로 반환
    if (!trimmed.startsWith('enc:')) return trimmed;

    try {
        const parts = trimmed.split(':');
        if (parts.length !== 4) return '';
        const [, ivHex, authTagHex, encryptedHex] = parts;
        const key = getEncryptionKey();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (err) {
        console.error('RRN 복호화 실패:', err);
        return '';
    }
}
