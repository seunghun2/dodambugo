'use client';

import React, { useCallback, useMemo } from 'react';
import styles from './sections.module.css';

interface DateTimeData {
  death_date: string;
  death_hour: string;
  death_minute: string;
  checkin_date: string;
  checkin_time: string;
  encoffin_date: string;
  encoffin_hour: string;
  encoffin_minute: string;
  funeral_date: string;
  funeral_hour: string;
  funeral_minute: string;
  ilpo_date: string;
  ilpo_time: string;
  address: string;
}

interface Props {
  formData: DateTimeData;
  onChange: (field: string, value: string) => void;
  onClear: (fields: string[]) => void;
}

// 시 옵션 (0~23)
const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: `${i}시`,
}));

// 분 옵션 (00, 10, 20, 30, 40, 50)
const MINUTES = [0, 10, 20, 30, 40, 50].map((m) => ({
  value: String(m).padStart(2, '0'),
  label: `${String(m).padStart(2, '0')}분`,
}));

// 체크인 시간 옵션 (HH:MM 조합)
const CHECKIN_TIMES = (() => {
  const times: { value: string; label: string }[] = [
    { value: '', label: '시간 선택' },
  ];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 10, 20, 30, 40, 50]) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      times.push({ value: `${hh}:${mm}`, label: `${h}시 ${mm}분` });
    }
  }
  return times;
})();

// 일포 시간 옵션
const ILPO_TIMES = CHECKIN_TIMES;

