'use client';

import React, { useCallback, useMemo } from 'react';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import styles from './sections.module.css';

interface DateTimeData {
  death_date: string;
  death_time: string;
  checkin_date: string;
  checkin_time: string;
  encoffin_date: string;
  encoffin_time: string;
  funeral_date: string;
  funeral_time: string;
  ilpo_date: string;
  ilpo_time: string;
  address: string;
}

interface Props {
  formData: DateTimeData;
  onChange: (field: string, value: string) => void;
  onClear: (fields: string[]) => void;
}

interface DateTimeCardProps {
  label: string;
  required?: boolean;
  showClear?: boolean;
  isCleared?: boolean;
  onClear?: () => void;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

function DateTimeCard({
  label,
  required,
  showClear = true,
  isCleared,
  onClear,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
}: DateTimeCardProps) {
  return (
    <div className={styles.dtCard}>
      <div className={styles.dtCardHeader}>
        <span className={`${styles.dtCardLabel} ${required ? styles.required : ''}`}>
          {label}
        </span>
        {showClear && onClear && (
          <label className={styles.clearCheck}>
            <input
              type="checkbox"
              checked={isCleared}
              onChange={(e) => {
                if (e.target.checked) onClear();
              }}
            />
            지우기
          </label>
        )}
      </div>
      <div className={styles.dtCardFields}>
        <div className={styles.dtInputWrap}>
          <input
            type="date"
            className={styles.dtDateInput}
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            placeholder="연도. 월. 일"
          />
          <IconCalendar size={20} className={styles.dtInputIcon} />
        </div>
        <div className={styles.dtInputWrap}>
          <input
            type="time"
            className={styles.dtTimeInput}
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
            placeholder="00:00"
          />
          <IconClock size={20} className={styles.dtInputIcon} />
        </div>
      </div>
    </div>
  );
}

export default function DateTimeSection({ formData, onChange, onClear }: Props) {
  const showIlpo = useMemo(
    () => formData.address?.includes('제주'),
    [formData.address],
  );

  // 지우기 핸들러
  const handleClearDeath = useCallback(() => {
    onClear(['death_date', 'death_time']);
  }, [onClear]);

  const handleClearCheckin = useCallback(() => {
    onClear(['checkin_date', 'checkin_time']);
  }, [onClear]);

  const handleClearEncoffin = useCallback(() => {
    onClear(['encoffin_date', 'encoffin_time']);
  }, [onClear]);

  const handleClearIlpo = useCallback(() => {
    onClear(['ilpo_date', 'ilpo_time']);
  }, [onClear]);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>일시 정보</h2>

      {/* 별세일시 */}
      <DateTimeCard
        label="별세일시"
        dateValue={formData.death_date}
        timeValue={formData.death_time}
        onDateChange={(v) => onChange('death_date', v)}
        onTimeChange={(v) => onChange('death_time', v)}
        isCleared={!formData.death_date && !formData.death_time}
        onClear={handleClearDeath}
      />

      {/* 입실일시 */}
      <DateTimeCard
        label="입실일시"
        dateValue={formData.checkin_date}
        timeValue={formData.checkin_time}
        onDateChange={(v) => onChange('checkin_date', v)}
        onTimeChange={(v) => onChange('checkin_time', v)}
        isCleared={!formData.checkin_date && !formData.checkin_time}
        onClear={handleClearCheckin}
      />

      {/* 입관일시 */}
      <DateTimeCard
        label="입관일시"
        dateValue={formData.encoffin_date}
        timeValue={formData.encoffin_time}
        onDateChange={(v) => onChange('encoffin_date', v)}
        onTimeChange={(v) => onChange('encoffin_time', v)}
        isCleared={!formData.encoffin_date && !formData.encoffin_time}
        onClear={handleClearEncoffin}
      />

      {/* 발인일시 (필수 — 지우기 없음) */}
      <DateTimeCard
        label="발인일시"
        required
        showClear={false}
        dateValue={formData.funeral_date}
        timeValue={formData.funeral_time}
        onDateChange={(v) => onChange('funeral_date', v)}
        onTimeChange={(v) => onChange('funeral_time', v)}
      />

      {/* 일포일시 — 제주 주소일 때만 노출 */}
      {showIlpo && (
        <DateTimeCard
          label="일포일시"
          dateValue={formData.ilpo_date}
          timeValue={formData.ilpo_time}
          onDateChange={(v) => onChange('ilpo_date', v)}
          onTimeChange={(v) => onChange('ilpo_time', v)}
          isCleared={!formData.ilpo_date && !formData.ilpo_time}
          onClear={handleClearIlpo}
        />
      )}
    </section>
  );
}
