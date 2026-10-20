// 답례품 쿠폰 발행기 & 폐기(취소) 처리기
//
// 다우기술 API 연동(계약·테스트 계정 발급 후)이 끝나기 전까지는 MockIssuer 만 동작한다.
// 안전장치:
// 1) GIFT_LIVE_MODE 환경변수가 'true' 가 아니면 항상 테스트 모드(실결제 없음, 실발송 없음).
// 2) 다우 SEND_MSG E000021(80byte 초과 거절) 방지: 전체 감사장(500자+카드 링크)은 별도 감사장 문자/알림톡으로 발송하고,
//    다우 쿠폰 전문의 SEND_MSG 는 EUC-KR 기준 76byte 이내로 안전하게 자동 절삭한다.

export interface IssueRequest {
    orderNumber: string;
    seq?: number; // 주문 내 순번 (1..N) — 다우 COOPER_ORDER 유일성 보장용
    bugoNumber?: string; // 감사장 단축링크(/t/[bugoNumber]) 생성용
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

export interface CancelResult {
    ok: boolean;
    rtCode?: string;
    error?: string;
}

export interface GiftIssuer {
    readonly name: string;
    issue(req: IssueRequest): Promise<IssueResult>;
    cancel(couponRef: string, orderNumber: string): Promise<CancelResult>;
}

/**
 * EUC-KR 바이트 기준 안전 절삭 (한글/비ASCII = 2byte, ASCII = 1byte).
 * 다우 E000021("메시지가 80byte를 초과합니다") 거절을 원천 차단한다.
 */
export function calcEucKrBytes(input: string): number {
    let bytes = 0;
    for (const ch of input || '') {
        bytes += ch.charCodeAt(0) <= 0x7f ? 1 : 2;
    }
    return bytes;
}

export function truncateEucKrBytes(input: string, maxBytes = 76): string {
    const clean = (input || '').replace(/\r\n/g, '\n').trim();
    let bytes = 0;
    let out = '';
    for (const ch of clean) {
        const code = ch.charCodeAt(0);
        const charBytes = code <= 0x7f ? 1 : 2;
        if (bytes + charBytes > maxBytes) break;
        bytes += charBytes;
        out += ch;
    }
    return out;
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
    async cancel(): Promise<CancelResult> {
        return { ok: true, rtCode: 'S000001' };
    }
}

function formatKstYmd(offsetDays = 0): string {
    const d = new Date(Date.now() + (9 * 3600 + offsetDays * 86400) * 1000);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function extractXmlTag(xml: string, tag: string): string {
    const m = xml.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, 'i'));
    if (!m) return '';
    return m[1].trim().replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1').trim();
}

/**
 * 다우기술 B2C 모바일쿠폰 API V3.9 발행/폐기기
 * - 발행: CI102_ISSUECPN_TITLE_WITHPAY
 * - 폐기(취소): CI104_DISUSECPN
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
        const cooperOrder = `${req.orderNumber}-${seqStr}`.slice(0, 50);

        // 다우 SEND_MSG 80byte 제한 내에서 인사말 + 모바일 감사장 단축링크(/t/[bugoNumber]) 결합
        const shortUrlSuffix = req.bugoNumber
            ? `\n▼감사장 보기\nhttps://maeumbugo.co.kr/t/${req.bugoNumber}`
            : '';
        const suffixBytes = calcEucKrBytes(shortUrlSuffix);
        const safeShortMsg = shortUrlSuffix
            ? `${truncateEucKrBytes('조문해 주셔서 감사드립니다.', Math.max(10, 78 - suffixBytes))}${shortUrlSuffix}`
            : truncateEucKrBytes(
                  req.message || `${req.senderName || '상주'} 드림. 조문해 주셔서 깊이 감사드립니다.`,
                  76
              );

        const payload: Record<string, string> = {
            ACTION: 'CI102_ISSUECPN_TITLE_WITHPAY',
            COOPER_ID: this.config.cooperId,
            COOPER_PW: this.config.cooperPw,
            SITE_ID: this.config.siteId,
            NO_REQ: req.daouGoodsCode,
            COOPER_ORDER: cooperOrder,
            ISSUE_COUNT: '1',
            CALL_CTN: this.config.senderPhone.replace(/[^0-9]/g, '').slice(0, 20),
            SENDER: truncateEucKrBytes(req.senderName || '마음부고', 28),
            RCV_CTN: req.recipientPhone.replace(/[^0-9]/g, '').slice(0, 20),
            RECEIVER: truncateEucKrBytes(req.recipientName || '', 28),
            SEND_MSG: safeShortMsg,
            VALID_START: formatKstYmd(0),
            VALID_END: formatKstYmd(59),
            PAY_ID: '0',
            BOOKING_NO: '0',
            SITE_URL: 'https://maeumbugo.co.kr',
            TITLE: truncateEucKrBytes(req.title || '[마음부고] 감사 답례품', 24),
            SEND_TYPE: req.sendType || '1001', // 연동업체지정(10004008) 캠페인 필수값 (1001: MMS 기본)
        };

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            };
            if (this.config.proxySecret) {
                headers['x-proxy-secret'] = this.config.proxySecret;
            }

            const formBody = new URLSearchParams(payload).toString();
            const res = await fetch(this.config.endpointUrl, {
                method: 'POST',
                headers,
                body: formBody,
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

    async cancel(couponRef: string, orderNumber: string): Promise<CancelResult> {
        const [noCpn] = (couponRef || '').split('|');
        if (!noCpn) return { ok: false, error: '쿠폰 번호(NO_CPN)가 없습니다.' };

        const payload: Record<string, string> = {
            ACTION: 'CI104_DISUSECPN',
            COOPER_ID: this.config.cooperId,
            COOPER_PW: this.config.cooperPw,
            SITE_ID: this.config.siteId,
            NO_CPN: noCpn,
            REQUEST_ID: `CANCEL-${orderNumber}`.slice(0, 30),
            REASON: '구매자 취소',
        };

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            };
            if (this.config.proxySecret) {
                headers['x-proxy-secret'] = this.config.proxySecret;
            }
            const formBody = new URLSearchParams(payload).toString();
            const res = await fetch(this.config.endpointUrl, {
                method: 'POST',
                headers,
                body: formBody,
            });
            const text = await res.text();
            const rt = extractXmlTag(text, 'RT');
            const rtMsg = extractXmlTag(text, 'RTMSG');
            if (rt === 'S000001') return { ok: true, rtCode: rt };
            return { ok: false, rtCode: rt || undefined, error: `[${rt}] ${rtMsg || '쿠폰 폐기 실패'}` };
        } catch (err: unknown) {
            return { ok: false, error: err instanceof Error ? err.message : '다우 폐기 통신 오류' };
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

    const cooperId = (process.env.DAOU_COOPER_ID || 'SC2859').trim();
    const cooperPw = (process.env.DAOU_COOPER_PW || 'eqph04@@').trim();
    const siteId = (process.env.DAOU_SITE_ID || '10004255').trim();
    const endpointUrl = (process.env.DAOU_PROXY_URL || process.env.DAOU_API_URL || 'http://49.50.139.204/proxy/daou').trim();
    const senderPhone = (process.env.DAOU_SENDER_PHONE || '15996567').trim();

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
