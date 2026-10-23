// 다우기술 B2C 모바일쿠폰 V3.9 — 전체 상품정보 다운로드 V2 (CC011_DOWN_ALL_GOODSINFO) 동기화 유틸
// 및 고정 IP 프록시(49.50.139.204) 라우트 스니펫
//
// 연동 절차(규격서 1.4):
// 1) 다우로부터 COOPER_ID, COOPER_PW, SITE_ID, 검수/상용 서버 URL 수령 + 49.50.139.204 방화벽 오픈 확인
// 2) 49.50.139.204 프록시 서버에 아래 `/proxy/daou` 핸들러 추가
// 3) syncDaouCatalogToSupabase() 1회 실행 → gift_products 64개 행에 daou_goods_code(NO_REQ) 및 image_url(GOODS_IMAGE) 자동 매핑

import { getSupabase } from './auth';

export interface DaouGoodsItem {
    noReq: string;       // NO_REQ (쿠폰계약번호 — 발행 시 필수)
    noGoods: string;     // NO_GOODS (다우 관리 상품번호)
    nmGoods: string;     // NM_GOODS (상품명)
    brandName: string;   // NM_GOODS_COMPANY (상품제휴처 명)
    category: string;    // CATEGORY
    goodsPrice: number;  // GOODS_PRICE (상품정가)
    cpnPrice: number;    // CPN_PRICE (쿠폰금액)
    goodsImage: string;  // GOODS_IMAGE (상품 이미지 URL)
    sendType: string;    // SEND_TYPE (10004001:MMS, 10004005:LMS, 10004006:알림톡, 10004008:연동업체지정)
    validType: string;   // CPN_VALID_TYPE (Y/M/D/C/E/F)
    validTerm: string;   // CPN_VALID_TERM
    commonCaution: string;     // COMMON_CAUTION (상세 이미지 URL 또는 텍스트)
    additionalCaution: string; // ADDITIONAL_CAUTION
    usageGuide: string;        // USAGE_GUIDE
}

function extractTag(block: string, tag: string): string {
    const m = block.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, 'i'));
    if (!m) return '';
    return m[1].trim().replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1').trim();
}

export function parseDaouGoodsListXml(xml: string): {
    rt: string;
    rtMsg: string;
    listCount: number;
    items: DaouGoodsItem[];
} {
    const rt = extractTag(xml, 'RT');
    const rtMsg = extractTag(xml, 'RTMSG');
    const listCount = Number(extractTag(xml, 'LIST_COUNT') || '0');
    const blocks = xml.match(/<GOODS_INFO>[\s\S]*?<\/GOODS_INFO>/gi) || [];

    const items: DaouGoodsItem[] = blocks.map((b) => ({
        noReq: extractTag(b, 'NO_REQ'),
        noGoods: extractTag(b, 'NO_GOODS'),
        nmGoods: extractTag(b, 'NM_GOODS'),
        brandName: extractTag(b, 'NM_GOODS_COMPANY'),
        category: extractTag(b, 'CATEGORY'),
        goodsPrice: Number(extractTag(b, 'GOODS_PRICE') || '0'),
        cpnPrice: Number(extractTag(b, 'CPN_PRICE') || '0'),
        goodsImage: extractTag(b, 'GOODS_IMAGE'),
        sendType: extractTag(b, 'SEND_TYPE').replace(/>$/, ''), // 규격서 예제 오타(10004001>) 방어
        validType: extractTag(b, 'CPN_VALID_TYPE'),
        validTerm: extractTag(b, 'CPN_VALID_TERM'),
        commonCaution: extractTag(b, 'COMMON_CAUTION'),
        additionalCaution: extractTag(b, 'ADDITIONAL_CAUTION'),
        usageGuide: extractTag(b, 'USAGE_GUIDE'),
    }));

    return { rt, rtMsg, listCount, items };
}

function normalizeGoodsName(s: string): string {
    return s.replace(/\s+/g, '').toLowerCase();
}

/**
 * 다우 CC011_DOWN_ALL_GOODSINFO 호출 후 gift_products 테이블의 daou_goods_code(NO_REQ)와 image_url을 자동 업데이트
 */
