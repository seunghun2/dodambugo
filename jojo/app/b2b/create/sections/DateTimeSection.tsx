'use client';

import React, { useCallback, useMemo, useRef } from 'react';
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

// 날짜 포맷: "2026-06-10" → "2026. 06. 10."
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}. ${m}. ${d}.`;
}

// 시간 입력 자동 포맷: 숫자만 입력 → HH:MM
function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
}

// 시간 표시값 → API값 (HH:MM)
function timeDisplayToValue(display: string): string {
  const digits = display.replace(/\D/g, '');
  if (digits.length < 4) return display;
  return digits.slice(0, 2) + ':' + digits.slice(2, 4);
}

interface DateTimeCardProps {
  label: string;
  required?: boolean;
  showClear?: boolean;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onClear?: () => void;
}

function DateTimeCard({
  label,
  required,
  showClear = true,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  onClear,
}: DateTimeCardProps) {
  const dateRef = useRef<HTMLInputElement>(null);

  // 시간 입력 핸들러
  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    // HH:MM 완성 시 API 값으로 변환
    const apiValue = timeDisplayToValue(formatted);
    onTimeChange(apiValue);
  };

  // 시간 표시값
  const timeDisplay = timeValue || '';

  return (
    <div className={styles.dtCard}>
      <div className={styles.dtCardHeader}>
        <span className={styles.dtCardLabel}>
          {label}
          {required && <span className={styles.requiredMark}>*</span>}
        </span>
        {showClear && onClear && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={onClear}
          >
            □ 지우기
          </button>
        )}
      </div>
      <div className={styles.dtCardFields}>
        {/* 날짜 — native date picker */}
        <div className={styles.dtInputWrap} onClick={() => dateRef.current?.showPicker?.()}>
          <input
            ref={dateRef}
            type="date"
            className={styles.dtHiddenInput}
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
          />
          <div className={styles.dtDisplayInput}>
            <span className={dateValue ? styles.dtDisplayText : styles.dtPlaceholder}>
              {dateValue ? formatDate(dateValue) : `${label.replace('일시', '')}일자`}
            </span>
            <IconCalendar size={20} className={styles.dtInputIcon} />
          </div>
        </div>

        {/* 시간 — 직접 숫자 입력 */}
        <div className={styles.dtInputWrap}>
          <input
            type="text"
            inputMode="numeric"
            className={styles.timeTextInput}
            placeholder="00:00"
            value={timeDisplay}
            onChange={handleTimeInput}
            maxLength={5}
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

      <DateTimeCard
        label="별세일시"
        dateValue={formData.death_date}
        timeValue={formData.death_time}
        onDateChange={(v) => onChange('death_date', v)}
        onTimeChange={(v) => onChange('death_time', v)}
        onClear={handleClearDeath}
      />

      <DateTimeCard
        label="입실일시"
        dateValue={formData.checkin_date}
        timeValue={formData.checkin_time}
        onDateChange={(v) => onChange('checkin_date', v)}
        onTimeChange={(v) => onChange('checkin_time', v)}
        onClear={handleClearCheckin}
      />

      <DateTimeCard
        label="입관일시"
        dateValue={formData.encoffin_date}
        timeValue={formData.encoffin_time}
        onDateChange={(v) => onChange('encoffin_date', v)}
        onTimeChange={(v) => onChange('encoffin_time', v)}
        onClear={handleClearEncoffin}
      />

      <DateTimeCard
        label="발인일시"
        required
        showClear={false}
        dateValue={formData.funeral_date}
        timeValue={formData.funeral_time}
        onDateChange={(v) => onChange('funeral_date', v)}
        onTimeChange={(v) => onChange('funeral_time', v)}
      />

      {showIlpo && (
        <DateTimeCard
          label="일포일시"
          dateValue={formData.ilpo_date}
          timeValue={formData.ilpo_time}
          onDateChange={(v) => onChange('ilpo_date', v)}
          onTimeChange={(v) => onChange('ilpo_time', v)}
          onClear={handleClearIlpo}
        />
      )}
    </section>
  );
}
