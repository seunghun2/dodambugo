'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { formatPhoneInput, isValidMobile, maskPhone, normalizePhone, phoneDedupeKey } from '@/lib/gift/phone';
import type { RecipientItem } from './types';

export const MAX_RECIPIENTS = 200;
const SOURCE_LABEL: Record<RecipientItem['source'], string> = {
    contact: '연락처',
    excel: '엑셀',
    manual: '직접입력',
    condolence: '조의금',
    flower: '화환',
};
const HEADER_WORDS = /이름|성명|name|연락처|전화|휴대폰|핸드폰|번호|phone/i;

// Contact Picker API (안드로이드 크롬 전용, TS 기본 lib 에는 없음)
interface ContactsNavigator {
    contacts: {
        select(properties: string[], options: { multiple: boolean }): Promise<Array<{ name?: string[]; tel?: string[] }>>;
    };
}

interface Candidate {
    ref: string;
    dedupeKey?: string;
    name: string;
    maskedPhone: string;
    summary: string;
    valid: boolean;
    source?: 'condolence' | 'flower';
}

let seq = 0;
const nextKey = () => `r${Date.now().toString(36)}${seq++}`;

type Platform = 'android-chrome' | 'android-other' | 'other';

/** 연락처 불러오기는 안드로이드만 노출. iOS·PC 는 버튼 자체를 숨긴다. */
function detectPlatform(): Platform {
    const ua = navigator.userAgent || '';
    const uaPlatform = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || '';
    // 갤럭시 폴드 펼침/데스크톱 모드에서는 UA가 'X11; Linux x86_64'로 바뀌므로 Linux + 터치 기기도 안드로이드로 판별
    const isAndroid =
        /Android/i.test(ua) ||
        /Android/i.test(uaPlatform) ||
        (/Linux/i.test(ua) && !/Windows|Macintosh|iPhone|iPad/i.test(ua) && navigator.maxTouchPoints > 0);
    if (!isAndroid) return 'other';
    // 크롬 본체만 통과: WebView(; wv), 삼성/웨일/네이버/카카오 등 'Chrome' 문자열을 흉내 내는 브라우저는 제외
    const isChrome =
        /Chrome\/\d+/.test(ua) &&
        !/; wv\)|Version\/\d|SamsungBrowser|EdgA|OPR\/|OPT\/|Whale|NAVER|KAKAOTALK|DuckDuckGo|Firefox|UCBrowser|MiuiBrowser|FBAN|FBAV|Instagram|Line\//i.test(ua);
    return isChrome ? 'android-chrome' : 'android-other';
}