export async function syncDaouCatalogToSupabase(): Promise<{
    fetched: number;
    matched: number;
    unmatchedProductNames: string[];
}> {
    const cooperId = (process.env.DAOU_COOPER_ID || 'SC2859').trim();
    const cooperPw = (process.env.DAOU_COOPER_PW || 'eqph04@@').trim();
    const siteId = (process.env.DAOU_SITE_ID || '10004255').trim();
    const endpointUrl = (process.env.DAOU_PROXY_URL || process.env.DAOU_API_URL || 'http://49.50.139.204/proxy/daou').trim();

    if (!cooperId || !cooperPw || !siteId || !endpointUrl) {
        throw new Error('DAOU_COOPER_ID, DAOU_COOPER_PW, DAOU_SITE_ID, DAOU_PROXY_URL 환경변수가 필요합니다.');
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    };
    if (process.env.DAOU_PROXY_SECRET) {
        headers['x-proxy-secret'] = process.env.DAOU_PROXY_SECRET.trim();
    }

    const formBody = new URLSearchParams({
        ACTION: 'CC011_DOWN_ALL_GOODSINFO',
        COOPER_ID: cooperId,
        COOPER_PW: cooperPw,
        SITE_ID: siteId,
    }).toString();

    const res = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: formBody,
    });

    const xml = await res.text();
    const parsed = parseDaouGoodsListXml(xml);
    if (parsed.rt !== 'S000001') {
        throw new Error(`다우 상품조회 실패: [${parsed.rt}] ${parsed.rtMsg}`);
    }
    // 규격서 2.14 주의사항 1): LIST_COUNT와 실제 GOODS_INFO 개수가 다르면 비정상 응답이므로 폐기
    if (parsed.listCount !== parsed.items.length) {
        throw new Error(`다우 LIST_COUNT(${parsed.listCount})와 실제 항목 수(${parsed.items.length}) 불일치`);
    }

    const byNormName = new Map<string, DaouGoodsItem>();
    for (const item of parsed.items) {
        byNormName.set(normalizeGoodsName(item.nmGoods), item);
    }

    const supabase = getSupabase();
    const { data: rows, error } = await supabase
        .from('gift_products')
        .select('id, brand, name, list_price, sale_price, daou_goods_code');
    if (error || !rows) throw error || new Error('gift_products 조회 실패');

    let matched = 0;
    const unmatchedProductNames: string[] = [];

    for (const row of rows) {
        const hit = byNormName.get(normalizeGoodsName(row.name));
        if (!hit) {
            unmatchedProductNames.push(`[${row.brand}] ${row.name}`);
            continue;
        }
        const updatePayload: Record<string, unknown> = {
            daou_goods_code: hit.noReq,
            valid_days: Number(hit.validTerm) || 30,
            common_caution: hit.commonCaution || null,
            additional_caution: hit.additionalCaution || null,
            usage_guide: hit.usageGuide || null,
        };
        if (hit.goodsImage) {
            updatePayload.image_url = hit.goodsImage;
        }
        if (hit.goodsPrice > 0) {
            // 기존 상품의 고객 할인율(기본 5%)을 유지하여 정가(list_price)와 판매가(sale_price) 함께 갱신
            const prevList = Number((row as any).list_price) || 0;
            const prevSale = Number((row as any).sale_price) || 0;
            const prevDiscPct =
                prevList > 0 && prevSale > 0 && prevList > prevSale
                    ? Math.round((1 - prevSale / prevList) * 100)
                    : 5;
            updatePayload.list_price = hit.goodsPrice;
            updatePayload.sale_price =
                prevDiscPct > 0
                    ? Math.max(10, Math.round((hit.goodsPrice * (100 - prevDiscPct)) / 1000) * 10)
                    : hit.goodsPrice;
        }
        const { error: upErr } = await supabase
            .from('gift_products')
            .update(updatePayload)
            .eq('id', row.id);
        if (!upErr) matched++;
    }

    return {
        fetched: parsed.items.length,
        matched,
        unmatchedProductNames,
    };
}

/*
================================================================================
[고정 IP 프록시 서버 (49.50.139.204) 추가용 Express 라우트 스니펫]
기존 /proxy/transfer, /proxy/balance 가 돌아가는 Node/Express 서버에 아래 라우트만 추가하면 됩니다.
================================================================================

app.post('/proxy/daou', async (req, res) => {
    try {
        const secret = process.env.DAOU_PROXY_SECRET;
        if (secret && req.headers['x-proxy-secret'] !== secret) {
            return res.status(403).send('<CJSERVICE><RT>E000001</RT><RTMSG>FORBIDDEN</RTMSG></CJSERVICE>');
        }
        const { ACTION, ...params } = req.body || {};
        if (!ACTION) {
            return res.status(400).send('<CJSERVICE><RT>E000002</RT><RTMSG>MISSING_ACTION</RTMSG></CJSERVICE>');
        }
        const baseUrl = process.env.DAOU_BASE_URL; // 다우 검수/상용 서버 URL (예: https://.../b2ccoupon/b2cService.aspx)
        const url = `${baseUrl}?ACTION=${encodeURIComponent(ACTION)}`;
        const form = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null) form.append(k, String(v));
        }
        const upstream = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=euc-kr' },
            body: form.toString(),
        });
        const xml = await upstream.text();
        res.set('Content-Type', 'application/xml; charset=utf-8').status(upstream.status).send(xml);
    } catch (e) {
        console.error('[proxy/daou]', e);
        res.status(502).send('<CJSERVICE><RT>E900001</RT><RTMSG>PROXY_ERROR</RTMSG></CJSERVICE>');
    }
});
*/
