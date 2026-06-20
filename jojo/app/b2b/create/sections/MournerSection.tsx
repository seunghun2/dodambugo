'use client';

import React, { useState, useCallback } from 'react';
import {
  IconX,
  IconChevronUp,
  IconChevronDown,
  IconUserPlus,
  IconUsers,
  IconPlus,
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
          {/* 은행 선택 */}
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

          {/* 예금주 */}
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

          {/* 계좌번호 */}
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

// ===== 메인 컴포넌트 =====
export default function MournerSection({ mourners, onMournersChange }: Props) {
  const [showReorder, setShowReorder] = useState(false);
  const [accountModalIndex, setAccountModalIndex] = useState<number | null>(null);

  // --- 상주 필드 변경 ---
  const handleFieldChange = useCallback(
    (index: number, field: keyof Mourner, value: string) => {
      const updated = [...mourners];
      updated[index] = { ...updated[index], [field]: value };
      onMournersChange(updated);
    },
    [mourners, onMournersChange],
  );

  // --- 인원 추가 ---
  const handleAddMourner = useCallback(() => {
    onMournersChange([
      ...mourners,
      { relationship: '', name: '', contact: '' },
    ]);
  }, [mourners, onMournersChange]);

  // --- 관계 추가 (그룹 단위) ---
  const handleAddRelationGroup = useCallback(() => {
    onMournersChange([
      ...mourners,
      { relationship: '', name: '', contact: '' },
    ]);
  }, [mourners, onMournersChange]);

  // --- 삭제 ---
  const handleDelete = useCallback(
    (index: number) => {
      if (index === 0) return; // 대표상주 삭제 불가
      const updated = mourners.filter((_, i) => i !== index);
      onMournersChange(updated);
    },
    [mourners, onMournersChange],
  );

  // --- 순서 변경 ---
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
      {/* 헤더 */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>상주 정보</h2>
        <button
          type="button"
          className={`${styles.headerToggleBtn} ${showReorder ? styles.headerToggleBtnActive : ''}`}
          onClick={() => setShowReorder((v) => !v)}
        >
          <IconUsers size={15} />
          관계순서 변경
        </button>
      </div>

      {/* 상주 리스트 */}
      {mourners.map((mourner, index) => {
        const isFirst = index === 0;
        const hasAccount = !!(mourner.bank && mourner.accountNumber);

        return (
          <div key={index} className={styles.mournerCard}>
            {/* 카드 헤더 */}
            <div className={styles.mournerCardHeader}>
              <div className={styles.mournerHeaderLeft}>
                {isFirst ? (
                  <span className={styles.mournerBadge}>대표상주</span>
                ) : (
                  <span className={styles.mournerIndex}>상주 {index + 1}</span>
                )}
              </div>
              <button
                type="button"
                className={`${styles.deleteBtn} ${isFirst ? styles.deleteBtnDisabled : ''}`}
                onClick={() => handleDelete(index)}
                disabled={isFirst}
                title={isFirst ? '대표상주는 삭제할 수 없습니다' : '삭제'}
              >
                <IconX size={16} />
              </button>
            </div>

            {/* 카드 본문 */}
            <div className={styles.mournerCardBody}>
              {/* 리오더 컨트롤 */}
              {showReorder && (
                <div className={styles.reorderControls}>
                  <button
                    type="button"
                    className={styles.reorderBtn}
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="위로 이동"
                  >
                    <IconChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.reorderBtn}
                    onClick={() => handleMoveDown(index)}
                    disabled={index === mourners.length - 1}
                    title="아래로 이동"
                  >
                    <IconChevronDown size={16} />
                  </button>
                </div>
              )}

              {/* 입력 필드 */}
              <div className={styles.mournerCardContent}>
                <div className={styles.mournerFields}>
                  {/* 관계 */}
                  <div className={styles.field}>
                    <label className={styles.label}>관계</label>
                    <select
                      className={styles.select}
                      value={mourner.relationship}
                      onChange={(e) => handleFieldChange(index, 'relationship', e.target.value)}
                    >
                      <option value="">선택</option>
                      {relationshipOptions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* 성함 */}
                  <div className={styles.field}>
                    <label className={styles.label}>성함</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="성함 입력"
                      value={mourner.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                    />
                  </div>

                  {/* 연락처 */}
                  <div className={styles.field}>
                    <label className={styles.label}>연락처</label>
                    <input
                      type="tel"
                      className={styles.input}
                      placeholder="010-0000-0000"
                      value={mourner.contact}
                      onChange={(e) => handleFieldChange(index, 'contact', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 계좌 영역 */}
            <div className={styles.accountArea}>
              <div className={styles.accountRow}>
                {hasAccount ? (
                  <>
                    <span className={styles.accountRegistered}>
                      {mourner.bank} {mourner.accountHolder} {mourner.accountNumber}
                    </span>
                    <button
                      type="button"
                      className={styles.accountRegBtn}
                      onClick={() => setAccountModalIndex(index)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className={styles.accountDeleteBtn}
                      onClick={() => handleAccountDelete(index)}
                    >
                      삭제
                    </button>
                  </>
                ) : (
                  <>
                    <span className={styles.accountEmpty}>
                      <span>▽</span> 등록된 계좌가 없습니다
                    </span>
                    <button
                      type="button"
                      className={styles.accountRegBtn}
                      onClick={() => setAccountModalIndex(index)}
                    >
                      등록
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 하단 버튼 */}
      <div className={styles.addBtnRow}>
        <button type="button" className={styles.addBtn} onClick={handleAddMourner}>
          <IconPlus size={18} />
          인원 추가
        </button>
        <button type="button" className={styles.addBtn} onClick={handleAddRelationGroup}>
          <IconUserPlus size={18} />
          관계 추가
        </button>
      </div>

      {/* 계좌 등록 모달 */}
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
