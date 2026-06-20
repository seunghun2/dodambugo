'use client';

import React from 'react';
import { IconCamera } from '@tabler/icons-react';
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

const GENDERS = [
  { value: '', label: '성별' },
  { value: '남', label: '남' },
  { value: '여', label: '여' },
];

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

export default function DeceasedSection({ formData, onChange, onOpenAiCapture }: Props) {
  const hasReligion = formData.religion !== '' && formData.religion !== '무교';

  const handleAgeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 3);
    onChange('age', cleaned);
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

      {/* 고인명 — label 없이 placeholder만 */}
      <div className={styles.field}>
        <input
          type="text"
          className={styles.input}
          placeholder="고인명"
          value={formData.deceased_name}
          onChange={(e) => onChange('deceased_name', e.target.value)}
        />
      </div>

      {/* 고인나이 + 성별 — 한 줄 */}
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
          <select
            className={styles.select}
            value={formData.gender}
            onChange={(e) => onChange('gender', e.target.value)}
          >
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 부고장 성별 미노출 — 우측 정렬 */}
      <div className={styles.checkboxRight}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={formData.hide_gender}
            onChange={(e) => onChange('hide_gender', e.target.checked)}
          />
          부고장 성별 미노출
        </label>
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
    </section>
  );
}
