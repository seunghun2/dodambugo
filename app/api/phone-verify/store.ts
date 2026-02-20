// 인증번호 저장소 (send와 confirm에서 공유)
export const verificationCodes: Map<string, { code: string; expires: number }> = new Map();
