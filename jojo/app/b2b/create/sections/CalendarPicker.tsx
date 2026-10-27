'use client';

import React, { useState, useMemo } from 'react';
import styles from './sections.module.css';

interface CalendarPickerProps {
  isOpen: boolean;
  title: string;
  value: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarPicker({ isOpen, title, value, onSelect, onClose }: CalendarPickerProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 현재 표시 중인 연/월
  const initialDate = value ? new Date(value + 'T00:00:00') : today;
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed

  // 달력 데이터 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = firstDay.getDay(); // 0=일요일
    const totalDays = lastDay.getDate();

    const days: (number | null)[] = [];

    // 이전 달 빈칸
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      days.push(-(prevMonthLastDay - i)); // 음수 = 이전 달
    }

    // 이번 달
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }

    // 다음 달 빈칸 (6줄 맞추기)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(null);
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelect(dateStr);
    onClose();
  };

  if (!isOpen) return null;

  // 선택된 날짜 문자열
  const selectedStr = value || '';

  // 🛡️ 대표님 지침: 월 변경 시 바텀시트 모달 높이가 덜컹 움직이지 않도록 항상 6주(42칸) 고정
  const visibleDays = calendarDays.slice(0, 42);

  return (
    <div className={styles.bottomSheetOverlay} onClick={onClose}>
      <div className={styles.calendarSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.bottomSheetHandle} />

        {/* 타이틀 */}
        <div className={styles.calendarTitle}>{title}</div>

        {/* 월 네비게이션 */}
        <div className={styles.calendarNav}>
          <button type="button" className={styles.calendarNavBtn} onClick={handlePrevMonth}>
            ‹
          </button>
          <span className={styles.calendarNavLabel}>
            {viewYear}년 {viewMonth + 1}월
          </span>
          <button type="button" className={styles.calendarNavBtn} onClick={handleNextMonth}>
            ›
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className={styles.calendarGrid}>
          {WEEKDAYS.map((day, i) => (
            <div
              key={`header-${day}`}
              className={`${styles.calendarDow} ${i === 0 ? styles.calendarSunday : ''} ${i === 6 ? styles.calendarSaturday : ''}`}
            >
              {day}
            </div>
          ))}

          {/* 날짜 셀 */}
          {visibleDays.map((day, i) => {
            if (day === null || (day as number) <= 0) {
              // 이전 달 또는 다음 달 날짜
              let otherDayNum = '';
              if (day !== null && (day as number) <= 0) {
                otherDayNum = String(Math.abs(day as number));
              } else {
                const currentMonthLastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
                const firstDayDow = new Date(viewYear, viewMonth, 1).getDay();
                const nextMonthDay = i + 1 - (firstDayDow + currentMonthLastDay);
                if (nextMonthDay > 0) otherDayNum = String(nextMonthDay);
              }

              return (
                <div key={`empty-${i}`} className={styles.calendarDay}>
                  <span className={styles.calendarDayOther}>
                    {otherDayNum}
                  </span>
                </div>
              );
            }

            const dayNum = day as number;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedStr;
            const dow = i % 7; // 0=일, 6=토

            return (
              <div key={`day-${dayNum}`} className={styles.calendarDay}>
                <button
                  type="button"
                  className={`${styles.calendarDayBtn} ${isToday ? styles.calendarDayToday : ''} ${isSelected ? styles.calendarDaySelected : ''} ${dow === 0 ? styles.calendarSunday : ''} ${dow === 6 ? styles.calendarSaturday : ''}`}
                  onClick={() => handleDayClick(dayNum)}
                >
                  {dayNum}
                </button>
              </div>
            );
          })}
        </div>

        {/* 닫기 버튼 */}
        <button type="button" className={styles.calendarCloseBtn} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
