'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  IconX,
  IconChevronUp,
  IconChevronDown,
  IconPlus,
  IconGripVertical,
} from '@tabler/icons-react';
import styles from './sections.module.css';

// ===== 타입 =====
interface Mourner {
  relationship: string;
  name: string;
  contact: string;
  bank?: string;
  accountHolder?: string;
  accountNumber?: string;
}

interface Props {
  mourners: Mourner[];
  onMournersChange: (mourners: Mourner[]) => void;
}

// ===== 상수 =====
const relationshipOptions = [
  '배우자', '아들', '딸', '며느리', '사위',
  '손', '손자', '손녀', '외손', '외손자', '외손녀', '증손',
  '부친', '모친', '형', '오빠', '누나', '언니', '동생',
  '형수', '제수', '매형', '자제',
];

const bankOptions = [
  'KB국민은행', '신한은행', '우리은행', '하나은행', 'NH농협은행',
  'IBK기업은행', 'SC제일은행', '카카오뱅크', '케이뱅크', '토스뱅크',
  '새마을금고', '신협', '우체국', '수협', '광주은행', '전북은행',
  '경남은행', '부산은행', '대구은행', '제주은행', '씨티은행',
  'KDB산업은행', '저축은행', '산림조합',
];

// ===== 토스트 컴포넌트 =====
function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className={styles.mnToast}>
      {message}
    </div>
  );
}

// ===== 계좌 등록 모달 =====
interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (bank: string, holder: string, number: string) => void;
  initial?: { bank?: string; holder?: string; number?: string };
}

