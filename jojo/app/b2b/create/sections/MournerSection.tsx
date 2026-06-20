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

// ===== 관계 추가 모달 =====
interface RelationModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (rel: string) => void;
  existingRelations: string[];
}

function RelationModal({ open, onClose, onSelect, existingRelations }: RelationModalProps) {
  if (!open) return null;

  const available = relationshipOptions.filter((r) => !existingRelations.includes(r));

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>관계 추가</span>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className={styles.mnRelModalBody}>
          {available.length === 0 ? (
            <p className={styles.mnRelModalEmpty}>추가 가능한 관계가 없습니다</p>
          ) : (
            available.map((rel) => (
              <button
                key={rel}
                type="button"
                className={styles.mnRelModalItem}
                onClick={() => {
                  onSelect(rel);
                  onClose();
                }}
              >
                {rel}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 메인 컴포넌트 =====
export default function MournerSection({ mourners, onMournersChange }: Props) {
  const [reorderMode, setReorderMode] = useState(false);
  const [accountModalIndex, setAccountModalIndex] = useState<number | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const dragClone = useRef<HTMLDivElement | null>(null);

  // --- 관계별 그룹핑 ---
  const relationGroups = mourners.reduce<Record<string, number>>((acc, m) => {
    const rel = m.relationship || '미지정';
    acc[rel] = (acc[rel] || 0) + 1;
    return acc;
  }, {});

  const existingRelations = Object.keys(relationGroups).filter((r) => r !== '미지정');

  // --- 필터된 상주 목록 ---
  const filteredMourners = activeTab
    ? mourners
        .map((m, i) => ({ ...m, originalIndex: i }))
        .filter((m) => (m.relationship || '미지정') === activeTab)
    : mourners.map((m, i) => ({ ...m, originalIndex: i }));

  // --- 상주 필드 변경 ---
  const handleFieldChange = useCallback(
    (index: number, field: keyof Mourner, value: string) => {
      const updated = [...mourners];
      updated[index] = { ...updated[index], [field]: value };
      onMournersChange(updated);
    },
    [mourners, onMournersChange],
  );

  // --- 인원 추가 (같은 관계) ---
  const handleAddPerson = useCallback(() => {
    const rel = activeTab && activeTab !== '미지정' ? activeTab : '';
    onMournersChange([
      ...mourners,
      { relationship: rel, name: '', contact: '' },
    ]);
  }, [mourners, onMournersChange, activeTab]);

  // --- 관계 추가 ---
  const handleAddRelation = useCallback(
    (rel: string) => {
      onMournersChange([
        ...mourners,
        { relationship: rel, name: '', contact: '' },
      ]);
      setActiveTab(rel);
    },
    [mourners, onMournersChange],
  );

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
      if (!reorderMode) return;
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
    [reorderMode],
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
        const mid = r.top + r.height / 2;
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

  return (
    <section className={styles.section}>
      {/* ===== 헤더 ===== */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>상주정보</h2>
        <button
          type="button"
          className={`${styles.mnReorderPill} ${reorderMode ? styles.mnReorderPillActive : ''}`}
          onClick={() => setReorderMode((v) => !v)}
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

      {/* ===== 상주 카드 리스트 ===== */}
      <div className={styles.mnCardList}>
        {filteredMourners.map((mourner, idx) => {
          const realIndex = mourner.originalIndex;
          const isFirst = realIndex === 0;
          const hasAccount = !!(mourner.bank && mourner.accountNumber);
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
                {reorderMode && (
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
                )}

                {/* 입력 필드들 */}
                <div className={styles.mnFieldsRow}>
                  {/* 관계 select */}
                  <div className={styles.mnFieldRelation}>
                    <select
                      className={styles.mnSelectCompact}
                      value={mourner.relationship}
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
                      value={mourner.name}
                      onChange={(e) => handleFieldChange(realIndex, 'name', e.target.value)}
                    />
                  </div>

                  {/* 연락처 */}
                  <div className={styles.mnFieldContact}>
                    <input
                      type="tel"
                      className={styles.mnInputCompact}
                      placeholder="연락처"
                      value={mourner.contact}
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
                      ? `${mourner.bank} ${mourner.accountNumber}`
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
                      <span>{mourner.bank}</span>
                      <span>{mourner.accountHolder}</span>
                      <span>{mourner.accountNumber}</span>
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
      </div>

      {/* ===== 하단 버튼 ===== */}
      <div className={styles.mnBottomBtns}>
        <button
          type="button"
          className={styles.mnAddPersonBtn}
          onClick={handleAddPerson}
        >
          <IconPlus size={16} />
          인원 추가
        </button>
        <button
          type="button"
          className={styles.mnAddRelationBtn}
          onClick={() => setShowRelationModal(true)}
        >
          <IconPlus size={16} />
          관계 추가
        </button>
      </div>

      {/* ===== 관계 추가 모달 ===== */}
      <RelationModal
        open={showRelationModal}
        onClose={() => setShowRelationModal(false)}
        onSelect={handleAddRelation}
        existingRelations={existingRelations}
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
    </section>
  );
}
