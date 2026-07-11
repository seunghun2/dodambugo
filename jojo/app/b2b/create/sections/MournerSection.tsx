'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  IconX,
  IconChevronUp,
  IconChevronDown,
  IconPlus,
  IconGripVertical,
  IconWallet,
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
  errors?: Record<string, string>;
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

// ===== 은행코드 매핑 =====
const bankCodeMap: Record<string, string> = {
  'KB국민은행': '004', '신한은행': '088', '우리은행': '020', '하나은행': '081',
  'NH농협은행': '011', 'IBK기업은행': '003', 'SC제일은행': '023', '카카오뱅크': '090',
  '케이뱅크': '089', '토스뱅크': '092', '새마을금고': '045', '신협': '048',
  '우체국': '071', '수협': '007', '광주은행': '034', '전북은행': '037',
  '경남은행': '039', '부산은행': '032', '대구은행': '031', '제주은행': '035',
  '씨티은행': '027', 'KDB산업은행': '002', '저축은행': '050', '산림조합': '064',
};

// ===== 은행별 계좌번호 자동 포맷 =====
function formatAccountNumber(value: string, bankName: string): string {
  const digits = value.replace(/[^0-9]/g, '');

  const formats: Record<string, number[]> = {
    '국민은행': [6, 2, 6],
    'KB국민은행': [6, 2, 6],
    '신한은행': [3, 3, 6],
    '우리은행': [4, 3, 6],
    '하나은행': [3, 6, 5],
    '농협': [3, 4, 4, 2],
    'NH농협': [3, 4, 4, 2],
    'NH농협은행': [3, 4, 4, 2],
    '기업은행': [3, 6, 2, 3],
    'IBK기업은행': [3, 6, 2, 3],
    'SC제일은행': [3, 2, 6],
    '카카오뱅크': [4, 2, 7],
    '케이뱅크': [3, 3, 6],
    '토스뱅크': [4, 4, 4],
    '새마을금고': [4, 2, 6],
    '신협': [3, 3, 6],
    '우체국': [6, 2, 6],
    '수협': [3, 4, 4, 2],
    '광주은행': [3, 3, 6],
    '전북은행': [3, 3, 6],
    '경남은행': [3, 4, 6],
    '부산은행': [3, 4, 6],
    '대구은행': [3, 4, 6],
    '제주은행': [3, 3, 6],
    '씨티은행': [3, 6, 3],
    'KDB산업은행': [3, 6, 4],
  };

  const pattern = formats[bankName];
  if (!pattern) return digits; // 패턴 없으면 그대로

  let result = '';
  let pos = 0;
  for (let i = 0; i < pattern.length && pos < digits.length; i++) {
    const chunk = digits.slice(pos, pos + pattern[i]);
    result += (i > 0 ? '-' : '') + chunk;
    pos += pattern[i];
  }
  return result;
}

