import crypto from 'crypto';

// 부고번호 → 랜덤 보이는 코드 생성 (항상 동일한 결과)
export function generateReviewCode(bugoNumber: string): string {
    return crypto
        .createHash('md5')
        .update('maeum-review-' + bugoNumber)
        .digest('hex')
        .substring(0, 10);
}
