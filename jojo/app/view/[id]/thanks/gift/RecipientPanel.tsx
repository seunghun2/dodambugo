'use client';

import { useEffect, useRef, useState } from 'react';
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
    const pickContacts = async () => {
        if (!('contacts' in navigator) || !('ContactsManager' in window)) {
            notify('이 브라우저는 연락처 불러오기를 지원하지 않습니다. 안드로이드 크롬에서 쓰거나, 엑셀 업로드·직접 입력을 이용해주세요.');
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
            // 사용자가 선택 창을 닫은 경우(AbortError)는 안내하지 않는다
            if ((e as { name?: string })?.name !== 'AbortError') notify('연락처를 불러오지 못했습니다.');
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
                <button className="gs-add" onClick={pickContacts}>
                    + 연락처
                </button>
                <button className="gs-add" onClick={() => fileRef.current?.click()}>
                    + 엑셀 업로드
                </button>
                <button className={`gs-add ${directOpen ? 'on' : ''}`} onClick={() => setDirectOpen((v) => !v)}>
                    + 직접 입력
                </button>
                <button className="gs-add" onClick={() => openList('condolence')}>
                    + 조의금 목록
                </button>
                <button className="gs-add" onClick={() => openList('flower')}>
                    + 화환 목록
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
            <p className="gs-hint">엑셀은 이름, 휴대폰번호 두 열로 작성해주세요. 중복 번호는 자동으로 제외됩니다.</p>

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
