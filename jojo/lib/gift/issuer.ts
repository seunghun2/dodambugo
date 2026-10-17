// 답례품 쿠폰 발행기
//
// 다우기술 API 연동(계약·테스트 계정 발급 후)이 끝나기 전까지는 MockIssuer 만 동작한다.
// 다우 연동 시 DaouIssuer 를 구현해 getIssuer() 에서 반환하면 주문 흐름은 그대로 쓸 수 있다.
//
// 안전장치: GIFT_LIVE_MODE 환경변수가 'true' 가 아니면 항상 테스트 모드(실결제 없음, 실발송 없음).
//           live 인데 발행기가 없으면 주문 자체를 거부한다 (결제만 받고 쿠폰을 못 보내는 상황 방지).

export interface IssueRequest {
    orderNumber: string;
    seq?: number; // 주문 내 순번 (1..N) — 다우 COOPER_ORDER 유일성 보장용
    senderName?: string;
    recipientName: string;
    recipientPhone: string; // 숫자만
    goodsName: string;
    daouGoodsCode: string | null;
    message: string;
    title?: string;
    sendType?: '1001' | '1002' | '1004' | '2100'; // 1001:MMS, 1002:LMS, 1004:알림톡, 2100:온라인
}

export interface IssueResult {
    ok: boolean;
    couponRef?: string; // NO_CPN (또는 NO_CPN|TS_ID)
    tsId?: string;      // 재발송(CI103_RETRY_TOSENDMMS) 시 ORDER_NO로 필요한 트랜잭션 ID
    rtCode?: string;    // 다우 7자리 응답코드 (성공: S000001)
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
        const suffix = req.seq ? String(req.seq).padStart(3, '0') : req.recipientPhone.slice(-4);
        return {
            ok: true,
            couponRef: `MOCK-${req.orderNumber}-${suffix}`,
            rtCode: 'S000001',
        };
    }
}

function formatKstYmd(offsetDays = 0): string {
    const d = new Date(Date.now() + (9 * 3600 + offsetDays * 86400) * 1000);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function extractXmlTag(xml: string, tag: string): string {
    const m = xml.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, 'i'));
    return m ? m[1].trim() : '';
}

/**
 * 다우기술 B2C 모바일쿠폰 API V3.9 발행기
 * - 전문: CI102_ISSUECPN_TITLE_WITHPAY (2.1 MMS/LMS/알림톡(TITLE 포함) 쿠폰발행)
 * - 고정 IP(49.50.139.204) 프록시(DAOU_PROXY_URL) 또는 직접 호출(DAOU_API_URL) 지원
 * - 주의(규격서 p.12 vs p.47): 표에는 SEND_MSG 500byte로 기재되어 있으나 오류코드 E000021에
 *   "메시지가 80byte를 초과합니다"가 존재하므로 검수 시 80byte 제한 여부를 반드시 확인해야 함.
 */
class DaouIssuer implements GiftIssuer {
    readonly name = 'daou';

    constructor(
        private readonly config: {
            cooperId: string;
            cooperPw: string;
            siteId: string;
            endpointUrl: string; // 예: http://49.50.139.204/proxy/daou
            proxySecret?: string;
            senderPhone: string;
        }
    ) {}

    async issue(req: IssueRequest): Promise<IssueResult> {
        if (!req.daouGoodsCode) {
            return { ok: false, error: '상품의 다우 쿠폰계약번호(NO_REQ)가 설정되지 않았습니다.' };
        }

        const seqStr = String(req.seq ?? 1).padStart(3, '0');
        // COOPER_ORDER: 50byte 이내, 1회 요청당 1건(ISSUE_COUNT=1)이므로 수신자별 고유값 필수 (중복 시 E000025)
        const cooperOrder = `${req.orderNumber}-${seqStr}`.slice(0, 50);

        const payload: Record<string, string> = {
            ACTION: 'CI102_ISSUECPN_TITLE_WITHPAY',
            COOPER_ID: this.config.cooperId,
            COOPER_PW: this.config.cooperPw,
            SITE_ID: this.config.siteId,
            NO_REQ: req.daouGoodsCode,
            COOPER_ORDER: cooperOrder,
            ISSUE_COUNT: '1',
            CALL_CTN: this.config.senderPhone.replace(/[^0-9]/g, '').slice(0, 20),
            SENDER: (req.senderName || '마음부고').slice(0, 30),
            RCV_CTN: req.recipientPhone.replace(/[^0-9]/g, '').slice(0, 20),
            RECEIVER: (req.recipientName || '').slice(0, 30),
            SEND_MSG: req.message || '',
            VALID_START: formatKstYmd(0),
            VALID_END: formatKstYmd(30),
            PAY_ID: '0',
            BOOKING_NO: '0',
            SITE_URL: 'https://maeumbugo.co.kr',
            TITLE: (req.title || '[마음부고] 감사 답례품이 도착했습니다').slice(0, 25),
        };
        if (req.sendType) {
            payload.SEND_TYPE = req.sendType;
        }

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (this.config.proxySecret) {
                headers['x-proxy-secret'] = this.config.proxySecret;
            }

            const res = await fetch(this.config.endpointUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            const text = await res.text();
            const rt = extractXmlTag(text, 'RT');
            const rtMsg = extractXmlTag(text, 'RTMSG');
            const noCpn = extractXmlTag(text, 'NO_CPN');
            const tsId = extractXmlTag(text, 'TS_ID');

            if (rt === 'S000001' && noCpn) {
                return {
                    ok: true,
                    couponRef: tsId ? `${noCpn}|${tsId}` : noCpn,
                    tsId: tsId || undefined,
                    rtCode: rt,
                };
            }

            return {
                ok: false,
                rtCode: rt || undefined,
                error: rt ? `[${rt}] ${rtMsg || '발행 실패'}` : `다우 응답 오류 (HTTP ${res.status})`,
            };
        } catch (err: unknown) {
            return {
                ok: false,
                error: err instanceof Error && err.message ? err.message : '다우 프록시 통신 오류',
            };
        }
    }
}

export function isLiveMode(): boolean {
    return process.env.GIFT_LIVE_MODE === 'true';
}

export class GiftNotReadyError extends Error {
    constructor(reason?: string) {
        super(reason || '답례품 발송 서비스가 아직 준비 중입니다.');
        this.name = 'GiftNotReadyError';
    }
}

export function getIssuer(): GiftIssuer {
    if (!isLiveMode()) return new MockIssuer();

    const cooperId = process.env.DAOU_COOPER_ID?.trim();
    const cooperPw = process.env.DAOU_COOPER_PW?.trim();
    const siteId = process.env.DAOU_SITE_ID?.trim();
    const endpointUrl = (process.env.DAOU_PROXY_URL || process.env.DAOU_API_URL || '').trim();
    const senderPhone = (process.env.DAOU_SENDER_PHONE || '01048375076').trim();

    if (!cooperId || !cooperPw || !siteId || !endpointUrl) {
        throw new GiftNotReadyError();
    }

    return new DaouIssuer({
        cooperId,
        cooperPw,
        siteId,
        endpointUrl,
        proxySecret: process.env.DAOU_PROXY_SECRET?.trim(),
        senderPhone,
    });
}
