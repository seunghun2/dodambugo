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

// 시간 포맷: "14:00" → "오후 02:00"
function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h < 12 ? '오전' : '오후';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface DateTimeCardProps {
  label: string;
  required?: boolean;
  showClear?: boolean;
  isCleared?: boolean;
  onClear?: () => void;
  dateValue: string;
  timeValue: string;
  datePlaceholder?: string;
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
  datePlaceholder,
  onDateChange,
  onTimeChange,
}: DateTimeCardProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.dtCard}>
      <div className={styles.dtCardHeader}>
        <span className={styles.dtCardLabel}>
          {label}
          {required && <span className={styles.requiredMark}>*</span>}
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
        {/* 날짜 */}
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
              {dateValue ? formatDate(dateValue) : (datePlaceholder || `${label.replace('일시', '')}일자`)}
            </span>
            <IconCalendar size={20} className={styles.dtInputIcon} />
          </div>
        </div>

        {/* 시간 */}
        <div className={styles.dtInputWrap} onClick={() => timeRef.current?.showPicker?.()}>
          <input
            ref={timeRef}
            type="time"
            className={styles.dtHiddenInput}
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
          />
          <div className={styles.dtDisplayInput}>
            <span className={timeValue ? styles.dtDisplayText : styles.dtPlaceholder}>
              {timeValue ? formatTime(timeValue) : '00:00'}
            </span>
            <IconClock size={20} className={styles.dtInputIcon} />
          </div>
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
        isCleared={!formData.death_date && !formData.death_time}
        onClear={handleClearDeath}
      />

      <DateTimeCard
        label="입실일시"
        dateValue={formData.checkin_date}
        timeValue={formData.checkin_time}
        onDateChange={(v) => onChange('checkin_date', v)}
        onTimeChange={(v) => onChange('checkin_time', v)}
        isCleared={!formData.checkin_date && !formData.checkin_time}
        onClear={handleClearCheckin}
      />

      <DateTimeCard
        label="입관일시"
        dateValue={formData.encoffin_date}
        timeValue={formData.encoffin_time}
        onDateChange={(v) => onChange('encoffin_date', v)}
        onTimeChange={(v) => onChange('encoffin_time', v)}
        isCleared={!formData.encoffin_date && !formData.encoffin_time}
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
          isCleared={!formData.ilpo_date && !formData.ilpo_time}
          onClear={handleClearIlpo}
        />
      )}
    </section>
  );
}
