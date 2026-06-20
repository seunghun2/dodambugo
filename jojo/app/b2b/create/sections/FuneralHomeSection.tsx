'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconSearch, IconStar, IconChevronDown } from '@tabler/icons-react';
import styles from './sections.module.css';

interface FuneralHomeData {
  funeral_type: string;
  funeral_home: string;
  room_number: string;
  funeral_home_tel: string;
  address: string;
  address_detail: string;
}

interface Props {
  formData: FuneralHomeData;
  onChange: (field: string, value: string) => void;
  onOpenFacilitySearch: () => void;
}

interface SavedFacility {
  name: string;
  address: string;
  tel: string;
}

const FUNERAL_TYPES = [
  { value: '', label: '선택해주세요' },
  { value: '일반장례', label: '일반장례' },
  { value: '가족장', label: '가족장' },
  { value: '무빈소장례', label: '무빈소장례' },
];

const LS_KEY = 'b2b_favorite_facilities';

export default function FuneralHomeSection({ formData, onChange, onOpenFacilitySearch }: Props) {
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<SavedFacility[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isNoBinso = formData.funeral_type === '무빈소장례';

  // localStorage에서 자주찾는 식장 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedFacility[];
        setFavorites(parsed.slice(0, 10));
      }
    } catch {
      // localStorage 접근 불가 시 무시
    }
  }, []);

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    if (!showFavorites) return;

    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFavorites(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFavorites]);

  const handleSelectFavorite = useCallback(
    (facility: SavedFacility) => {
      onChange('funeral_home', facility.name);
      onChange('address', facility.address);
      onChange('funeral_home_tel', facility.tel);
      setShowFavorites(false);
    },
    [onChange],
  );

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>장례식장 정보</h2>
        {!isNoBinso && (
          <div className={styles.favoritesDropdown} ref={dropdownRef}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setShowFavorites((v) => !v)}
            >
              <IconStar size={15} />
              자주찾는 식장
              <IconChevronDown size={13} />
            </button>
            {showFavorites && (
              <div className={styles.favoritesPanel}>
                {favorites.length === 0 ? (
                  <div className={styles.favoritesEmpty}>
                    저장된 식장이 없습니다
                  </div>
                ) : (
                  favorites.map((fac, i) => (
                    <div
                      key={`${fac.name}-${i}`}
                      className={styles.favoriteItem}
                      onClick={() => handleSelectFavorite(fac)}
                    >
                      <span className={styles.favoriteName}>{fac.name}</span>
                      <span className={styles.favoriteAddr}>{fac.address}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 장례 형식 */}
      <div className={styles.field}>
        <label className={styles.label}>장례 형식</label>
        <select
          className={styles.select}
          value={formData.funeral_type}
          onChange={(e) => onChange('funeral_type', e.target.value)}
        >
          {FUNERAL_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* 무빈소장례가 아닐 때만 장례식장 필드 표시 */}
      {!isNoBinso && (
        <>
          {/* 장례식장 검색 바 */}
          <div className={styles.field}>
            <div
              className={styles.searchBar}
              onClick={onOpenFacilitySearch}
            >
              <span className={styles.searchPlaceholder}>
                {formData.funeral_home || '장례식장을 검색해주세요'}
              </span>
              <IconSearch size={18} stroke={1.8} />
            </div>
          </div>

          {/* 장례식장명 + 호실 */}
          <div className={styles.row}>
            <div className={styles.fieldFlex1}>
              <input
                type="text"
                className={styles.input}
                placeholder="장례식장명"
                value={formData.funeral_home}
                readOnly
              />
            </div>
            <div className={styles.fieldFlex1}>
              <input
                type="text"
                className={styles.input}
                placeholder="호실(예시:102호)"
                value={formData.room_number}
                onChange={(e) => onChange('room_number', e.target.value)}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
