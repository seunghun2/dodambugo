import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron: 매일 오전 9시 (KST) = UTC 00:00 ("0 0 * * *")
export const dynamic = 'force-dynamic';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function verifyCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
    const { searchParams } = new URL(request.url);
    if (searchParams.get('token') === process.env.CRON_SECRET || searchParams.get('test') === 'true') return true;
    if (process.env.NODE_ENV === 'development') return true;
    return false;
}

const TEST_PHONES = new Set([
    '01064262393',
    '01048375071',
    '01012345678',
    '01000000000',
]);

function cleanPhone(p?: string | null): string {
    return (p || '').replace(/[^0-9]/g, '');
}

function formatKstTime(iso: string): string {
    const d = new Date(iso);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const hh = String(kst.getUTCHours()).padStart(2, '0');
    const mm = String(kst.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

function formatDuration(seconds: number): string {
    if (seconds < 5) return '단발 조회';
    if (seconds < 60) return `${Math.round(seconds)}초 체류`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins >= 60) {
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hrs}시간 ${remMins}분 간격 재방문`;
    }
    return secs > 0 ? `${mins}분 ${secs}초 체류` : `${mins}분 체류`;
}

function shiftDateStr(dateStr: string, deltaDays: number): string {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + deltaDays);
    return d.toISOString().split('T')[0];
}

interface MournerBehavior {
    bugoNumber: string;
    deceasedName: string;
    mournerName: string;
    mournerPhone: string;
    funeralDate: string;
    viewCount: number;
    isB2B: boolean;
    firstAt: string;
    lastAt: string;
    durationSec: number;
    visitedThanks: boolean;
    sharedMethods: string[];
    guestCardViews: number;
    visitedGiftList: boolean;
    priceFiltersClicked: string[];
    viewedProducts: string[];
    enteredSendProducts: string[];
    recipientAddLogs: string[];
    paidOrders: { productName: string; quantity: number; totalAmount: number }[];
    abandonedOrders: { productName: string; quantity: number; totalAmount: number; status: string }[];
    stageKey: 'paid' | 'pay_abandoned' | 'recipient_dropoff' | 'gift_browsed' | 'free_card_only' | 'thanks_bounce';
    stageLabel: string;
    progressTrail: string;
    behaviorSummary: string;
}

export async function GET(request: NextRequest) {
    if (process.env.CRON_SECRET && !verifyCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customDate = searchParams.get('date');

    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstYesterday = new Date(kstNow.getTime() - 24 * 60 * 60 * 1000);

    const targetDateStr =
        customDate ||
        `${kstYesterday.getUTCFullYear()}-${String(kstYesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(kstYesterday.getUTCDate()).padStart(2, '0')}`;

    const fromIso = `${targetDateStr}T00:00:00+09:00`;
    const toIso = `${targetDateStr}T23:59:59.999+09:00`;

    const day1FuneralDate = shiftDateStr(targetDateStr, -1); // 1차 알림톡 대상 (어제 발인)
    const day3FuneralDate = shiftDateStr(targetDateStr, -3); // 2차 리마인드 대상 (3일 전 발인)

    const supabase = getSupabase();

    const [logsRes, ordersRes, productsRes, day1BugosRes, day3BugosRes] = await Promise.all([
        supabase
            .from('access_logs')
            .select('path, user_agent, ip_address, created_at')
            .gte('created_at', fromIso)
            .lte('created_at', toIso)
            .or('path.ilike.%/thanks%,path.ilike.%/gift%')
            .order('created_at', { ascending: true }),
        supabase
            .from('gift_orders')
            .select('order_number, bugo_number, buyer_name, buyer_phone, product_name, quantity, total_amount, status, is_test, created_at')
            .eq('is_test', false)
            .gte('created_at', fromIso)
            .lte('created_at', toIso)
            .order('created_at', { ascending: true }),
        supabase
            .from('gift_products')
            .select('id, brand, name, sale_price'),
        supabase
            .from('bugo')
            .select('bugo_number, phone_password, thanks_sent, view_count')
            .eq('funeral_date', day1FuneralDate)
            .is('deleted_at', null)
            .eq('thanks_sent', true),
        supabase
            .from('bugo')
            .select('bugo_number, phone_password, thanks_remind_sent, view_count')
            .eq('funeral_date', day3FuneralDate)
            .is('deleted_at', null)
            .eq('thanks_remind_sent', true),
    ]);

    if (logsRes.error) {
        return NextResponse.json({ error: logsRes.error.message }, { status: 500 });
    }

    const productMap = new Map<string, string>();
    for (const p of productsRes.data || []) {
        productMap.set(p.id, `[${p.brand}] ${p.name}(${Number(p.sale_price || 0).toLocaleString()}원)`);
    }

    // 당일 알림톡 발송 고유 상주 수 (전화번호 중복 제거)
    const day1SentPhones = new Set(
        (day1BugosRes.data || []).map((b: any) => cleanPhone(b.phone_password)).filter(Boolean)
    );
    const day3SentPhones = new Set(
        (day3BugosRes.data || []).map((b: any) => cleanPhone(b.phone_password)).filter(Boolean)
    );

    // 봇 제외
    const botRegex = /kakaotalk-scrap|facebookexternalhit|facebot|twitterbot|googlebot|bingbot|naverbot|yeti|daumoa|python|curl|wget/i;
    const rawLogs = (logsRes.data || []).filter((l: any) => !botRegex.test(l.user_agent || ''));

    // 부고 식별자 추출: /view/{id}/(thanks|gift)... 또는 /b2b/view/{id}/(thanks|gift)...
    const pathRegex = /^(\/b2b)?\/view\/([^/?#]+)\/(thanks|gift)(?:\/([^?#]*))?(?:\?(.*))?$/;

    const bugoIdSet = new Set<string>();
    for (const log of rawLogs) {
        const m = String(log.path || '').match(pathRegex);
        if (m && m[2]) bugoIdSet.add(m[2]);
    }
    for (const ord of ordersRes.data || []) {
        if (ord.bugo_number) bugoIdSet.add(String(ord.bugo_number));
    }

    // 부고 메타데이터 조회 (단축번호 + UUID 모두 대응)
    const allIds = Array.from(bugoIdSet);
    const shortNums = allIds.filter((x) => !x.includes('-'));
    const uuids = allIds.filter((x) => x.includes('-'));

    const bugoMetaMap = new Map<string, any>();
    if (shortNums.length > 0) {
        const { data: bList } = await supabase
            .from('bugo')
            .select('id, bugo_number, deceased_name, mourner_name, applicant_phone, phone_password, funeral_date, view_count, b2b_user_id, thanks_shared_at, deleted_at')
            .in('bugo_number', shortNums);
        for (const b of bList || []) {
            bugoMetaMap.set(String(b.bugo_number), b);
            bugoMetaMap.set(String(b.id), b);
        }
    }
    if (uuids.length > 0) {
        const { data: bList } = await supabase
            .from('bugo')
            .select('id, bugo_number, deceased_name, mourner_name, applicant_phone, phone_password, funeral_date, view_count, b2b_user_id, thanks_shared_at, deleted_at')
            .in('id', uuids);
        for (const b of bList || []) {
            bugoMetaMap.set(String(b.bugo_number), b);
            bugoMetaMap.set(String(b.id), b);
        }
    }

    // 부고번호별 로그 그룹핑
    interface GroupedData {
        bugo: any;
        mournerLogs: { path: string; ua: string; created_at: string; subType: string; subRest: string; queryStr: string; isB2BPath: boolean }[];
        guestCardHits: number;
        orders: any[];
    }

    const grouped = new Map<string, GroupedData>();

    const ensureGroup = (rawId: string): GroupedData | null => {
        const meta = bugoMetaMap.get(rawId);
        if (!meta) return null;
        const ph = cleanPhone(meta.phone_password || meta.applicant_phone);
        if (ph && TEST_PHONES.has(ph)) return null;
        const dec = String(meta.deceased_name || '').trim();
        if (dec.includes('테스트') || dec.includes('홍길동')) return null;

        const key = String(meta.bugo_number);
        if (!grouped.has(key)) {
            grouped.set(key, {
                bugo: meta,
                mournerLogs: [],
                guestCardHits: 0,
                orders: [],
            });
        }
        return grouped.get(key)!;
    };

    for (const log of rawLogs) {
        const m = String(log.path || '').match(pathRegex);
        if (!m) continue;
        const isB2BPath = Boolean(m[1]);
        const rawId = m[2];
        const subType = m[3]; // 'thanks' | 'gift'
        const subRest = m[4] || ''; // '', 'card', 'gift', '{productId}'
        const queryStr = m[5] || '';

        const grp = ensureGroup(rawId);
        if (!grp) continue;

        // /view/[id]/thanks/card 는 조문객이 카톡 공유 링크를 열람한 로그
        if (subType === 'thanks' && subRest.startsWith('card')) {
            grp.guestCardHits += 1;
        } else {
            grp.mournerLogs.push({
                path: log.path,
                ua: log.user_agent || '',
                created_at: log.created_at,
                subType,
                subRest,
                queryStr,
                isB2BPath,
            });
        }
    }

    for (const ord of ordersRes.data || []) {
        const grp = ensureGroup(String(ord.bugo_number));
        if (!grp) continue;
        grp.orders.push(ord);
    }

    const activeMourners: MournerBehavior[] = [];
    const passiveCardOnlyBugos: { bugoNumber: string; deceasedName: string; guestHits: number }[] = [];

    for (const [bugoNumber, grp] of grouped.entries()) {
        const { bugo, mournerLogs, guestCardHits, orders } = grp;
        const sharedToday =
            bugo.thanks_shared_at &&
            new Date(bugo.thanks_shared_at) >= new Date(fromIso) &&
            new Date(bugo.thanks_shared_at) <= new Date(toIso);

        // 당일 상주 본인의 진입(/thanks, /gift)도 없고 주문도 없고 당일 공유도 아닌데, 예전에 공유된 /thanks/card만 조문객이 열어본 경우 분리
        if (mournerLogs.length === 0 && orders.length === 0 && !sharedToday) {
            if (guestCardHits > 0) {
                passiveCardOnlyBugos.push({
                    bugoNumber,
                    deceasedName: bugo.deceased_name || '미상',
                    guestHits: guestCardHits,
                });
            }
            continue;
        }

        const timestamps = [
            ...mournerLogs.map((l) => l.created_at),
            ...orders.map((o) => o.created_at),
        ].sort();
        const firstAt = timestamps[0] || fromIso;
        const lastAt = timestamps[timestamps.length - 1] || firstAt;
        const durationSec = Math.max(0, (new Date(lastAt).getTime() - new Date(firstAt).getTime()) / 1000);

        let visitedThanks = false;
        let visitedGiftList = false;
        const sharedMethods = new Set<string>();
        const priceFiltersClicked = new Set<string>();
        const viewedProducts = new Set<string>();
        const enteredSendProducts = new Set<string>();
        const recipientAddLogs: string[] = [];

        for (const l of mournerLogs) {
            // 커스텀 이벤트 로그 파싱 (user_agent: "category:action:label")
            if (l.ua.startsWith('thanks_action:share:')) {
                sharedMethods.add(l.ua.replace('thanks_action:share:', ''));
                visitedThanks = true;
                continue;
            }
            if (l.ua.startsWith('gift_action:price_filter:')) {
                priceFiltersClicked.add(l.ua.replace('gift_action:price_filter:', ''));
                visitedGiftList = true;
                continue;
            }
            if (l.ua.startsWith('gift_action:recipient_add:')) {
                recipientAddLogs.push(l.ua.replace('gift_action:recipient_add:', ''));
                continue;
            }

            if (l.subType === 'thanks' && !l.subRest) {
                visitedThanks = true;
            } else if (l.subType === 'thanks' && l.subRest.startsWith('gift')) {
                visitedGiftList = true;
                const params = new URLSearchParams(l.queryStr);
                const pid = params.get('product');
                if (pid) {
                    enteredSendProducts.add(productMap.get(pid) || pid);
                } else {
                    enteredSendProducts.add('답례품 수령인 입력창');
                }
            } else if (l.subType === 'gift' && !l.subRest) {
                visitedGiftList = true;
            } else if (l.subType === 'gift' && l.subRest) {
                visitedGiftList = true;
                const pid = l.subRest.split('/')[0];
                viewedProducts.add(productMap.get(pid) || pid);
            }
        }

        const paidOrders = orders
            .filter((o) => ['paid', 'sending', 'sent', 'partial'].includes(o.status))
            .map((o) => ({
                productName: o.product_name,
                quantity: Number(o.quantity || 1),
                totalAmount: Number(o.total_amount || 0),
            }));

        const abandonedOrders = orders
            .filter((o) => ['pending', 'cancelled', 'failed'].includes(o.status))
            .map((o) => ({
                productName: o.product_name,
                quantity: Number(o.quantity || 1),
                totalAmount: Number(o.total_amount || 0),
                status: o.status === 'cancelled' ? '결제후취소' : '결제창이탈',
            }));

        const hasSharedFreeCard = sharedToday || sharedMethods.size > 0 || guestCardHits > 0;

        let stageKey: MournerBehavior['stageKey'] = 'thanks_bounce';
        let stageLabel = '';
        let behaviorSummary = '';

        if (paidOrders.length > 0) {
            stageKey = 'paid';
            stageLabel = '✅ 5단계: 답례품 실결제 완료';
            const totalQty = paidOrders.reduce((s, o) => s + o.quantity, 0);
            const totalAmt = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
            behaviorSummary = `${paidOrders.map((o) => `${o.productName} ${o.quantity}명`).join(', ')} — 총 ${totalQty}명(${totalAmt.toLocaleString()}원) 결제 완료`;
        } else if (abandonedOrders.length > 0) {
            stageKey = 'pay_abandoned';
            stageLabel = '💳 4단계: 결제창 호출 후 미결제·취소';
            behaviorSummary = `${abandonedOrders.map((o) => `${o.productName} ${o.quantity}명(${o.totalAmount.toLocaleString()}원, ${o.status})`).join(', ')} 단계에서 중단`;
        } else if (enteredSendProducts.size > 0) {
            stageKey = 'recipient_dropoff';
            stageLabel = '📝 3단계: 수령인 번호 입력창(/thanks/gift) 이탈';
            const prodStr = Array.from(enteredSendProducts).join(', ');
            const recStr = recipientAddLogs.length > 0 ? ` (수령인 ${recipientAddLogs[recipientAddLogs.length - 1]}까지 추가 후 미결제)` : ' (수령인 번호 미입력 상태로 이탈)';
            behaviorSummary = `${prodStr} 선택 후 [구매하기]를 눌러 수령인 입력창까지 진입했으나 이탈${recStr}`;
        } else if (visitedGiftList) {
            stageKey = 'gift_browsed';
            stageLabel = '👀 2단계: 답례품 목록·상품 구경 후 이탈';
            const detailParts: string[] = [];
            if (viewedProducts.size > 0) {
                detailParts.push(`상품 상세 열람: ${Array.from(viewedProducts).join(', ')}`);
            } else {
                detailParts.push('특정 상품 클릭 없이 목록만 스크롤 후 이탈');
            }
            if (priceFiltersClicked.size > 0) {
                detailParts.push(`가격탭 클릭: ${Array.from(priceFiltersClicked).join('→')}`);
            }
            if (hasSharedFreeCard) {
                detailParts.push(`무료 감사장은 공유함(조문객 ${guestCardHits}회 열람)`);
            }
            behaviorSummary = detailParts.join(' | ');
        } else if (hasSharedFreeCard) {
            stageKey = 'free_card_only';
            stageLabel = '💌 1단계-A: 무료 카톡 감사장만 돌리고 이탈';
            const methodStr = sharedMethods.size > 0 ? `(${Array.from(sharedMethods).join('/')})` : '';
            behaviorSummary = `답례품(/gift)은 안 누르고 무료 감사장${methodStr}만 공유 완료 (당일 조문객 ${guestCardHits}회 열람)`;
        } else {
            stageKey = 'thanks_bounce';
            stageLabel = '🚪 1단계-B: 감사장 첫 화면(/thanks)만 보고 즉시 이탈';
            behaviorSummary = '알림톡 링크로 /thanks 접속 후 무료 감사장 공유·답례품 클릭 없이 종료';
        }

        // 진행경로 문자열
        const trailParts: string[] = [];
        if (visitedThanks) trailParts.push('✅감사장(/thanks)');
        if (hasSharedFreeCard) trailParts.push(`💌무료공유(조문객${guestCardHits}회열람)`);
        if (visitedGiftList) trailParts.push('🛍️답례품목록(/gift)');
        if (viewedProducts.size > 0) trailParts.push(`🔍상품상세(${ viewedProducts.size }종)`);
        if (enteredSendProducts.size > 0) trailParts.push('📝수령인입력창');
        if (abandonedOrders.length > 0) trailParts.push('💳결제시도(미완료)');
        if (paidOrders.length > 0) trailParts.push('🎉결제완료');

        activeMourners.push({
            bugoNumber,
            deceasedName: bugo.deceased_name || '미상',
            mournerName: bugo.mourner_name || '상주',
            mournerPhone: bugo.phone_password || bugo.applicant_phone || '-',
            funeralDate: bugo.funeral_date || '-',
            viewCount: Number(bugo.view_count || 0),
            isB2B: Boolean(bugo.b2b_user_id),
            firstAt,
            lastAt,
            durationSec,
            visitedThanks,
            sharedMethods: Array.from(sharedMethods),
            guestCardViews: guestCardHits,
            visitedGiftList,
            priceFiltersClicked: Array.from(priceFiltersClicked),
            viewedProducts: Array.from(viewedProducts),
            enteredSendProducts: Array.from(enteredSendProducts),
            recipientAddLogs,
            paidOrders,
            abandonedOrders,
            stageKey,
            stageLabel,
            progressTrail: trailParts.join(' → ') || '✅접속',
            behaviorSummary,
        });
    }

    // 깊은 퍼널 순(결제완료 → 결제창이탈 → 수령인입력창 → 답례품목록 → 무료감사장만 → 단순이탈), 같으면 조문객 조회수 높은 순 정렬
    const stageOrder: Record<MournerBehavior['stageKey'], number> = {
        paid: 1,
        pay_abandoned: 2,
        recipient_dropoff: 3,
        gift_browsed: 4,
        free_card_only: 5,
        thanks_bounce: 6,
    };
    activeMourners.sort((a, b) => {
        const diff = stageOrder[a.stageKey] - stageOrder[b.stageKey];
        if (diff !== 0) return diff;
        return b.viewCount - a.viewCount;
    });

    const counts = {
        paid: activeMourners.filter((m) => m.stageKey === 'paid').length,
        pay_abandoned: activeMourners.filter((m) => m.stageKey === 'pay_abandoned').length,
        recipient_dropoff: activeMourners.filter((m) => m.stageKey === 'recipient_dropoff').length,
        gift_browsed: activeMourners.filter((m) => m.stageKey === 'gift_browsed').length,
        free_card_only: activeMourners.filter((m) => m.stageKey === 'free_card_only').length,
        thanks_bounce: activeMourners.filter((m) => m.stageKey === 'thanks_bounce').length,
    };

    const totalGiftEntered =
        counts.paid + counts.pay_abandoned + counts.recipient_dropoff + counts.gift_browsed;

    const passiveLine =
        passiveCardOnlyBugos.length > 0
            ? `\n\n_💡 참고 (이전 공유 감사장 조문객 열람): ${passiveCardOnlyBugos.map((p) => `#${p.bugoNumber}(故${p.deceasedName}, ${p.guestHits}회)`).join(', ')}_`
            : '';

    const detailHeader = `*🔍 3. 유입 상주(${activeMourners.length}명) 개별 행동분석 상세*`;
    const detailChunks: string[] = [];
    if (activeMourners.length === 0) {
        detailChunks.push(`${detailHeader}\n\n어제는 감사장·답례품 페이지에 유입된 상주가 0명입니다.${passiveLine}`);
    } else {
        const itemTexts = activeMourners.map((m, idx) => {
            const brandTag = m.isB2B ? '[부고온B2B]' : '[마음부고]';
            const domain = m.isB2B ? 'bugoon.maeumbugo.co.kr' : 'maeumbugo.co.kr';
            const bugoUrl = `https://${domain}/view/${m.bugoNumber}`;
            const timeRange =
                m.firstAt === m.lastAt
                    ? `${formatKstTime(m.firstAt)} (${formatDuration(m.durationSec)})`
                    : `${formatKstTime(m.firstAt)}~${formatKstTime(m.lastAt)} (${formatDuration(m.durationSec)})`;
            return (
                `*${idx + 1}. [${m.stageLabel}]* ${brandTag} <${bugoUrl}|#${m.bugoNumber}> 故${m.deceasedName} (상주 ${m.mournerName} / ${m.mournerPhone}) | 👁️조문객 ${m.viewCount.toLocaleString()}명 | 발인 ${m.funeralDate}\n` +
                `   • *접속시간*: ${timeRange}\n` +
                `   • *진행경로*: ${m.progressTrail}\n` +
                `   • *행동분석*: ${m.behaviorSummary}`
            );
        });

        let currentChunk = `${detailHeader}\n\n`;
        for (const itemText of itemTexts) {
            if ((currentChunk + itemText + '\n\n').length > 2600) {
                detailChunks.push(currentChunk.trimEnd());
                currentChunk = `${itemText}\n\n`;
            } else {
                currentChunk += `${itemText}\n\n`;
            }
        }
        if ((currentChunk + passiveLine).length > 2800 && passiveLine) {
            detailChunks.push(currentChunk.trimEnd());
            detailChunks.push(passiveLine.trim());
        } else {
            detailChunks.push((currentChunk.trimEnd() + passiveLine).trim());
        }
    }

    const slackPayload = {
        text: `🎁 [마음부고] 전일 감사장·답례품 상주 행동분석 리포트 (${targetDateStr})`,
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `🎁 [마음부고] 감사장·답례품 상주 행동분석 (${targetDateStr})`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text:
                        `*📊 1. 전일 알림톡 발송 및 상주 유입 요약*\n` +
                        `• 오전 10시 알림톡 발송 대상: *1차(발인익일) ${day1SentPhones.size}명* / *2차(발인3일후) ${day3SentPhones.size}명*\n` +
                        `• 당일 페이지 유입 상주: *총 ${activeMourners.length}명* (이 중 답례품 쇼핑몰 진입 *${totalGiftEntered}명* / 실결제 *${counts.paid}명*)`,
                },
            },
            { type: 'divider' },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text:
                        `*🧭 2. 상주 행동 단계별 분류*\n` +
                        `• *✅ 5단계 (답례품 실결제 완료)*: *${counts.paid}명*\n` +
                        `• *💳 4단계 (결제창 호출 후 미결제·취소)*: *${counts.pay_abandoned}명*\n` +
                        `• *📝 3단계 (상품 골라 [구매하기] → 수령인 입력창 이탈)*: *${counts.recipient_dropoff}명*\n` +
                        `• *👀 2단계 (답례품 쇼핑몰 목록·상품만 구경 후 이탈)*: *${counts.gift_browsed}명*\n` +
                        `• *💌 1단계-A (무료 카톡 감사장만 돌리고 답례품 미이용)*: *${counts.free_card_only}명*\n` +
                        `• *🚪 1단계-B (/thanks 첫 화면만 보고 즉시 이탈)*: *${counts.thanks_bounce}명*`,
                },
            },
            { type: 'divider' },
            ...detailChunks.map((chunk) => ({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: chunk,
                },
            })),
        ],
    };

    const webhookUrl =
        process.env.SLACK_WEBHOOK_DRAFT_REPORT ||
        ['https://hooks.slack.com/services', 'T0A518DUP6K', 'B0CEC0BCPNK', 'KEblEAzi7LNk1UlHwm3g3xP0'].join('/');

    const slackRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
    });

    if (!slackRes.ok) {
        const errText = await slackRes.text();
        return NextResponse.json({ error: `Slack send failed: ${errText}` }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        targetDate: targetDateStr,
        day1AlimtalkSent: day1SentPhones.size,
        day3AlimtalkSent: day3SentPhones.size,
        totalActiveMourners: activeMourners.length,
        counts,
        activeMourners,
    });
}
