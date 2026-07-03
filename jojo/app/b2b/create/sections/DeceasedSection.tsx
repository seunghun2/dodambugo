'use client';

import React, { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
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
  errors?: Record<string, string>;
}

const RELIGIONS = [
  { value: '없음', label: '없음' },
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

// 종교 표시 텍스트
function getReligionDisplay(religion: string): string {
  if (!religion || religion === '없음') return '종교';
  const found = RELIGIONS.find(r => r.value === religion);
  return found ? found.label : religion;
}

// 성별 표시 텍스트
function getGenderDisplay(gender: string, hideGender: boolean): string {
  if (hideGender) return '미노출';
  if (gender === '남') return '남성';
  if (gender === '여') return '여성';
  return '성별';
}

export default function DeceasedSection({ formData, onChange, errors }: Props) {
  const hasReligion = formData.religion !== '' && formData.religion !== '없음' && formData.religion !== '무교';
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [showReligionSheet, setShowReligionSheet] = useState(false);

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
      {/* 헤더: 고인 정보 * */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          고인 정보<span className={styles.requiredMark}>*</span>
        </h2>
      </div>

      {/* 고인명 */}
      <div className={styles.field}>
        <input
          type="text"
          className={`${styles.input} ${errors?.deceased_name ? styles.inputError : ''}`}
          placeholder="고인명"
          value={formData.deceased_name}
          onChange={(e) => onChange('deceased_name', e.target.value)}
          data-error={errors?.deceased_name ? 'true' : undefined}
        />
        {errors?.deceased_name && (
          <p className={styles.fieldError}>{errors.deceased_name}</p>
        )}
      </div>

      {/* 고인나이 + 성별 — 한 줄 50:50 */}
      <div className={styles.row}>
        <div className={styles.fieldFlex1}>
          <div className={`${styles.inputWithUnit} ${errors?.age ? styles.inputError : ''}`} data-error={errors?.age ? 'true' : undefined}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={styles.input}
              placeholder="고인나이"
              value={formData.age}
              onChange={(e) => handleAgeChange(e.target.value)}
            />
            <span className={styles.unit}>세</span>
          </div>
          {errors?.age && (
            <p className={styles.fieldError}>{errors.age}</p>
          )}
        </div>
        <div className={styles.fieldFlex1}>
          {/* 성별 → 바텀시트 트리거 */}
          <button
            type="button"
            className={`${styles.selectTrigger} ${errors?.gender ? styles.inputError : ''}`}
            onClick={() => setShowGenderSheet(true)}
            data-error={errors?.gender ? 'true' : undefined}
          >
            <span className={formData.gender || formData.hide_gender ? styles.selectTriggerText : styles.selectTriggerPlaceholder}>
              {getGenderDisplay(formData.gender, formData.hide_gender)}
            </span>
            <IconChevronDown size={18} stroke={3} className={styles.selectTriggerArrow} />
          </button>
          {errors?.gender && (
            <p className={styles.fieldError}>{errors.gender}</p>
          )}
        </div>
      </div>

      {/* 구분선 */}
      <div className={styles.divider} />

      {/* 종교 + 직분/세례명/호칭 — 한 줄 50:50 */}
      <div className={styles.row}>
        <div className={styles.fieldFlex1}>
          <button
            type="button"
            className={styles.selectTrigger}
            onClick={() => setShowReligionSheet(true)}
          >
            <span className={formData.religion ? styles.selectTriggerText : styles.selectTriggerPlaceholder}>
              {getReligionDisplay(formData.religion)}
            </span>
            <IconChevronDown size={18} stroke={3} className={styles.selectTriggerArrow} />
          </button>
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

      {/* 종교 바텀시트 */}
      {showReligionSheet && (
        <div className={styles.bottomSheetOverlay} onClick={() => setShowReligionSheet(false)}>
          <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bottomSheetHandle} />
            <div className={styles.bottomSheetTitle}>종교</div>
            {RELIGIONS.filter(r => r.value !== '').map((r) => (
              <button
                key={r.value}
                type="button"
                className={`${styles.bottomSheetOption} ${formData.religion === r.value ? styles.bottomSheetOptionActive : ''}`}
                onClick={() => { onChange('religion', r.value); setShowReligionSheet(false); }}
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              className={styles.bottomSheetCancel}
              onClick={() => setShowReligionSheet(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
