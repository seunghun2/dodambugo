'use client';

import React, { useState } from 'react';
import styles from './sections.module.css';

interface DeceasedData {
  deceased_name: string;
  age: string;
  gender: string;
  hide_gender: boolean;
  religion: string;
  religion_custom: string;
  religious_title: string;
  show_religious_title: boolean;
}

interface Props {
  formData: DeceasedData;
  onChange: (field: string, value: string | boolean) => void;
  onOpenAiCapture: () => void;
}

const RELIGIONS = [
  { value: '', label: '종교' },
  { value: '불교', label: '불교' },
  { value: '기독교', label: '기독교' },
  { value: '천주교', label: '천주교' },
  { value: '무교', label: '무교' },
  { value: '기타', label: '기타' },
];

function getReligiousTitlePlaceholder(religion: string): string {
  switch (religion) {
    case '불교': return '법명/호칭';
    case '기독교': return '직분';
    case '천주교': return '세례명';
    default: return '직분/세례명/호칭';
  }
}

// 성별 표시 텍스트
function getGenderDisplay(gender: string, hideGender: boolean): string {
  if (hideGender) return '미노출';
  if (gender === '남') return '남성';
  if (gender === '여') return '여성';
  return '성별';
}

export default function DeceasedSection({ formData, onChange, onOpenAiCapture }: Props) {
  const hasReligion = formData.religion !== '' && formData.religion !== '무교';
  const [showGenderSheet, setShowGenderSheet] = useState(false);

  const handleAgeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 3);
    onChange('age', cleaned);
  };

  const handleGenderSelect = (option: string) => {
    if (option === '미노출') {
      onChange('hide_gender', true);
      onChange('gender', '');
    } else if (option === '남성') {
      onChange('hide_gender', false);
      onChange('gender', '남');
    } else if (option === '여성') {
      onChange('hide_gender', false);
      onChange('gender', '여');
    }
    setShowGenderSheet(false);
  };

  return (
    <section className={styles.section}>
      {/* 헤더: 고인 정보 * + AI 빈소 정보 촬영 */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          고인 정보<span className={styles.requiredMark}>*</span>
        </h2>
        <button type="button" className={styles.aiBtn} onClick={onOpenAiCapture}>
          <span className={styles.aiBadge}>AI</span>
          빈소 정보 촬영
        </button>
      </div>

      {/* 고인명 */}
      <div className={styles.field}>
        <input
          type="text"
          className={styles.input}
          placeholder="고인명"
          value={formData.deceased_name}
          onChange={(e) => onChange('deceased_name', e.target.value)}
        />
      </div>

      {/* 고인나이 + 성별 — 한 줄 50:50 */}
      <div className={styles.row}>
        <div className={styles.fieldFlex1}>
          <div className={styles.inputWithUnit}>
            <input
              type="text"
              inputMode="numeric"
              className={styles.input}
              placeholder="고인나이"
              value={formData.age}
              onChange={(e) => handleAgeChange(e.target.value)}
            />
            <span className={styles.unit}>세</span>
          </div>
        </div>
        <div className={styles.fieldFlex1}>
          {/* 성별 → 바텀시트 트리거 */}
          <button
            type="button"
            className={styles.selectTrigger}
            onClick={() => setShowGenderSheet(true)}
          >
            <span className={formData.gender || formData.hide_gender ? styles.selectTriggerText : styles.selectTriggerPlaceholder}>
              {getGenderDisplay(formData.gender, formData.hide_gender)}
            </span>
            <span className={styles.selectTriggerArrow}>▾</span>
          </button>
        </div>
      </div>

      {/* 구분선 */}
      <div className={styles.divider} />

      {/* 종교 + 직분/세례명/호칭 — 한 줄 50:50 */}
      <div className={styles.row}>
        <div className={styles.fieldFlex1}>
          <select
            className={styles.select}
            value={formData.religion}
            onChange={(e) => onChange('religion', e.target.value)}
          >
            {RELIGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.fieldFlex1}>
          <input
            type="text"
            className={styles.input}
            placeholder={getReligiousTitlePlaceholder(formData.religion)}
            value={formData.religion === '기타' ? formData.religion_custom : formData.religious_title}
            onChange={(e) => {
              if (formData.religion === '기타') {
                onChange('religion_custom', e.target.value);
              } else {
                onChange('religious_title', e.target.value);
              }
            }}
            disabled={!hasReligion && formData.religion !== '기타'}
          />
        </div>
      </div>

      {/* 부고장 호칭 노출 — 종교 선택시 우측 정렬 */}
      {(hasReligion || formData.religion === '기타') && (
        <div className={styles.checkboxRight}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.show_religious_title}
              onChange={(e) => onChange('show_religious_title', e.target.checked)}
            />
            부고장 호칭 노출
          </label>
        </div>
      )}

      {/* 성별 바텀시트 */}
      {showGenderSheet && (
        <div className={styles.bottomSheetOverlay} onClick={() => setShowGenderSheet(false)}>
          <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bottomSheetHandle} />
            <div className={styles.bottomSheetTitle}>성별</div>
            <button
              type="button"
              className={`${styles.bottomSheetOption} ${formData.hide_gender ? styles.bottomSheetOptionActive : ''}`}
              onClick={() => handleGenderSelect('미노출')}
            >
              미노출
            </button>
            <button
              type="button"
              className={`${styles.bottomSheetOption} ${!formData.hide_gender && formData.gender === '남' ? styles.bottomSheetOptionActive : ''}`}
              onClick={() => handleGenderSelect('남성')}
            >
              남성
            </button>
            <button
              type="button"
              className={`${styles.bottomSheetOption} ${!formData.hide_gender && formData.gender === '여' ? styles.bottomSheetOptionActive : ''}`}
              onClick={() => handleGenderSelect('여성')}
            >
              여성
            </button>
            <button
              type="button"
              className={styles.bottomSheetCancel}
              onClick={() => setShowGenderSheet(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