/** 현재 페이지를 크롬으로 다시 연다 (작성 중인 초안 데이터를 URL에 실어 전달) */
function openInChrome(targetUrl?: string) {
    const url = targetUrl || window.location.href;
    if (/KAKAOTALK/i.test(navigator.userAgent)) {
        window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
        return;
    }
    const u = new URL(url);
    window.location.href = `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
}

/**
 * 카톡·메모장·문자·엑셀 등에서 복사한 자유 형식 텍스트에서
 * 이름 + 010 휴대폰 번호를 자동 추출한다.
 */
function parseBulkContacts(rawText: string): { items: RecipientItem[]; invalidCount: number } {
    const items: RecipientItem[] = [];
    let invalidCount = 0;
    const phoneRegex = /(?:\+?82[\s.-]*)?0?1[016789][\s.-]*\d{3,4}[\s.-]*\d{4}/g;

    const lines = rawText
        .split(/\r?\n|;|\/|\|/)
        .map((l) => l.trim())
        .filter(Boolean);

    for (const line of lines) {
        const matches = [...line.matchAll(phoneRegex)];
        if (matches.length === 0) {
            // 숫자가 9자리 이상 들어있는데 정규식에 안 걸린 경우 번호 오류로 카운트
            const digits = line.replace(/\D/g, '');
            if (digits.length >= 9) invalidCount++;
            continue;
        }

        for (let i = 0; i < matches.length; i++) {
            const m = matches[i];
            const rawPhone = m[0];
            const phone = normalizePhone(rawPhone);
            if (!isValidMobile(phone)) {
                invalidCount++;
                continue;
            }

            // 한 줄에 번호가 1개면 줄 전체에서 번호를 뺀 나머지를 이름으로 추출,
            // 한 줄에 번호가 여러 개(쉼표 구분 등)면 직전 번호 끝~현재 번호 사이에서 이름 추출
            const prevEnd = i === 0 ? 0 : (matches[i - 1].index ?? 0) + matches[i - 1][0].length;
            const curStart = m.index ?? 0;
            const curEnd = curStart + rawPhone.length;
            const nextStart = i + 1 < matches.length ? (matches[i + 1].index ?? line.length) : line.length;

            const before = line.slice(prevEnd, curStart);
            const after = matches.length === 1 ? line.slice(curEnd, nextStart) : '';
            const rawNameCandidate = (before.trim() || after.trim())
                .replace(/^\d+[.)]\s*/, '') // "1. ", "2) " 등 순번 제거
                .replace(/\b\d[\d,]*\s*(?:만\s*원|천\s*원|원)\b/g, '') // "10만원", "50,000원" 등 금액 메모 제거
                .replace(/(?:조의금|부의금|화환|근조|연락처|전화번호|휴대폰|핸드폰|번호|이름|성명)/g, '')
                .replace(/[\[\]()<>:：,，.\-·•*\t]+/g, ' ')
                .trim();

            // 너무 긴 문장이면 첫 어절만 이름으로 사용
            const cleanName = rawNameCandidate.split(/\s+/).slice(0, 2).join(' ').slice(0, 20);

            items.push({
                key: nextKey(),
                name: cleanName,
                phone,
                dedupeKey: phoneDedupeKey(phone),
                maskedPhone: maskPhone(phone),
                source: 'manual',
            });
        }
    }

    return { items, invalidCount };
}

export default function RecipientPanel({
    items,
    setItems,
    bugoId,
    ensureAuth,
    notify,
    buildShareableDraftUrl,
}: {
    items: RecipientItem[];
    setItems: (updater: (prev: RecipientItem[]) => RecipientItem[]) => void;
    bugoId: string;
    ensureAuth: () => Promise<boolean>;
    notify: (msg: string) => void;
    buildShareableDraftUrl?: () => string;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [inputTab, setInputTab] = useState<'direct' | 'paste' | null>('direct');
    const [dName, setDName] = useState('');
    const [dPhone, setDPhone] = useState('');
    const [bulkText, setBulkText] = useState('');

    // 부고장 조문 내역(조의금+화환 통합) 모달 상태
    const [listOpen, setListOpen] = useState(false);
    const [listFilter, setListFilter] = useState<'all' | 'condolence' | 'flower'>('all');
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [checked, setChecked] = useState<Set<string>>(new Set());
    const [listLoading, setListLoading] = useState(false);
    const [historyCounts, setHistoryCounts] = useState<{ total: number; condolence: number; flower: number } | null>(null);

    // 비동기 핸들러(엑셀 읽기 등)에서도 항상 최신 목록 기준으로 계산하기 위한 ref
    const itemsRef = useRef(items);
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // 페이지 진입 시 부고장 조문 내역(조의금+화환) 총 인원수 미리 조회
    useEffect(() => {
        if (!bugoId) return;
        let cancelled = false;
        fetch(`/api/gift/recipients?bugoId=${encodeURIComponent(bugoId)}&source=count`, { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!cancelled && data && typeof data.count === 'number') {
                    setHistoryCounts({
                        total: data.count,
                        condolence: data.condolenceCount || 0,
                        flower: data.flowerCount || 0,
                    });
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [bugoId]);

    /**
     * 중복(번호/ref/dedupeKey 기준) 자동 통합·번호 오류·최대 인원을 걸러서 추가하고 결과를 토스트로 알린다.
     * 조의금과 화환을 모두 보낸 동일인을 둘 다 체크하면 2명이 아니라 1명으로 합쳐지고 메모만 병합된다.
     */
    const addItems = (incoming: RecipientItem[], invalidCount = 0) => {
        const next = [...itemsRef.current];
        let added = 0;
        let merged = 0;
        let over = 0;

        for (const raw of incoming) {
            const dk = raw.dedupeKey || (raw.phone ? phoneDedupeKey(raw.phone) : undefined);
            const it: RecipientItem = { ...raw, dedupeKey: dk };

            const existingIdx = next.findIndex(
                (ex) =>
                    (dk && ex.dedupeKey && ex.dedupeKey === dk) ||
                    (it.phone && ex.phone && ex.phone === it.phone) ||
                    (it.ref && ex.ref && ex.ref === it.ref)
            );

            if (existingIdx >= 0) {
                // 이미 담긴 동일인이면 인원수는 늘리지 않고(1명 유지) 부가 메모/이름만 보강
                const prev = next[existingIdx];
                const combinedNote =
                    prev.note && it.note && !prev.note.includes(it.note)
                        ? `${prev.note} · ${it.note}`
                        : prev.note || it.note;
                next[existingIdx] = {
                    ...prev,
                    name: prev.name || it.name,
                    phone: prev.phone || it.phone,
                    ref: prev.ref || it.ref,
                    dedupeKey: prev.dedupeKey || dk,
                    note: combinedNote,
                };
                merged++;
                continue;
            }

            if (next.length >= MAX_RECIPIENTS) {
                over++;
                continue;
            }
            next.push(it);
            added++;
        }

        itemsRef.current = next;
        setItems(() => next);

        const parts: string[] = [];
        if (added > 0) parts.push(`${added}명 추가`);
        if (merged > 0) parts.push(`동일인 ${merged}건은 1명으로 통합`);
        if (invalidCount) parts.push(`번호 오류 ${invalidCount}명 제외`);
        if (over) parts.push(`최대 ${MAX_RECIPIENTS}명 초과 ${over}명 제외`);
        if (parts.length > 0) notify(parts.join(' · '));
    };

    // ---------- 연락처 (Contact Picker API: 안드로이드 전용 — 절대 유지) ----------
    const platform = useSyncExternalStore<Platform>(
        () => () => {},
        detectPlatform,
        () => 'other'
    );
    const [chromeAsk, setChromeAsk] = useState(false);

    const pickContacts = async () => {
        // 안드로이드인데 크롬이 아니면 크롬으로 이동할지 먼저 물어본다
        if (platform === 'android-other') {
            setChromeAsk(true);
            return;
        }
        if (!window.isSecureContext) {
            notify('연락처 불러오기는 https 보안 연결에서만 쓸 수 있어요. 붙여넣기·직접 입력을 이용해주세요.');
            return;
        }
        if (!('contacts' in navigator) || !('ContactsManager' in window)) {
            notify('이 기기에서는 연락처 불러오기를 지원하지 않아요. 붙여넣기를 이용해주세요.');
            return;
        }
        try {
            const picker = (navigator as unknown as ContactsNavigator).contacts;
            const picked = await picker.select(['name', 'tel'], { multiple: true });
            const out: RecipientItem[] = [];
            let invalid = 0;
            for (const c of picked) {
                const phone = (c.tel || []).map(normalizePhone).find(isValidMobile);
                if (!phone) {
                    invalid++;
                    continue;
                }
                out.push({
                    key: nextKey(),
                    name: (c.name?.[0] || '').trim().slice(0, 20),
                    phone,
                    dedupeKey: phoneDedupeKey(phone),
                    maskedPhone: maskPhone(phone),
                    source: 'contact',
                });
            }
            if (picked.length) addItems(out, invalid);
        } catch (e) {
            const name = (e as { name?: string })?.name;
            if (name === 'AbortError') return;
            if (name === 'SecurityError') notify('연락처 접근이 막혀 있어요. 크롬 앱의 사이트 설정에서 확인해주세요.');
            else notify(`연락처를 불러오지 못했습니다.${name ? ` (${name})` : ''}`);
        }
    };

    // ---------- 엑셀 업로드 (붙여넣기 창 안의 보조 링크) ----------
    const onFile = async (file: File | undefined) => {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return notify('파일이 너무 큽니다. (최대 2MB)');
        if (!/\.xlsx$/i.test(file.name)) return notify('.xlsx 엑셀 파일만 올릴 수 있습니다.');
        try {
            const { readSheet } = await import('read-excel-file/browser');
            const rows = (await readSheet(file)) as unknown[][];
            const out: RecipientItem[] = [];
            let invalid = 0;
            let seenFirstRow = false;
            for (const row of rows.slice(0, 1000)) {
                const cells = row.map((c) => (c == null ? '' : String(c).trim()));
                if (cells.every((c) => !c)) continue;
                const isFirstRow = !seenFirstRow;
                seenFirstRow = true;
                if (isFirstRow && cells.some((c) => HEADER_WORDS.test(c)) && !cells.some((c) => isValidMobile(normalizePhone(c)))) continue;
                const phoneIdx = cells.findIndex((c) => /^[\d\s\-+().]+$/.test(c) && isValidMobile(normalizePhone(c)));
                if (phoneIdx < 0) {
                    invalid++;
                    continue;
                }
                const phone = normalizePhone(cells[phoneIdx]);
                const name = cells.find((c, i) => i !== phoneIdx && c && !/^[\d\s\-+().]+$/.test(c)) || '';
                out.push({
                    key: nextKey(),
                    name: name.slice(0, 20),
                    phone,
                    dedupeKey: phoneDedupeKey(phone),
                    maskedPhone: maskPhone(phone),
                    source: 'excel',
                });
            }
            if (!out.length && !invalid) return notify('읽을 수 있는 행이 없습니다. 이름, 휴대폰번호 두 열로 작성해주세요.');
            addItems(out, invalid);
        } catch {
            notify('엑셀 파일을 읽지 못했습니다. .xlsx 형식인지 확인해주세요.');
        } finally {
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    // ---------- 직접 입력 + 스마트 붙여넣기 결합 ----------
    const addDirect = () => {
        // 만약 이름이나 번호 칸에 '홍길동 010-1234-5678' 처럼 같이 넣었으면 스마트 파싱
        const combined = `${dName} ${dPhone}`.trim();
        const phone = normalizePhone(dPhone);
        if (!isValidMobile(phone)) {
            const parsed = parseBulkContacts(combined);
            if (parsed.items.length > 0) {
                addItems(parsed.items, parsed.invalidCount);
                setDName('');
                setDPhone('');
                return;
            }
            return notify('휴대폰 번호 11자리를 정확히 입력해주세요. (예: 010-1234-5678)');
        }
        addItems([
            {
                key: nextKey(),
                name: dName.trim().slice(0, 20),
                phone,
                dedupeKey: phoneDedupeKey(phone),
                maskedPhone: maskPhone(phone),
                source: 'manual',
            },
        ]);
        setDName('');
        setDPhone('');
    };

    // 직접 입력칸에 여러 줄 또는 '홍길동 010-1234-5678'을 붙여넣었을 때 자동 감지
    const handleDirectPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData?.getData('text') || '';
        if (!text) return;
        const parsed = parseBulkContacts(text);
        if (parsed.items.length >= 2 || (parsed.items.length === 1 && parsed.items[0].name)) {
            e.preventDefault();
            addItems(parsed.items, parsed.invalidCount);
            setDName('');
            setDPhone('');
        }
    };

    // ---------- 카톡/메모장 대량 붙여넣기 ----------
    const parsedPreview = useMemo(() => parseBulkContacts(bulkText), [bulkText]);

    const addBulkPaste = () => {
        if (!bulkText.trim()) {
            return notify('카톡·메모장·문자·엑셀에서 복사한 이름·전화번호를 붙여넣어 주세요.');
        }
        if (parsedPreview.items.length === 0) {
            return notify('인식된 휴대폰 번호(010-xxxx-xxxx)가 없습니다.');
        }
        addItems(parsedPreview.items, parsedPreview.invalidCount);
        setBulkText('');
    };

    // ---------- 부고장 조문 내역 통합 불러오기 (조의금 + 화환) ----------
    const openHistoryModal = async () => {
        if (!(await ensureAuth())) return;
        setListLoading(true);
        setListOpen(true);
        setListFilter('all');
        setCandidates([]);
        setChecked(new Set());
        try {
            const res = await fetch(`/api/gift/recipients?bugoId=${encodeURIComponent(bugoId)}&source=all`, { cache: 'no-store' });
            if (res.status === 401) {
                setListOpen(false);
                notify('상주 확인이 만료되었습니다. 다시 시도해주세요.');
                return;
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            const loaded: Candidate[] = data.items || [];
            setCandidates(loaded);
            // 기본적으로 유효한 전체 후보를 미리 체크해 두어 원클릭 추가가 가능하도록 지원
            const initialChecked = new Set(loaded.filter((c) => c.valid).map((c) => c.ref));
            setChecked(initialChecked);
        } catch {
            setListOpen(false);
            notify('조문 내역을 불러오지 못했습니다.');
        } finally {
            setListLoading(false);
        }
    };

    const filteredCandidates = useMemo(() => {
        if (listFilter === 'all') return candidates;
        return candidates.filter((c) => c.source === listFilter);
    }, [candidates, listFilter]);

    const selectable = filteredCandidates.filter((c) => c.valid);

    const confirmList = () => {
        if (!listOpen) return;
        const out = candidates
            .filter((c) => checked.has(c.ref))
            .map<RecipientItem>((c) => ({
                key: nextKey(),
                name: c.name,
                ref: c.ref,
                dedupeKey: c.dedupeKey,
                maskedPhone: c.maskedPhone,
                source: c.source || 'condolence',
                note: c.summary,
            }));
        setListOpen(false);
        if (out.length) addItems(out);
    };

    const countBadgeText =
        historyCounts === null
            ? ''
            : `(${historyCounts.total})`;

    return (
        <section className="gs-section">
            <div className="gs-row-between">
                <h3 className="gs-h3">
                    받는 사람 <small>({items.length}명)</small>
                </h3>
                {items.length > 0 && (
                    <button className="gs-link" onClick={() => setItems(() => [])}>
                        전체 제외
                    </button>
                )}
            </div>

            {/*
                버튼 배치 규칙
                - 조문내역 1명 이상: 맨 앞 + 노란 강조 (가장 전환이 높은 경로)
                - 조문내역 0명/조회 전: 버튼 숨김
                - 안드로이드: 연락처 불러오기 항상 노출 (필수)
                - 아이폰/PC: 연락처 불러오기 없음
                  → [조문내역] [직접입력] [붙여넣기] / [직접입력] [붙여넣기]
            */}
            <div className="gs-add-row">
                {(historyCounts?.total ?? 0) > 0 && (
                    <button className="gs-add gs-add-primary" onClick={openHistoryModal}>
                        + 조문내역{countBadgeText}
                    </button>
                )}
                {platform !== 'other' && (
                    <button className="gs-add" onClick={pickContacts}>
                        + 연락처
                        <br />
                        불러오기
                    </button>
                )}
                <button
                    className={`gs-add ${inputTab === 'direct' ? 'on' : ''}`}
                    onClick={() => setInputTab((v) => (v === 'direct' ? null : 'direct'))}
                >
                    + 직접입력
                </button>
                <button
                    className={`gs-add ${inputTab === 'paste' ? 'on' : ''}`}
                    onClick={() => setInputTab((v) => (v === 'paste' ? null : 'paste'))}
                >
                    + 붙여넣기
                </button>
            </div>

            {inputTab === 'direct' && (
                <div className="gs-direct-wrap">
                    <div className="gs-direct">
                        <input
                            value={dName}
                            onChange={(e) => setDName(e.target.value)}
                            onPaste={handleDirectPaste}
                            placeholder="이름 (선택)"
                            maxLength={20}
                            aria-label="받는 사람 이름"
                        />
                        <input
                            value={dPhone}
                            onChange={(e) => setDPhone(formatPhoneInput(e.target.value))}
                            onPaste={handleDirectPaste}
                            placeholder="010-0000-0000"
                            inputMode="numeric"
                            maxLength={13}
                            aria-label="받는 사람 휴대폰 번호"
                            onKeyDown={(e) => e.key === 'Enter' && addDirect()}
                        />
                        <button className="gs-btn-dark" onClick={addDirect}>
                            추가
                        </button>
                    </div>
                    <p className="gs-direct-sub">
                        여러 명을 한 번에 넣으시려면 <b>‘+ 붙여넣기’</b>를 눌러보세요.
                    </p>
                </div>
            )}

            {inputTab === 'paste' && (
                <div className="gs-paste-box">
                    <textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        rows={5}
                        placeholder={`카톡·메모장·문자·엑셀에서 복사한 명단을 그대로 붙여넣으세요.\n\n예시)\n홍길동 010-1234-5678\n김철수 01098765432\n010-5555-6666 박영희`}
                        aria-label="카톡, 메모장, 문자, 엑셀 연락처 목록 붙여넣기"
                    />
                    <div className="gs-paste-foot">
                        <span className="gs-paste-status">
                            {bulkText.trim()
                                ? `인식된 번호 ${parsedPreview.items.length}명${parsedPreview.invalidCount ? ` (오류 ${parsedPreview.invalidCount}건 제외)` : ''}`
                                : '이름과 010 번호만 자동으로 골라냅니다'}
                        </span>
                        <button
                            className="gs-btn-dark gs-paste-btn"
                            disabled={parsedPreview.items.length === 0}
                            onClick={addBulkPaste}
                        >
                            {parsedPreview.items.length > 0 ? `${parsedPreview.items.length}명 한 번에 추가` : '한 번에 추가'}
                        </button>
                    </div>
                    <div className="gs-excel-bar">
                        <button type="button" className="gs-excel-btn" onClick={() => fileRef.current?.click()}>
                            엑셀 파일(.xlsx) 올리기
                        </button>
                        <span className="gs-excel-sep">·</span>
                        <a href="/samples/gift-recipients-sample.xlsx" download className="gs-excel-dl">
                            양식 받기
                        </a>
                        <input ref={fileRef} type="file" accept=".xlsx" hidden onChange={(e) => onFile(e.target.files?.[0])} />
                    </div>
                </div>
            )}

            {items.length === 0 && (
                <ul className="gs-tips">
                    <li>
                        <b>붙여넣기</b> 카톡·메모장·문자·엑셀의 이름·번호를 붙여넣으면 즉시 등록돼요
                    </li>
                    {(historyCounts?.total ?? 0) > 0 && (
                        <li>
                            <b>조문내역</b> 조의금·화환 보내주신 분을 한 번에 불러와요
                        </li>
                    )}
                    <li>
                        <b>최대 {MAX_RECIPIENTS}명</b> · 같은 번호는 중복 없이 한 번만 담겨요
                    </li>
                </ul>
            )}

            {chromeAsk && (
                <div className="gs-overlay gs-center-wrap" onClick={() => setChromeAsk(false)}>
                    <div className="gs-dialog gs-ask" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="연락처 불러오기">
                        <span className="gs-ask-icon" aria-hidden="true">
                            !
                        </span>
                        <h3 className="gs-h3">연락처 불러오기</h3>
                        <p>
                            간편하게 선물을 보내실 수 있는
                            <br />
                            연락처 불러오기 기능은 구글 크롬(Chrome)
                            <br />
                            브라우저에서만 가능합니다. 이동하시겠습니까?
                        </p>
                        <div className="gs-dialog-btns">
                            <button className="gs-btn-light" onClick={() => setChromeAsk(false)}>
                                취소
                            </button>
                            <button
                                className="gs-btn-dark"
                                onClick={() => {
                                    setChromeAsk(false);
                                    openInChrome(buildShareableDraftUrl?.());
                                }}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {items.length > 0 && (
                <ul className="gs-recipients">
                    {items.map((r) => (
                        <li key={r.key}>
                            <span className="gs-tag">{SOURCE_LABEL[r.source]}</span>
                            <div className="gs-rec-main">
                                <strong>{r.name || '이름 없음'}</strong>
                                <span>
                                    {r.maskedPhone}
                                    {r.note ? ` · ${r.note}` : ''}
                                </span>
                            </div>
                            <button className="gs-mini" onClick={() => setItems((prev) => prev.filter((x) => x.key !== r.key))}>
                                제외
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {listOpen && (
                <div className="gs-overlay gs-sheet-wrap" onClick={() => setListOpen(false)}>
                    <div className="gs-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="gs-row-between">
                            <h3 className="gs-h3">부고장 조문 내역 불러오기</h3>
                            <button className="gs-icon-btn" onClick={() => setListOpen(false)} aria-label="닫기">
                                ✕
                            </button>
                        </div>

                        <div className="gs-chips" style={{ marginTop: 10, marginBottom: 6 }}>
                            <button
                                type="button"
                                className={`gs-chip ${listFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setListFilter('all')}
                            >
                                전체 ({candidates.length})
                            </button>
                            <button
                                type="button"
                                className={`gs-chip ${listFilter === 'condolence' ? 'active' : ''}`}
                                onClick={() => setListFilter('condolence')}
                            >
                                조의금 ({candidates.filter((c) => c.source === 'condolence').length})
                            </button>
                            <button
                                type="button"
                                className={`gs-chip ${listFilter === 'flower' ? 'active' : ''}`}
                                onClick={() => setListFilter('flower')}
                            >
                                화환 ({candidates.filter((c) => c.source === 'flower').length})
                            </button>
                        </div>

                        {listLoading ? (
                            <p className="gs-empty">불러오는 중…</p>
                        ) : filteredCandidates.length === 0 ? (
                            <p className="gs-empty">해당하는 조문 내역이 없습니다.</p>
                        ) : (
                            <>
                                <label className="gs-check-all">
                                    <input
                                        type="checkbox"
                                        checked={selectable.length > 0 && selectable.every((c) => checked.has(c.ref))}
                                        onChange={(e) => {
                                            setChecked((prev) => {
                                                const next = new Set(prev);
                                                if (e.target.checked) {
                                                    selectable.forEach((c) => next.add(c.ref));
                                                } else {
                                                    selectable.forEach((c) => next.delete(c.ref));
                                                }
                                                return next;
                                            });
                                        }}
                                    />
                                    현재 목록 전체 선택 ({selectable.length}명)
                                </label>
                                <ul className="gs-cand">
                                    {filteredCandidates.map((c) => {
                                        const alreadyAdded =
                                            !!c.dedupeKey && items.some((ex) => ex.dedupeKey && ex.dedupeKey === c.dedupeKey);
                                        return (
                                            <li key={c.ref} className={c.valid ? '' : 'disabled'}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        disabled={!c.valid}
                                                        checked={checked.has(c.ref)}
                                                        onChange={(e) =>
                                                            setChecked((prev) => {
                                                                const n = new Set(prev);
                                                                if (e.target.checked) n.add(c.ref);
                                                                else n.delete(c.ref);
                                                                return n;
                                                            })
                                                        }
                                                    />
                                                    <span className="gs-tag">
                                                        {c.source === 'flower' ? '화환' : '조의금'}
                                                    </span>
                                                    <div className="gs-rec-main">
                                                        <strong>
                                                            {c.name || '이름 없음'}
                                                            {alreadyAdded ? ' (이미 선택됨)' : ''}
                                                        </strong>
                                                        <span>
                                                            {c.maskedPhone} · {c.summary}
                                                        </span>
                                                    </div>
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </>
                        )}
                        <button className="gs-cta" disabled={checked.size === 0} onClick={confirmList}>
                            {checked.size}명 한 번에 추가
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
