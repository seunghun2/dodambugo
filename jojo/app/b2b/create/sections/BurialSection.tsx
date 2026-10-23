'use client';

import React, { useState, useEffect } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import styles from './sections.module.css';

interface BurialData {
  burial_place: string;
  burial_place2: string;
}

interface Props {
  formData: BurialData;
  onChange: (field: string, value: string) => void;
}

export default function BurialSection({ formData, onChange }: Props) {
  const [showSecondPlace, setShowSecondPlace] = useState(Boolean(formData.burial_place2));

  // 2차 장지 값이 들어오면(수정 모드 등) 자동으로 2차 장지 필드 활성화
  useEffect(() => {
    if (formData.burial_place2 && !showSecondPlace) {
      setShowSecondPlace(true);
    }
  }, [formData.burial_place2, showSecondPlace]);

  const handleAddSecondPlace = () => {
    setShowSecondPlace(true);
  };

  const handleRemoveSecondPlace = () => {
    setShowSecondPlace(false);
    onChange('burial_place2', '');
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>장지 정보</h2>
        {!showSecondPlace && (
          <button
            type="button"
            className={styles.mnReorderPill}
            onClick={handleAddSecondPlace}
          >
            <IconPlus size={14} /> 2차 장지 추가
          </button>
        )}
      </div>

      {/* 1차 장지 */}
      <div className={styles.field}>
        <label className={styles.label}>
          {showSecondPlace ? '1차 장지' : '장지'}
        </label>
        <input
          type="text"
          className={styles.input}
          placeholder={showSecondPlace ? '1차 장지 (예: 서울추모공원)' : '장지를 입력해주세요 (예: 서울추모공원)'}
          value={formData.burial_place}
          onChange={(e) => onChange('burial_place', e.target.value)}
        />
      </div>

      {/* 2차 장지 */}
      {showSecondPlace && (
        <div className={styles.field} style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label className={styles.label} style={{ marginBottom: 0 }}>2차 장지</label>
            <button
              type="button"
              onClick={handleRemoveSecondPlace}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--b2b-text-tertiary, #8B95A1)',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 4px',
              }}
            >
              <IconTrash size={14} /> 삭제
            </button>
          </div>
          <input
            type="text"
            className={styles.input}
            placeholder="2차 장지 (예: 분당메모리얼파크)"
            value={formData.burial_place2}
            onChange={(e) => onChange('burial_place2', e.target.value)}
          />
        </div>
      )}
    </section>
  );
}
