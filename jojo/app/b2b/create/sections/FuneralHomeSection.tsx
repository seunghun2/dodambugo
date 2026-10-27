'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconSearch, IconStar } from '@tabler/icons-react';
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
  errors?: Record<string, string>;
}

interface SavedFacility {
  name: string;
  address: string;
  tel: string;
}

const FUNERAL_TYPES = [
  { value: '일반장례', label: '일반장례' },
  { value: '가족장', label: '가족장' },
  { value: '무빈소장례', label: '무빈소장례' },
];

const LS_KEY = 'b2b_favorite_facilities';

export default function FuneralHomeSection({ formData, onChange, onOpenFacilitySearch, errors }: Props) {
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<SavedFacility[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isNoBinso = formData.funeral_type === '무빈소장례';

  // localStorage에서 자주찾는 식장 로드
  useEffect(() => {
    if (!showFavorites) return;
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedFacility[];
        setFavorites(parsed.slice(0, 10));
      } else {
        setFavorites([]);
      }
    } catch {
      // localStorage 접근 불가 시 무시
    }
  }, [showFavorites]);

  // 드롭다운 외부 클릭 닫기 (이제 바텀시트로 변경되므로 불필요하지만 혹시 몰라 유지, 실제로는 바텀시트 오버레이 클릭시 닫힘)
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

  // 바텀시트 스와이프 닫기 로직용
  const sheetDragStartY = useRef(0);
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetDragStartY.current = e.touches[0].clientY;
  };
  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - sheetDragStartY.current;
    if (dy > 80) setShowFavorites(false);
  };

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
        <h2 className={styles.sectionTitle}>
          장례식장 정보<span className={styles.requiredMark}>*</span>
        </h2>
        {!isNoBinso && (
          <div>
            <button
              type="button"
              className={styles.favBtn}
              onClick={() => setShowFavorites(true)}
            >
              <IconStar size={14} />
              자주찾는 식장
            </button>
            
            {showFavorites && (
              <div className={styles.bottomSheetOverlay} onClick={() => setShowFavorites(false)}>
                <div 
                  className={styles.bottomSheet} 
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={handleSheetTouchStart}
                  onTouchEnd={handleSheetTouchEnd}
                >
                  <div className={styles.bottomSheetHandle} />
                  <h3 className={styles.bottomSheetTitle}>자주찾는 식장</h3>
                  <div className={styles.sheetContent}>
                    {favorites.length === 0 ? (
                      <div className={styles.favoritesEmpty}>
                        저장된 장례식장이 없습니다.<br/>
                        장례식장 검색에서 별 아이콘을 눌러 추가해보세요.
                      </div>
                    ) : (
                      <div className={styles.favoritesList}>
                        {favorites.map((fac, i) => (
                          <div
                            key={`${fac.name}-${i}`}
                            className={styles.favoriteSheetItem}
                            onClick={() => handleSelectFavorite(fac)}
                          >
                            <span className={styles.favoriteName}>{fac.name}</span>
                            <span className={styles.favoriteAddr}>{fac.address}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
          {/* 장례식장 주소 겸 검색 바 (두 번째 라인) */}
          <div className={styles.field}>
            <div
              className={`${styles.searchBar} ${errors?.funeral_home ? styles.inputError : ''}`}
              onClick={onOpenFacilitySearch}
              data-error={errors?.funeral_home ? 'true' : undefined}
            >
              <span className={styles.searchPlaceholder} style={{ color: formData.address ? '#333' : '#999' }}>
                {formData.address || '장례식장을 검색해주세요'}
              </span>
              <IconSearch size={18} stroke={1.8} />
            </div>
          </div>

          {/* 장례식장명 + 호실 (세 번째 라인) */}
          <div className={styles.row}>
            <div className={styles.fieldFlex1}>
              <input
                type="text"
                className={`${styles.input} ${errors?.funeral_home ? styles.inputError : ''}`}
                placeholder="장례식장명"
                value={formData.funeral_home}
                onChange={(e) => onChange('funeral_home', e.target.value)}
                data-error={errors?.funeral_home ? 'true' : undefined}
              />
              {errors?.funeral_home && (
                <p className={styles.fieldError}>{errors.funeral_home}</p>
              )}
            </div>
            <div className={styles.fieldFlex1}>
              <input
                type="text"
                className={`${styles.input} ${errors?.room_number ? styles.inputError : ''}`}
                placeholder="호실(예시:102호)"
                value={formData.room_number}
                onChange={(e) => onChange('room_number', e.target.value)}
                data-error={errors?.room_number ? 'true' : undefined}
              />
              {errors?.room_number && (
                <p className={styles.fieldError}>{errors.room_number}</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