function AccountModal({ open, onClose, onConfirm, initial }: AccountModalProps) {
  const [bank, setBank] = useState(initial?.bank || '');
  const [holder, setHolder] = useState(initial?.holder || '');
  const [number, setNumber] = useState(initial?.number || '');

  useEffect(() => {
    if (open) {
      setBank(initial?.bank || '');
      setHolder(initial?.holder || '');
      setNumber(initial?.number || '');
    }
  }, [open, initial?.bank, initial?.holder, initial?.number]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!bank || !holder || !number) return;
    onConfirm(bank, holder, number);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>계좌 등록</span>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label className={styles.label}>은행</label>
            <select
              className={styles.select}
              value={bank}
              onChange={(e) => setBank(e.target.value)}
            >
              <option value="">은행을 선택해주세요</option>
              {bankOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>예금주</label>
            <input
              type="text"
              className={styles.input}
              placeholder="예금주명 입력"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>계좌번호</label>
            <input
              type="text"
              className={styles.input}
              placeholder="계좌번호 입력 (- 없이)"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className={`${styles.modalBtn} ${styles.modalBtnConfirm}`}
            onClick={handleConfirm}
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== 관계순서 변경 바텀시트 =====
interface ReorderSheetProps {
  open: boolean;
  onClose: () => void;
  relationOrder: string[];
  onConfirm: (newOrder: string[]) => void;
}

function ReorderBottomSheet({ open, onClose, relationOrder, onConfirm }: ReorderSheetProps) {
  const [localOrder, setLocalOrder] = useState<string[]>(relationOrder);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);

  useEffect(() => {
    if (open) {
      setLocalOrder(relationOrder);
    }
  }, [open, relationOrder]);

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return;
    const updated = [...localOrder];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    setLocalOrder(updated);
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= localOrder.length - 1) return;
    const updated = [...localOrder];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    setLocalOrder(updated);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - dragStartY.current;
    if (dy > 80) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className={styles.mnSheetOverlay} onClick={onClose}>
      <div
        ref={sheetRef}
        className={styles.mnSheetContent}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 드래그 핸들 바 */}
        <div className={styles.mnSheetHandle}>
          <div className={styles.mnSheetHandleBar} />
        </div>

        <div className={styles.mnSheetTitle}>관계순서 변경</div>

        <div className={styles.mnSheetList}>
          {localOrder.map((rel, idx) => (
            <div key={rel} className={styles.mnSheetItem}>
              <span className={styles.mnSheetItemName}>{rel}</span>
              <div className={styles.mnSheetItemBtns}>
                <button
                  type="button"
                  className={styles.mnSheetArrow}
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className={styles.mnSheetArrow}
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === localOrder.length - 1}
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.mnSheetFooter}>
          <button
            type="button"
            className={styles.mnSheetConfirmBtn}
            onClick={() => {
              onConfirm(localOrder);
              onClose();
            }}
          >
            수정하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== 메인 컴포넌트 =====
export default function MournerSection({ mourners, onMournersChange }: Props) {
  const [accountModalIndex, setAccountModalIndex] = useState<number | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showReorderSheet, setShowReorderSheet] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const dragClone = useRef<HTMLDivElement | null>(null);

  // --- 토스트 표시 ---
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  // --- 관계별 그룹핑 (순서 유지) ---
  const getRelationOrder = useCallback((): string[] => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const m of mourners) {
      const rel = m.relationship || '';
      if (!seen.has(rel)) {
        seen.add(rel);
        order.push(rel);
      }
    }
    return order;
  }, [mourners]);

  const relationOrder = getRelationOrder();

  const relationGroups = mourners.reduce<Record<string, number>>((acc, m) => {
    const rel = m.relationship || '미지정';
    acc[rel] = (acc[rel] || 0) + 1;
    return acc;
  }, {});

  // --- 관계별 상주 그룹 (원본 인덱스 유지) ---
  const getGroupedMourners = useCallback(() => {
    const groups: { relation: string; items: { mourner: Mourner; originalIndex: number }[] }[] = [];
    const groupMap = new Map<string, { mourner: Mourner; originalIndex: number }[]>();

    for (let i = 0; i < mourners.length; i++) {
      const rel = mourners[i].relationship || '';
      if (!groupMap.has(rel)) {
        groupMap.set(rel, []);
      }
      groupMap.get(rel)!.push({ mourner: mourners[i], originalIndex: i });
    }

    // 관계 순서대로 그룹 생성
    for (const rel of relationOrder) {
      const items = groupMap.get(rel);
      if (items && items.length > 0) {
        groups.push({ relation: rel, items });
      }
    }

    return groups;
  }, [mourners, relationOrder]);

  const groupedMourners = getGroupedMourners();

  // --- 필터된 그룹 목록 ---
  const displayGroups = activeTab
    ? groupedMourners.filter((g) => {
        const tabKey = activeTab === '미지정' ? '' : activeTab;
        return g.relation === tabKey;
      })
    : groupedMourners;

  // --- 상주 필드 변경 ---
  const handleFieldChange = useCallback(
    (index: number, field: keyof Mourner, value: string) => {
      const updated = [...mourners];
      updated[index] = { ...updated[index], [field]: value };
      onMournersChange(updated);
    },
    [mourners, onMournersChange],
  );

  // --- 인원 추가 (같은 관계 그룹에) ---
  const handleAddPerson = useCallback(
    (relation: string) => {
      if (relation === '') {
        showToast('관계를 설정해주세요');
        return;
      }
      onMournersChange([
        ...mourners,
        { relationship: relation, name: '', contact: '' },
      ]);
    },
    [mourners, onMournersChange, showToast],
  );

  // --- 관계 추가 (관계 미지정 새 상주 추가) ---
  const handleAddRelation = useCallback(() => {
    onMournersChange([
      ...mourners,
      { relationship: '', name: '', contact: '' },
    ]);
  }, [mourners, onMournersChange]);

  // --- 삭제 ---
  const handleDelete = useCallback(
    (index: number) => {
      if (index === 0) return;
      const updated = mourners.filter((_, i) => i !== index);
      onMournersChange(updated);
    },
    [mourners, onMournersChange],
  );

  // --- 순서 변경 (버튼) ---
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const updated = [...mourners];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      onMournersChange(updated);
    },
    [mourners, onMournersChange],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= mourners.length - 1) return;
      const updated = [...mourners];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      onMournersChange(updated);
    },
    [mourners, onMournersChange],
  );

  // --- 드래그 리오더 (pointer events) ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setDragIndex(index);
      dragStartY.current = e.clientY;
      dragCurrentY.current = e.clientY;

      const el = cardRefs.current.get(index);
      if (el) {
        const clone = el.cloneNode(true) as HTMLDivElement;
        const rect = el.getBoundingClientRect();
        clone.style.position = 'fixed';
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.zIndex = '9999';
        clone.style.opacity = '0.9';
        clone.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        clone.style.pointerEvents = 'none';
        clone.style.transition = 'none';
        document.body.appendChild(clone);
        dragClone.current = clone;
        el.style.opacity = '0.3';
      }
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragIndex === null || !dragClone.current) return;
      e.preventDefault();
      dragCurrentY.current = e.clientY;
      const dy = dragCurrentY.current - dragStartY.current;

      const el = cardRefs.current.get(dragIndex);
      if (el && dragClone.current) {
        const rect = el.getBoundingClientRect();
        dragClone.current.style.top = `${rect.top + dy}px`;
      }

      // Determine drag over target
      let overIdx: number | null = null;
      cardRefs.current.forEach((cardEl, idx) => {
        if (idx === dragIndex) return;
        const r = cardEl.getBoundingClientRect();
        if (e.clientY > r.top && e.clientY < r.bottom) {
          overIdx = idx;
        }
      });
      setDragOverIndex(overIdx);
    },
    [dragIndex],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragIndex === null) return;

      // Cleanup clone
      if (dragClone.current) {
        document.body.removeChild(dragClone.current);
        dragClone.current = null;
      }

      // Restore opacity
      const el = cardRefs.current.get(dragIndex);
      if (el) el.style.opacity = '1';

      // Perform swap
      if (dragOverIndex !== null && dragOverIndex !== dragIndex) {
        const updated = [...mourners];
        const [removed] = updated.splice(dragIndex, 1);
        updated.splice(dragOverIndex, 0, removed);
        onMournersChange(updated);
      }

      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, dragOverIndex, mourners, onMournersChange],
  );

  // --- 계좌 아코디언 토글 ---
  const toggleAccount = useCallback((index: number) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // --- 계좌 등록/삭제 ---
  const handleAccountConfirm = useCallback(
    (bank: string, holder: string, number: string) => {
      if (accountModalIndex === null) return;
      const updated = [...mourners];
      updated[accountModalIndex] = {
        ...updated[accountModalIndex],
        bank,
        accountHolder: holder,
        accountNumber: number,
      };
      onMournersChange(updated);
      setAccountModalIndex(null);
    },
    [mourners, onMournersChange, accountModalIndex],
  );

  const handleAccountDelete = useCallback(
    (index: number) => {
      const updated = [...mourners];
      updated[index] = {
        ...updated[index],
        bank: undefined,
        accountHolder: undefined,
        accountNumber: undefined,
      };
      onMournersChange(updated);
    },
    [mourners, onMournersChange],
  );

  // --- 관계순서 변경 확정 ---
  const handleReorderConfirm = useCallback(
    (newOrder: string[]) => {
      // 기존 관계별 그룹을 새 순서대로 재배열
      const groupMap = new Map<string, Mourner[]>();
      for (const m of mourners) {
        const rel = m.relationship || '';
        if (!groupMap.has(rel)) {
          groupMap.set(rel, []);
        }
        groupMap.get(rel)!.push(m);
      }

      const reordered: Mourner[] = [];
      for (const rel of newOrder) {
        const items = groupMap.get(rel);
        if (items) {
          reordered.push(...items);
          groupMap.delete(rel);
        }
      }
      // 혹시 남은 관계 (newOrder에 없는 것들)
      groupMap.forEach((items) => {
        reordered.push(...items);
      });

      onMournersChange(reordered);
    },
    [mourners, onMournersChange],
  );

  // --- 관계 display name ---
  const getRelationDisplayName = (rel: string) => (rel === '' ? '미지정' : rel);

  return (
    <section className={styles.section}>
      {/* ===== 헤더 ===== */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>상주정보</h2>
        <button
          type="button"
          className={styles.mnReorderPill}
          onClick={() => setShowReorderSheet(true)}
        >
          관계순서 변경
        </button>
      </div>

      {/* ===== 관계 탭 뱃지 ===== */}
      {Object.keys(relationGroups).length > 0 && (
        <div className={styles.mnTabRow}>
          <button
            type="button"
            className={`${styles.mnTab} ${activeTab === null ? styles.mnTabActive : ''}`}
            onClick={() => setActiveTab(null)}
          >
            전체 {mourners.length}
          </button>
          {Object.entries(relationGroups).map(([rel, count]) => (
            <button
              key={rel}
              type="button"
              className={`${styles.mnTab} ${activeTab === rel ? styles.mnTabActive : ''}`}
              onClick={() => setActiveTab(rel)}
            >
              {rel} {count}
            </button>
          ))}
        </div>
      )}

      {/* ===== 관계별 그룹 카드 리스트 ===== */}
      <div className={styles.mnCardList}>
        {displayGroups.map((group) => {
          const displayRel = getRelationDisplayName(group.relation);

          return (
            <div key={group.relation} className={styles.mnRelationGroup}>
              {/* 그룹 내 상주 카드들 */}
              {group.items.map((item) => {
                const realIndex = item.originalIndex;
                const isFirst = realIndex === 0;
                const hasAccount = !!(item.mourner.bank && item.mourner.accountNumber);
                const isAccountOpen = expandedAccounts.has(realIndex);
                const isDragOver = dragOverIndex === realIndex;

                return (
                  <div
                    key={realIndex}
                    ref={(el) => {
                      if (el) cardRefs.current.set(realIndex, el);
                    }}
                    className={`${styles.mnCard} ${isDragOver ? styles.mnCardDragOver : ''} ${
                      dragIndex === realIndex ? styles.mnCardDragging : ''
                    }`}
                    onPointerMove={dragIndex !== null ? handlePointerMove : undefined}
                    onPointerUp={dragIndex !== null ? handlePointerUp : undefined}
                  >
                    {/* 대표상주 뱃지 */}
                    {isFirst && (
                      <span className={styles.mnPrimaryBadge}>대표상주</span>
                    )}

                    {/* 카드 본체: 가로 레이아웃 */}
                    <div className={styles.mnCardRow}>
                      {/* 드래그 핸들 / 리오더 버튼 */}
                      <div className={styles.mnDragHandle}>
                        <button
                          type="button"
                          className={styles.mnReorderArrow}
                          onClick={() => handleMoveUp(realIndex)}
                          disabled={realIndex === 0}
                        >
                          <IconChevronUp size={14} />
                        </button>
                        <div
                          className={styles.mnGripArea}
                          onPointerDown={(e) => handlePointerDown(e, realIndex)}
                          style={{ touchAction: 'none' }}
                        >
                          <IconGripVertical size={16} />
                        </div>
                        <button
                          type="button"
                          className={styles.mnReorderArrow}
                          onClick={() => handleMoveDown(realIndex)}
                          disabled={realIndex === mourners.length - 1}
                        >
                          <IconChevronDown size={14} />
                        </button>
                      </div>

                      {/* 입력 필드들 */}
                      <div className={styles.mnFieldsRow}>
                        {/* 관계 select */}
                        <div className={styles.mnFieldRelation}>
                          <select
                            className={styles.mnSelectCompact}
                            value={item.mourner.relationship}
                            onChange={(e) => handleFieldChange(realIndex, 'relationship', e.target.value)}
                          >
                            <option value="">관계</option>
                            {relationshipOptions.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>

                        {/* 성함 */}
                        <div className={styles.mnFieldName}>
                          <input
                            type="text"
                            className={styles.mnInputCompact}
                            placeholder="성함"
                            value={item.mourner.name}
                            onChange={(e) => handleFieldChange(realIndex, 'name', e.target.value)}
                          />
                        </div>

                        {/* 연락처 */}
                        <div className={styles.mnFieldContact}>
                          <input
                            type="tel"
                            className={styles.mnInputCompact}
                            placeholder="연락처"
                            value={item.mourner.contact}
                            onChange={(e) => handleFieldChange(realIndex, 'contact', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        type="button"
                        className={`${styles.mnDeleteBtn} ${isFirst ? styles.mnDeleteBtnDisabled : ''}`}
                        onClick={() => handleDelete(realIndex)}
                        disabled={isFirst}
                      >
                        삭제
                      </button>
                    </div>

                    {/* ===== 계좌 아코디언 ===== */}
                    <div className={styles.mnAccountSection}>
                      <button
                        type="button"
                        className={styles.mnAccountToggle}
                        onClick={() => toggleAccount(realIndex)}
                      >
                        <span className={styles.mnAccountToggleLeft}>
                          <span className={styles.mnAccountChevron}>
                            {isAccountOpen ? '△' : '▽'}
                          </span>
                          {hasAccount
                            ? `${item.mourner.bank} ${item.mourner.accountNumber}`
                            : '등록된 계좌가 없습니다'
                          }
                        </span>
                        {!hasAccount && (
                          <span
                            className={styles.mnAccountRegText}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAccountModalIndex(realIndex);
                            }}
                          >
                            등록
                          </span>
                        )}
                      </button>

                      {isAccountOpen && hasAccount && (
                        <div className={styles.mnAccountDetail}>
                          <div className={styles.mnAccountInfo}>
                            <span>{item.mourner.bank}</span>
                            <span>{item.mourner.accountHolder}</span>
                            <span>{item.mourner.accountNumber}</span>
                          </div>
                          <div className={styles.mnAccountActions}>
                            <button
                              type="button"
                              className={styles.mnAccountActionBtn}
                              onClick={() => setAccountModalIndex(realIndex)}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              className={styles.mnAccountActionBtn}
                              onClick={() => handleAccountDelete(realIndex)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* ===== 인원 추가 버튼 (각 관계 그룹 하단) ===== */}
              <button
                type="button"
                className={styles.mnAddPersonBtn}
                onClick={() => handleAddPerson(group.relation)}
              >
                ➕ 인원 추가
              </button>
            </div>
          );
        })}
      </div>

      {/* ===== 관계 추가 버튼 (전체 리스트 맨 아래) ===== */}
      <button
        type="button"
        className={styles.mnAddRelationBtn}
        onClick={handleAddRelation}
      >
        ➕ 관계 추가
      </button>

      {/* ===== 관계순서 변경 바텀시트 ===== */}
      <ReorderBottomSheet
        open={showReorderSheet}
        onClose={() => setShowReorderSheet(false)}
        relationOrder={relationOrder.filter((r) => r !== '')}
        onConfirm={handleReorderConfirm}
      />

      {/* ===== 계좌 등록 모달 ===== */}
      <AccountModal
        open={accountModalIndex !== null}
        onClose={() => setAccountModalIndex(null)}
        onConfirm={handleAccountConfirm}
        initial={
          accountModalIndex !== null
            ? {
                bank: mourners[accountModalIndex]?.bank,
                holder: mourners[accountModalIndex]?.accountHolder,
                number: mourners[accountModalIndex]?.accountNumber,
              }
            : undefined
        }
      />

      {/* ===== 토스트 ===== */}
      <Toast message={toastMsg} visible={toastVisible} />
    </section>
  );
}
