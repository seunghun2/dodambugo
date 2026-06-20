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
  { value: '', label: '선택' },
  { value: '남', label: '남' },
  { value: '여', label: '여' },
];

const RELIGIONS = [
  { value: '', label: '없음' },
  { value: '불교', label: '불교' },
  { value: '기독교', label: '기독교' },
  { value: '천주교', label: '천주교' },
  { value: '무교', label: '무교' },
  { value: '기타', label: '기타' },
];

function getReligiousTitleLabel(religion: string): string {
  switch (religion) {
    case '불교':
      return '법명/호칭';
    case '기독교':
      return '직분';
    case '천주교':
      return '세례명';
    default:
      return '호칭';
  }
}

export default function DeceasedSection({ formData, onChange, onOpenAiCapture }: Props) {
  const hasReligion = formData.religion !== '' && formData.religion !== '무교';

  const handleAgeChange = (value: string) => {
    // 숫자만, 최대 3자리
    const cleaned = value.replace(/\D/g, '').slice(0, 3);
    onChange('age', cleaned);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>고인 정보</h2>
        <button
          type="button"
          className={styles.aiBtn}
          onClick={onOpenAiCapture}
        >
          <IconCamera size={16} />
          AI 빈소 정보 촬영
        </button>
      </div>

      {/* 고인명 (필수) */}
      <div className={styles.field}>
        <label className={`${styles.label} ${styles.required}`}>고인명</label>
        <input
          type="text"
          className={styles.input}
          placeholder="고인의 성함을 입력해주세요"
          value={formData.deceased_name}
          onChange={(e) => onChange('deceased_name', e.target.value)}
        />
      </div>

      {/* 고인 나이 */}
      <div className={styles.field}>
        <label className={styles.label}>고인 나이</label>
        <div className={styles.inputWithUnit}>
          <input
            type="text"
            inputMode="numeric"
            className={styles.input}
            placeholder="나이"
            value={formData.age}
            onChange={(e) => handleAgeChange(e.target.value)}
          />
          <span className={styles.unit}>세</span>
        </div>
      </div>

      {/* 성별 + 미노출 체크 */}
      <div className={styles.field}>
        <label className={styles.label}>성별</label>
        <div className={styles.row}>
          <div className={styles.fieldFlex1}>
            <select
              className={styles.select}
              value={formData.gender}
              onChange={(e) => onChange('gender', e.target.value)}
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.hide_gender}
              onChange={(e) => onChange('hide_gender', e.target.checked)}
            />
            부고장 성별 미노출
          </label>
        </div>
      </div>

      {/* 종교 */}
      <div className={styles.field}>
        <label className={styles.label}>종교</label>
        <select
          className={styles.select}
          value={formData.religion}
          onChange={(e) => onChange('religion', e.target.value)}
        >
          {RELIGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* 기타 종교 직접 입력 */}
      {formData.religion === '기타' && (
        <div className={styles.field}>
          <label className={styles.label}>종교 직접 입력</label>
          <input
            type="text"
            className={styles.input}
            placeholder="종교명을 입력해주세요"
            value={formData.religion_custom}
            onChange={(e) => onChange('religion_custom', e.target.value)}
          />
        </div>
      )}

      {/* 종교 선택 시: 직분/세례명/호칭 + 노출 체크 */}
      {hasReligion && (
        <div className={styles.field}>
          <label className={styles.label}>
            {getReligiousTitleLabel(formData.religion)}
          </label>
          <div className={styles.row}>
            <div className={styles.fieldFlex1}>
              <input
                type="text"
                className={styles.input}
                placeholder={`${getReligiousTitleLabel(formData.religion)}을 입력해주세요`}
                value={formData.religious_title}
                onChange={(e) => onChange('religious_title', e.target.value)}
              />
            </div>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.show_religious_title}
                onChange={(e) => onChange('show_religious_title', e.target.checked)}
              />
              부고장 호칭 노출
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