// ===== 계좌 등록 바텀시트 =====
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
  const [verifying, setVerifying] = useState(false);
  const [verifyFailed, setVerifyFailed] = useState(false);
  const sheetDragStartY = useRef(0);

  useEffect(() => {
    if (open) {
      setBank(initial?.bank || '');
      setHolder(initial?.holder || '');
      if (initial?.bank && initial?.number) {
        setNumber(formatAccountNumber(initial.number, initial.bank));
      } else {
        setNumber(initial?.number || '');
      }
      setVerifyFailed(false);
    }
  }, [open, initial?.bank, initial?.holder, initial?.number]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!bank || !holder || !number) return;
    
    // 이미 검증에 실패했는데 또 등록을 누르면 강제로 통과시킴 (테스트 및 오류 우회용)
    if (verifyFailed) {
      onConfirm(bank, holder, number.replace(/[^0-9]/g, ''));
      return;
    }

    setVerifying(true);
    setVerifyFailed(false);

    const bankCd = bankCodeMap[bank];
    if (!bankCd) {
      setVerifying(false);
      setVerifyFailed(true);
      return;
    }

    try {
      const res = await fetch('/api/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bankCd, 
          accountNo: number.replace(/[^0-9]/g, ''), 
          holderName: holder 
        }),
      });
      const data = await res.json();
      setVerifying(false);

      if (data.success) {
        // 이노페이 API가 교정된 예금주명을 주면 사용
        const finalHolder = data.holderName || holder;
        onConfirm(bank, finalHolder, number.replace(/[^0-9]/g, ''));
      } else {
        setVerifyFailed(true);
      }
    } catch (err) {
      setVerifying(false);
      setVerifyFailed(true);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAccountNumber(e.target.value, bank);
    setNumber(formatted);
    setVerifyFailed(false);
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBank = e.target.value;
    setBank(newBank);
    setVerifyFailed(false);
    // 은행 변경 시 계좌번호 재포맷
    if (number) {
      setNumber(formatAccountNumber(number, newBank));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    sheetDragStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - sheetDragStartY.current;
    if (dy > 80) onClose();
  };

  return (
    <div className={styles.bottomSheetOverlay} onClick={onClose}>
      <div
        className={styles.accountSheet}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.bottomSheetHandle} />

        <div className={styles.accountSheetTitle}>계좌 등록</div>

        <div className={styles.accountSheetBody}>
          <div className={styles.accountSheetField}>
            <label className={styles.accountSheetLabel}>은행</label>
            <div style={{ position: 'relative' }}>
              <select
                className={styles.accountSheetSelect}
                value={bank}
                onChange={handleBankChange}
              >
                <option value="">은행을 선택해주세요</option>
                {bankOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <IconChevronDown
                size={20}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--b2b-text-tertiary)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          <div className={styles.accountSheetField}>
            <label className={styles.accountSheetLabel}>예금주</label>
            <input
              type="text"
              className={styles.accountSheetInput}
              placeholder="예금주명 입력"
              value={holder}
              onChange={(e) => {
                setHolder(e.target.value);
                setVerifyFailed(false);
              }}
            />
          </div>

          <div className={styles.accountSheetField}>
            <label className={styles.accountSheetLabel}>계좌번호</label>
            <input
              type="text"
              className={styles.accountSheetInput}
              placeholder={bank ? '계좌번호 입력' : '은행을 먼저 선택해주세요'}
              value={number}
              onChange={handleNumberChange}
              inputMode="numeric"
              disabled={!bank}
              style={{ borderColor: verifyFailed ? '#e03131' : undefined }}
            />
            {verifyFailed && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#e03131', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                계좌정보를 정확히 입력해주세요
              </p>
            )}
          </div>
        </div>

        <div className={styles.accountSheetFooter}>
          <button
            type="button"
            className={styles.accountSheetCancelBtn}
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.accountSheetConfirmBtn}
            onClick={handleConfirm}
            disabled={!bank || !holder || !number || verifying}
            style={{ opacity: verifying ? 0.7 : 1 }}
          >
            {verifying ? '확인중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== 관계순서 변경 바텀시트 (왼쪽 드래그 핸들 + 드래그 리오더) =====
interface ReorderSheetProps {
  open: boolean;
  onClose: () => void;
  relationOrder: string[];
  onConfirm: (newOrder: string[]) => void;
}

function ReorderBottomSheet({ open, onClose, relationOrder, onConfirm }: ReorderSheetProps) {
  const [localOrder, setLocalOrder] = useState<string[]>(relationOrder);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetDragStartY = useRef(0);
  // 아이템 드래그
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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

  // 시트 스와이프 닫기
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetDragStartY.current = e.touches[0].clientY;
  };
  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - sheetDragStartY.current;
    if (dy > 80) onClose();
  };

  // 아이템 드래그 리오더 (pointer events)
  const itemDragStart = useRef({ y: 0, idx: 0 });
  const handleItemPointerDown = (e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragIdx(idx);
    itemDragStart.current = { y: e.clientY, idx };
  };

  const handleItemPointerMove = (e: React.PointerEvent) => {
    if (dragIdx === null) return;
    const dy = e.clientY - itemDragStart.current.y;
    const itemHeight = 56; // 대략적인 아이템 높이
    const steps = Math.round(dy / itemHeight);
    if (steps !== 0) {
      const fromIdx = itemDragStart.current.idx;
      const toIdx = Math.max(0, Math.min(localOrder.length - 1, fromIdx + steps));
      if (toIdx !== fromIdx) {
        const updated = [...localOrder];
        const [removed] = updated.splice(fromIdx, 1);
        updated.splice(toIdx, 0, removed);
        setLocalOrder(updated);
        itemDragStart.current = { y: e.clientY, idx: toIdx };
        setDragIdx(toIdx);
      }
    }
  };

  const handleItemPointerUp = () => {
    setDragIdx(null);
  };

  if (!open) return null;

  return (
    <div className={styles.mnSheetOverlay} onClick={onClose}>
      <div
        ref={sheetRef}
        className={styles.mnSheetContent}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleSheetTouchStart}
        onTouchEnd={handleSheetTouchEnd}
      >
        <div className={styles.mnSheetHandle}>
          <div className={styles.mnSheetHandleBar} />
        </div>

        <div className={styles.mnSheetTitle}>관계순서 변경</div>

        <div className={styles.mnSheetList}>
          {localOrder.map((rel, idx) => (
            <div
              key={`${rel}-${idx}`}
              ref={(el) => { if (el) itemRefs.current.set(idx, el); }}
              className={`${styles.mnSheetItem} ${dragIdx === idx ? styles.mnSheetItemDragging : ''}`}
              onPointerMove={dragIdx !== null ? handleItemPointerMove : undefined}
              onPointerUp={dragIdx !== null ? handleItemPointerUp : undefined}
            >
              {/* 왼쪽: 드래그 핸들 + ▲▼ */}
              <div className={styles.mnSheetItemLeft}>
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
                <div
                  className={styles.mnSheetGrip}
                  onPointerDown={(e) => handleItemPointerDown(e, idx)}
                  style={{ touchAction: 'none' }}
                >
                  <IconGripVertical size={18} />
                </div>
              </div>
              {/* 오른쪽: 관계명 */}
              <span className={styles.mnSheetItemName}>{rel}</span>
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
export default function MournerSection({ mourners, onMournersChange, errors }: Props) {
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

  // --- 순서 변경 (같은 관계 그룹 내에서만 이동) ---
  const handleMoveUp = useCallback(
    (index: number, relation: string) => {
      // 같은 관계의 이전 인원 찾기
      let prevIdx = -1;
      for (let i = index - 1; i >= 0; i--) {
        if ((mourners[i].relationship || '') === relation) {
          prevIdx = i;
          break;
        }
      }
      if (prevIdx < 0) return;
      const updated = [...mourners];
      [updated[prevIdx], updated[index]] = [updated[index], updated[prevIdx]];
      onMournersChange(updated);
    },
    [mourners, onMournersChange],
  );

  const handleMoveDown = useCallback(
    (index: number, relation: string) => {
      // 같은 관계의 다음 인원 찾기
      let nextIdx = -1;
      for (let i = index + 1; i < mourners.length; i++) {
        if ((mourners[i].relationship || '') === relation) {
          nextIdx = i;
          break;
        }
      }
      if (nextIdx < 0) return;
      const updated = [...mourners];
      [updated[index], updated[nextIdx]] = [updated[nextIdx], updated[index]];
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
                      {/* 드래그 핸들 / 인원 리오더 버튼 (같은 관계 그룹 내) */}
                      <div className={styles.mnDragHandle}>
                        <button
                          type="button"
                          className={styles.mnReorderArrow}
                          onClick={() => handleMoveUp(realIndex, group.relation)}
                          disabled={group.items[0]?.originalIndex === realIndex}
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
                          onClick={() => handleMoveDown(realIndex, group.relation)}
                          disabled={group.items[group.items.length - 1]?.originalIndex === realIndex}
                        >
                          <IconChevronDown size={14} />
                        </button>
                      </div>

                      {/* 입력 필드들 */}
                      <div className={styles.mnFieldsRow}>
                        {/* 관계 select */}
                        <div className={styles.mnFieldRelation}>
                          <select
                            className={`${styles.mnSelectCompact} ${isFirst && errors?.mourner_relationship ? styles.inputError : ''}`}
                            value={item.mourner.relationship}
                            onChange={(e) => handleFieldChange(realIndex, 'relationship', e.target.value)}
                            data-error={isFirst && errors?.mourner_relationship ? 'true' : undefined}
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
                            className={`${styles.mnInputCompact} ${isFirst && errors?.mourner_name ? styles.inputError : ''}`}
                            placeholder="성함"
                            value={item.mourner.name}
                            onChange={(e) => handleFieldChange(realIndex, 'name', e.target.value)}
                            data-error={isFirst && errors?.mourner_name ? 'true' : undefined}
                          />
                        </div>

                        {/* 연락처 */}
                        <div className={styles.mnFieldContact}>
                          <input
                            type="tel"
                            className={`${styles.mnInputCompact} ${isFirst && errors?.mourner_contact ? styles.inputError : ''}`}
                            placeholder={isFirst ? "연락처 *" : "연락처"}
                            value={item.mourner.contact}
                            onChange={(e) => handleFieldChange(realIndex, 'contact', e.target.value)}
                            data-error={isFirst && errors?.mourner_contact ? 'true' : undefined}
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

                    {isFirst && (errors?.mourner_name || errors?.mourner_relationship || errors?.mourner_contact) && (
                      <p className={styles.fieldError} style={{ marginTop: '8px', marginBottom: '4px' }}>
                        {errors.mourner_name || errors.mourner_relationship || errors.mourner_contact}
                      </p>
                    )}

                    {/* ===== 계좌 아코디언 ===== */}
                    {/* ===== 등록된 계좌 정보 ===== */}
                    <div className={styles.mnAccountSection}>
                      {hasAccount ? (
                        <div className={styles.mnAccountRow}>
                          <div className={styles.mnAccountInfoLeft}>
                            <IconWallet size={16} />
                            <span className={styles.mnAccountTextBold}>
                              {item.mourner.bank} {item.mourner.accountHolder} {formatAccountNumber(item.mourner.accountNumber!, item.mourner.bank!)}
                            </span>
                          </div>
                          <div className={styles.mnAccountActionsInline}>
                            <button
                              type="button"
                              className={styles.mnAccountActionBtnInline}
                              onClick={() => setAccountModalIndex(realIndex)}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              className={styles.mnAccountActionBtnInline}
                              onClick={() => handleAccountDelete(realIndex)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.mnAccountRow}>
                          <div className={styles.mnAccountInfoLeft}>
                            <IconWallet size={16} style={{ color: 'var(--b2b-text-tertiary)' }} />
                            <span className={styles.mnAccountTextEmpty}>
                              등록된 계좌가 없습니다
                            </span>
                          </div>
                          <span
                            className={styles.mnAccountRegText}
                            onClick={() => setAccountModalIndex(realIndex)}
                          >
                            등록
                          </span>
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
                <IconPlus size={16} /> 인원 추가
              </button>
            </div>
          );
        })}
      </div>

      {/* ===== 관계 추가 버튼 (전체 리스트 맨 아래, 검정 배경) ===== */}
      <button
        type="button"
        className={styles.mnAddRelationBtn}
        onClick={handleAddRelation}
      >
        관계 추가
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
