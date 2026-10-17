'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { isValidMobile, maskPhone, normalizePhone } from '@/lib/gift/phone';
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
    name: string;
    maskedPhone: string;
    summary: string;
    valid: boolean;
}

let seq = 0;
const nextKey = () => `r${Date.now().toString(36)}${seq++}`;

type Platform = 'android-chrome' | 'android-other' | 'other';

/** 연락처 불러오기는 안드로이드 크롬만 가능. iOS·PC 는 버튼 자체를 숨긴다. */
function detectPlatform(): Platform {
    const ua = navigator.userAgent || '';
    if (!/Android/i.test(ua)) return 'other';
    // 크롬 본체만 통과: WebView(; wv), 삼성/웨일/네이버/카카오 등 'Chrome' 문자열을 흉내 내는 브라우저는 제외
    const isChrome =
        /Chrome\/\d+/.test(ua) &&
        !/; wv\)|Version\/\d|SamsungBrowser|EdgA|OPR\/|OPT\/|Whale|NAVER|KAKAOTALK|DuckDuckGo|Firefox|UCBrowser|MiuiBrowser|FBAN|FBAV|Instagram|Line\//i.test(ua);
    return isChrome ? 'android-chrome' : 'android-other';
}

/** 현재 페이지를 크롬으로 다시 연다 (크롬 미설치 시 현재 주소 유지) */
function openInChrome() {
    const url = window.location.href;
    if (/KAKAOTALK/i.test(navigator.userAgent)) {
        window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
        return;
    }
    const u = new URL(url);
    window.location.href = `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
}

export default function RecipientPanel({
    items,
    setItems,
    bugoId,
    ensureAuth,
    notify,
}: {
    items: RecipientItem[];
    setItems: (updater: (prev: RecipientItem[]) => RecipientItem[]) => void;
    bugoId: string;
    ensureAuth: () => Promise<boolean>;
    notify: (msg: string) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [directOpen, setDirectOpen] = useState(false);
    const [dName, setDName] = useState('');
    const [dPhone, setDPhone] = useState('');
    const [listOpen, setListOpen] = useState<null | 'condolence' | 'flower'>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [checked, setChecked] = useState<Set<string>>(new Set());
    const [listLoading, setListLoading] = useState(false);

    // 비동기 핸들러(엑셀 읽기 등)에서도 항상 최신 목록 기준으로 계산하기 위한 ref
    const itemsRef = useRef(items);
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    /** 중복(번호/ref 기준)·번호 오류·최대 인원을 걸러서 추가하고 결과를 토스트로 알린다 */
    const addItems = (incoming: RecipientItem[], invalidCount = 0) => {
        // 집계는 setState updater 밖에서 한다. (updater 안에서 하면 StrictMode 2회 실행으로 숫자가 두 배가 됨)
        const next = [...itemsRef.current];
        const phones = new Set(next.map((i) => i.phone).filter(Boolean) as string[]);
        const refs = new Set(next.map((i) => i.ref).filter(Boolean) as string[]);
        let added = 0;
        let dup = 0;
        let over = 0;
        for (const it of incoming) {
            if ((it.phone && phones.has(it.phone)) || (it.ref && refs.has(it.ref))) {
                dup++;
                continue;
            }
            if (next.length >= MAX_RECIPIENTS) {
                over++;
                continue;
            }
            next.push(it);
            if (it.phone) phones.add(it.phone);
            if (it.ref) refs.add(it.ref);
            added++;
        }
        itemsRef.current = next;
        setItems(() => next);

        const parts = [`${added}명 추가`];
        if (dup) parts.push(`중복 ${dup}명 제외`);
        if (invalidCount) parts.push(`번호 오류 ${invalidCount}명 제외`);
        if (over) parts.push(`최대 ${MAX_RECIPIENTS}명 초과 ${over}명 제외`);
        notify(parts.join(' · '));
    };

    // ---------- 연락처 (Contact Picker API: 안드로이드 크롬 전용) ----------
    // 서버 렌더에서는 'other'(버튼 숨김), 클라이언트에서만 실제 기기를 판별 → 하이드레이션 불일치 없음
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
            notify('연락처 불러오기는 https 보안 연결에서만 쓸 수 있어요. 엑셀 업로드·직접 입력을 이용해주세요.');
            return;
        }
        if (!('contacts' in navigator) || !('ContactsManager' in window)) {
            notify('이 기기에서는 연락처 불러오기를 지원하지 않아요. 엑셀 업로드·직접 입력을 이용해주세요.');
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
                out.push({ key: nextKey(), name: (c.name?.[0] || '').trim().slice(0, 20), phone, maskedPhone: maskPhone(phone), source: 'contact' });
            }
            if (picked.length) addItems(out, invalid);
        } catch (e) {
            const name = (e as { name?: string })?.name;
            // 사용자가 선택 창을 닫은 경우(AbortError)는 안내하지 않는다
            if (name === 'AbortError') return;
            if (name === 'SecurityError') notify('연락처 접근이 막혀 있어요. 크롬 앱의 사이트 설정에서 확인해주세요.');
            else notify(`연락처를 불러오지 못했습니다.${name ? ` (${name})` : ''}`);
        }
    };

    // ---------- 엑셀 업로드 ----------
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
                // 헤더는 첫 번째 비어있지 않은 행만 허용 (데이터 행의 "번호없음" 같은 이름이 헤더로 오인되지 않도록)
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
                out.push({ key: nextKey(), name: name.slice(0, 20), phone, maskedPhone: maskPhone(phone), source: 'excel' });
            }
            if (!out.length && !invalid) return notify('읽을 수 있는 행이 없습니다. 이름, 휴대폰번호 두 열로 작성해주세요.');
            addItems(out, invalid);
        } catch {
            notify('엑셀 파일을 읽지 못했습니다. .xlsx 형식인지 확인해주세요.');
        } finally {
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    // ---------- 직접 입력 ----------
    const addDirect = () => {
        const phone = normalizePhone(dPhone);
        if (!isValidMobile(phone)) return notify('휴대폰 번호를 정확히 입력해주세요. (예: 010-1234-5678)');
        addItems([{ key: nextKey(), name: dName.trim().slice(0, 20), phone, maskedPhone: maskPhone(phone), source: 'manual' }]);
        setDName('');
        setDPhone('');
    };

    // ---------- 조의금 / 화환 목록 ----------
    const openList = async (source: 'condolence' | 'flower') => {
        if (!(await ensureAuth())) return;
        setListLoading(true);
        setListOpen(source);
        setCandidates([]);
        setChecked(new Set());
        try {
            const res = await fetch(`/api/gift/recipients?bugoId=${encodeURIComponent(bugoId)}&source=${source}`, { cache: 'no-store' });
            if (res.status === 401) {
                setListOpen(null);
                notify('상주 확인이 만료되었습니다. 다시 시도해주세요.');
                return;
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCandidates(data.items || []);
        } catch {
            setListOpen(null);
            notify('목록을 불러오지 못했습니다.');
        } finally {
            setListLoading(false);
        }
    };

    const confirmList = () => {
        if (!listOpen) return;
        const out = candidates
            .filter((c) => checked.has(c.ref))
            .map<RecipientItem>((c) => ({
                key: nextKey(),
                name: c.name,
                ref: c.ref,
                maskedPhone: c.maskedPhone,
                source: listOpen,
                note: c.summary,
            }));
        setListOpen(null);
        if (out.length) addItems(out);
    };

    const selectable = candidates.filter((c) => c.valid);

    return (
        <section className="gs-section">
            <div className="gs-row-between">
                <h3 className="gs-h3">
                    받는 사람 <small>(선택 {items.length} 명)</small>
                </h3>
                {items.length > 0 && (
                    <button className="gs-link" onClick={() => setItems(() => [])}>
                        전체 제외
                    </button>
                )}
            </div>

            <div className="gs-add-row">
                {platform !== 'other' && (
                    <button className="gs-add" onClick={pickContacts}>
                        + 연락처 불러오기
                    </button>
                )}
                <button className={`gs-add ${directOpen ? 'on' : ''}`} onClick={() => setDirectOpen((v) => !v)}>
                    + 직접 입력
                </button>
                <button className="gs-add" onClick={() => openList('condolence')}>
                    + 조의금 목록
                </button>
                <button className="gs-add" onClick={() => openList('flower')}>
                    + 화환 목록
                </button>
                <button className="gs-add" onClick={() => fileRef.current?.click()}>
                    + 엑셀 업로드
                </button>
                <input ref={fileRef} type="file" accept=".xlsx" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </div>

            {directOpen && (
                <div className="gs-direct">
                    <input value={dName} onChange={(e) => setDName(e.target.value)} placeholder="이름 (선택)" maxLength={20} aria-label="받는 사람 이름" />
                    <input
                        value={dPhone}
                        onChange={(e) => setDPhone(e.target.value)}
                        placeholder="휴대폰 번호"
                        inputMode="tel"
                        maxLength={13}
                        aria-label="받는 사람 휴대폰 번호"
                        onKeyDown={(e) => e.key === 'Enter' && addDirect()}
                    />
                    <button className="gs-btn-dark" onClick={addDirect}>
                        추가
                    </button>
                </div>
            )}

            {items.length === 0 && (
                <div className="gs-recv-empty">
                    <strong>아직 받는 분이 없어요</strong>
                    <p>위에서 추가 방법을 골라주세요. 조의금·화환 목록은 상주 확인 후 불러올 수 있어요.</p>
                    <ul>
                        <li>한 번에 최대 {MAX_RECIPIENTS}명까지 보낼 수 있어요.</li>
                        <li>같은 번호는 자동으로 한 번만 담겨요.</li>
                        <li>
                            엑셀은 <b>이름, 휴대폰번호</b> 두 열로 작성해주세요.{' '}
                            <a href="/samples/gift-recipients-sample.xlsx" download>
                                엑셀 양식 받기
                            </a>
                        </li>
                    </ul>
                </div>
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
                                    openInChrome();
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
                <div className="gs-overlay gs-sheet-wrap" onClick={() => setListOpen(null)}>
                    <div className="gs-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="gs-row-between">
                            <h3 className="gs-h3">{listOpen === 'condolence' ? '조의금 낸 분' : '화환 보낸 분'}</h3>
                            <button className="gs-icon-btn" onClick={() => setListOpen(null)} aria-label="닫기">
                                ✕
                            </button>
                        </div>
                        {listLoading ? (
                            <p className="gs-empty">불러오는 중…</p>
                        ) : candidates.length === 0 ? (
                            <p className="gs-empty">{listOpen === 'condolence' ? '조의금' : '화환'} 내역이 없습니다.</p>
                        ) : (
                            <>
                                <label className="gs-check-all">
                                    <input
                                        type="checkbox"
                                        checked={selectable.length > 0 && selectable.every((c) => checked.has(c.ref))}
                                        onChange={(e) => setChecked(e.target.checked ? new Set(selectable.map((c) => c.ref)) : new Set())}
                                    />
                                    전체 선택 ({selectable.length}명)
                                </label>
                                <ul className="gs-cand">
                                    {candidates.map((c) => (
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
                                                <div className="gs-rec-main">
                                                    <strong>{c.name || '이름 없음'}</strong>
                                                    <span>
                                                        {c.maskedPhone} · {c.summary}
                                                    </span>
                                                </div>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        <button className="gs-cta" disabled={checked.size === 0} onClick={confirmList}>
                            {checked.size}명 추가
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
