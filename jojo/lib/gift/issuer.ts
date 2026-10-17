// 답례품 쿠폰 발행기
//
// 다우기술 API 연동(계약·테스트 계정 발급 후)이 끝나기 전까지는 MockIssuer 만 동작한다.
// 다우 연동 시 DaouIssuer 를 구현해 getIssuer() 에서 반환하면 주문 흐름은 그대로 쓸 수 있다.
//
// 안전장치: GIFT_LIVE_MODE 환경변수가 'true' 가 아니면 항상 테스트 모드(실결제 없음, 실발송 없음).
//           live 인데 발행기가 없으면 주문 자체를 거부한다 (결제만 받고 쿠폰을 못 보내는 상황 방지).

export interface IssueRequest {
    orderNumber: string;
    recipientName: string;
    recipientPhone: string; // 숫자만
    goodsName: string;
    daouGoodsCode: string | null;
    message: string;
}

export interface IssueResult {
    ok: boolean;
    couponRef?: string;
    error?: string;
}

export interface GiftIssuer {
    readonly name: string;
    issue(req: IssueRequest): Promise<IssueResult>;
}

/** 실제 발송 없이 성공만 돌려주는 테스트용 발행기 */
class MockIssuer implements GiftIssuer {
    readonly name = 'mock';
    async issue(req: IssueRequest): Promise<IssueResult> {
        return { ok: true, couponRef: `MOCK-${req.orderNumber}-${req.recipientPhone.slice(-4)}` };
    }
}

export function isLiveMode(): boolean {
    return process.env.GIFT_LIVE_MODE === 'true';
}

export class GiftNotReadyError extends Error {
    constructor() {
        super('답례품 발송 서비스가 아직 준비 중입니다.');
        this.name = 'GiftNotReadyError';
    }
}

export function getIssuer(): GiftIssuer {
    if (!isLiveMode()) return new MockIssuer();
    // TODO(다우기술 연동): new DaouIssuer() 반환. 구현 전에는 live 모드 주문을 막는다.
    throw new GiftNotReadyError();
}