export default function DateTimeSection({ formData, onChange, onClear }: Props) {
  const showIlpo = useMemo(
    () => formData.address?.includes('제주'),
    [formData.address],
  );

  // 지우기 핸들러
  const handleClearDeath = useCallback(() => {
    onClear(['death_date', 'death_hour', 'death_minute']);
  }, [onClear]);

  const handleClearCheckin = useCallback(() => {
    onClear(['checkin_date', 'checkin_time']);
  }, [onClear]);

  const handleClearEncoffin = useCallback(() => {
    onClear(['encoffin_date', 'encoffin_hour', 'encoffin_minute']);
  }, [onClear]);

  const isDeathCleared =
    !formData.death_date && !formData.death_hour && !formData.death_minute;

  const isCheckinCleared =
    !formData.checkin_date && !formData.checkin_time;

  const isEncoffinCleared =
    !formData.encoffin_date && !formData.encoffin_hour && !formData.encoffin_minute;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>일시 정보</h2>

      {/* 별세일시 */}
      <div className={styles.dateTimeGroup}>
        <div className={styles.dateTimeHeader}>
          <span className={styles.dateTimeLabel}>별세일시</span>
          <label className={styles.clearCheck}>
            <input
              type="checkbox"
              checked={isDeathCleared}
              onChange={(e) => {
                if (e.target.checked) handleClearDeath();
              }}
            />
            지우기
          </label>
        </div>
        <div className={styles.dateTimeFields}>
          <input
            type="date"
            className={`${styles.input} ${styles.dateInput}`}
            value={formData.death_date}
            onChange={(e) => onChange('death_date', e.target.value)}
          />
          <select
            className={styles.selectNarrow}
            value={formData.death_hour}
            onChange={(e) => onChange('death_hour', e.target.value)}
          >
            <option value="">시</option>
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
          <span className={styles.timeSeparator}>:</span>
          <select
            className={styles.selectNarrow}
            value={formData.death_minute}
            onChange={(e) => onChange('death_minute', e.target.value)}
          >
            <option value="">분</option>
            {MINUTES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 입실일시 (🆕 새 필드) */}
      <div className={styles.dateTimeGroup}>
        <div className={styles.dateTimeHeader}>
          <span className={styles.dateTimeLabel}>입실일시</span>
          <label className={styles.clearCheck}>
            <input
              type="checkbox"
              checked={isCheckinCleared}
              onChange={(e) => {
                if (e.target.checked) handleClearCheckin();
              }}
            />
            지우기
          </label>
        </div>
        <div className={styles.dateTimeFields}>
          <input
            type="date"
            className={`${styles.input} ${styles.dateInput}`}
            value={formData.checkin_date}
            onChange={(e) => onChange('checkin_date', e.target.value)}
          />
          <select
            className={styles.selectNarrow}
            value={formData.checkin_time}
            onChange={(e) => onChange('checkin_time', e.target.value)}
          >
            <option value="">시간 선택</option>
            {HOURS.map((h) =>
              MINUTES.map((m) => (
                <option
                  key={`${h.value}:${m.value}`}
                  value={`${h.value}:${m.value}`}
                >
                  {h.label} {m.label}
                </option>
              )),
            )}
          </select>
        </div>
      </div>

      {/* 입관일시 */}
      <div className={styles.dateTimeGroup}>
        <div className={styles.dateTimeHeader}>
          <span className={styles.dateTimeLabel}>입관일시</span>
          <label className={styles.clearCheck}>
            <input
              type="checkbox"
              checked={isEncoffinCleared}
              onChange={(e) => {
                if (e.target.checked) handleClearEncoffin();
              }}
            />
            지우기
          </label>
        </div>
        <div className={styles.dateTimeFields}>
          <input
            type="date"
            className={`${styles.input} ${styles.dateInput}`}
            value={formData.encoffin_date}
            onChange={(e) => onChange('encoffin_date', e.target.value)}
          />
          <select
            className={styles.selectNarrow}
            value={formData.encoffin_hour}
            onChange={(e) => onChange('encoffin_hour', e.target.value)}
          >
            <option value="">시</option>
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
          <span className={styles.timeSeparator}>:</span>
          <select
            className={styles.selectNarrow}
            value={formData.encoffin_minute}
            onChange={(e) => onChange('encoffin_minute', e.target.value)}
          >
            <option value="">분</option>
            {MINUTES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 발인일시 (필수) */}
      <div className={styles.dateTimeGroup}>
        <div className={styles.dateTimeHeader}>
          <span className={`${styles.dateTimeLabel} ${styles.required}`}>발인일시</span>
        </div>
        <div className={styles.dateTimeFields}>
          <input
            type="date"
            className={`${styles.input} ${styles.dateInput}`}
            value={formData.funeral_date}
            onChange={(e) => onChange('funeral_date', e.target.value)}
          />
          <select
            className={styles.selectNarrow}
            value={formData.funeral_hour}
            onChange={(e) => onChange('funeral_hour', e.target.value)}
          >
            <option value="">시</option>
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
          <span className={styles.timeSeparator}>:</span>
          <select
            className={styles.selectNarrow}
            value={formData.funeral_minute}
            onChange={(e) => onChange('funeral_minute', e.target.value)}
          >
            <option value="">분</option>
            {MINUTES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 일포일시 — 제주 주소일 때만 노출 */}
      {showIlpo && (
        <div className={styles.dateTimeGroup}>
          <div className={styles.dateTimeHeader}>
            <span className={styles.dateTimeLabel}>일포일시</span>
          </div>
          <div className={styles.dateTimeFields}>
            <input
              type="date"
              className={`${styles.input} ${styles.dateInput}`}
              value={formData.ilpo_date}
              onChange={(e) => onChange('ilpo_date', e.target.value)}
            />
            <select
              className={styles.selectNarrow}
              value={formData.ilpo_time}
              onChange={(e) => onChange('ilpo_time', e.target.value)}
            >
              <option value="">시간 선택</option>
              {HOURS.map((h) =>
                MINUTES.map((m) => (
                  <option
                    key={`${h.value}:${m.value}`}
                    value={`${h.value}:${m.value}`}
                  >
                    {h.label} {m.label}
                  </option>
                )),
              )}
            </select>
          </div>
        </div>
      )}
    </section>
  );
}
