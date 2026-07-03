'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import CalendarPicker from './CalendarPicker';
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
  errors?: Record<string, string>;
}

// 날짜 포맷: "2026-06-10" → "2026. 06. 10."
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}. ${m}. ${d}.`;
}

// 시간 입력 자동 포맷
function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
}

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
  onOpenCalendar: () => void;
  dateError?: string;
  timeError?: string;
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
  onOpenCalendar,
  dateError,
  timeError,
}: DateTimeCardProps) {
  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    const apiValue = timeDisplayToValue(formatted);
    onTimeChange(apiValue);
  };

  return (
    <div className={styles.dtCard}>
      <div className={styles.dtCardHeader}>
        <span className={styles.dtCardLabel}>
          {label}
          {required && <span className={styles.requiredMark}>*</span>}
        </span>
        {showClear && onClear && (
          <button type="button" className={styles.clearBtn} onClick={onClear}>
            □ 지우기
          </button>
        )}
      </div>
      <div className={styles.dtCardFields}>
        {/* 날짜 — 커스텀 캘린더 바텀시트 */}
        <div
          className={`${styles.dtInputWrap} ${dateError ? styles.inputError : ''}`}
          onClick={onOpenCalendar}
          data-error={dateError ? 'true' : undefined}
        >
          <div className={styles.dtDisplayInput}>
            <span className={dateValue ? styles.dtDisplayText : styles.dtPlaceholder}>
              {dateValue ? formatDate(dateValue) : `${label.replace('일시', '')}일자`}
            </span>
            <IconCalendar size={20} className={styles.dtInputIcon} />
          </div>
        </div>

        {/* 시간 — 직접 숫자 입력 */}
        <div className={`${styles.dtInputWrap} ${timeError ? styles.inputError : ''}`} data-error={timeError ? 'true' : undefined}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={styles.timeTextInput}
            placeholder="00:00"
            value={timeValue}
            onChange={handleTimeInput}
            maxLength={5}
          />
          <IconClock size={20} className={styles.dtInputIcon} />
        </div>
      </div>
      {(dateError || timeError) && (
        <p className={styles.fieldError}>{dateError || timeError}</p>
      )}
    </div>
  );
}

export default function DateTimeSection({ formData, onChange, onClear, errors }: Props) {
  const showIlpo = useMemo(
    () => formData.address?.includes('제주'),
    [formData.address],
  );

  // 캘린더 팝업 상태: { field, title }
  const [calendarState, setCalendarState] = useState<{ field: string; title: string } | null>(null);

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

  const openCalendar = (field: string, title: string) => {
    setCalendarState({ field, title });
  };

  const handleCalendarSelect = (date: string) => {
    if (calendarState) {
      onChange(calendarState.field, date);
    }
  };

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
        onOpenCalendar={() => openCalendar('death_date', '별세일자 선택')}
      />

      <DateTimeCard
        label="입실일시"
        dateValue={formData.checkin_date}
        timeValue={formData.checkin_time}
        onDateChange={(v) => onChange('checkin_date', v)}
        onTimeChange={(v) => onChange('checkin_time', v)}
        onClear={handleClearCheckin}
        onOpenCalendar={() => openCalendar('checkin_date', '입실일자 선택')}
      />

      <DateTimeCard
        label="입관일시"
        dateValue={formData.encoffin_date}
        timeValue={formData.encoffin_time}
        onDateChange={(v) => onChange('encoffin_date', v)}
        onTimeChange={(v) => onChange('encoffin_time', v)}
        onClear={handleClearEncoffin}
        onOpenCalendar={() => openCalendar('encoffin_date', '입관일자 선택')}
      />

      <DateTimeCard
        label="발인일시"
        required
        showClear={false}
        dateValue={formData.funeral_date}
        timeValue={formData.funeral_time}
        onDateChange={(v) => onChange('funeral_date', v)}
        onTimeChange={(v) => onChange('funeral_time', v)}
        onOpenCalendar={() => openCalendar('funeral_date', '발인일자 선택')}
        dateError={errors?.funeral_date}
        timeError={errors?.funeral_time}
      />

      {showIlpo && (
        <DateTimeCard
          label="일포일시"
          dateValue={formData.ilpo_date}
          timeValue={formData.ilpo_time}
          onDateChange={(v) => onChange('ilpo_date', v)}
          onTimeChange={(v) => onChange('ilpo_time', v)}
          onClear={handleClearIlpo}
          onOpenCalendar={() => openCalendar('ilpo_date', '일포일자 선택')}
        />
      )}

      {/* 캘린더 바텀시트 */}
      <CalendarPicker
        isOpen={!!calendarState}
        title={calendarState?.title || ''}
        value={(calendarState && (formData as unknown as Record<string, string>)[calendarState.field]) || ''}
        onSelect={handleCalendarSelect}
        onClose={() => setCalendarState(null)}
      />
    </section>
  );
}
