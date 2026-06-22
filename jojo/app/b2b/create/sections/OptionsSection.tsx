'use client';

import React, { useRef, useState, useEffect } from 'react';
import { IconUpload, IconPlus, IconStar, IconStarFilled, IconCheck } from '@tabler/icons-react';
import styles from './sections.module.css';

interface Props {
  formData: {
    partner_logo_url: string;
    hide_flower_order: boolean;
    message: string;
    show_message: boolean;
    death_term: string;
    auto_reply: boolean;
  };
  onChange: (field: string, value: string | boolean) => void;
}

const DEATH_TERMS = [
  { value: '별세', label: '별세' },
  { value: '운명', label: '운명' },
  { value: '소천', label: '소천' },
  { value: '선종', label: '선종' },
  { value: '입적', label: '입적' },
];

const LOGO_PRESETS = [
  { id: 'preed', name: '프리드라이프', url: '/images/sangjo/프리드라이프.png' },
  { id: 'kyowon', name: '교원라이프', url: '/images/sangjo/교원라이프.png' },
  { id: 'sonoad', name: '소노아임레디', url: '/images/sangjo/소노아임레디.png' },
  { id: 'yedaham', name: '더케이예다함', url: '/images/sangjo/더케이예다함.png' },
  { id: 'boram', name: '보람상조', url: '/images/sangjo/보람상조.png' },
  { id: 'bumo', name: '부모사랑', url: '/images/sangjo/부모사랑.png' },
  { id: 'sejong', name: '세종라이프', url: '/images/sangjo/세종라이프.png' },
  { id: 'cktps', name: 'CKTPS라이프', url: '/images/sangjo/CKTPS라이프.png' },
  { id: 'agape', name: '아가페라이프', url: '/images/sangjo/아가페라이프.png' },
  { id: 'arum', name: '아름라이프상조', url: '/images/sangjo/아름라이프상조.png' },
  { id: 'inet', name: '아이넷라이프', url: '/images/sangjo/아이넷라이프.png' },
  { id: 'sanrim', name: '산림조합라이프', url: '/images/sangjo/산림조합라이프.png' },
  { id: 'hdtours', name: '에이치디투어즈', url: '/images/sangjo/에이치디투어즈.png' },
  { id: 'aplus', name: '에이플러스라이프', url: '/images/sangjo/에이플러스라이프.png' },
  { id: 'yesarang', name: '예사랑라이프', url: '/images/sangjo/예사랑라이프.png' },
  { id: 'olife', name: '오라이프', url: '/images/sangjo/오라이프.png' },
  { id: 'wooritour', name: '우리관광', url: '/images/sangjo/우리관광.png' },
  { id: 'woorijeju', name: '우리제주상조', url: '/images/sangjo/우리제주상조.png' },
  { id: 'jabin', name: '자빈', url: '/images/sangjo/자빈.png' },
  { id: 'jhlife', name: '제이에이치라이프', url: '/images/sangjo/제이에이치라이프.png' },
  { id: 'jklife', name: '제이케이라이프', url: '/images/sangjo/제이케이라이프.png' },
  { id: 'jejuilchul', name: '제주일출상조', url: '/images/sangjo/제주일출상조.png' },
  { id: 'jejujangrye', name: '제주장례협동조합', url: '/images/sangjo/제주장례협동조합.png' },
  { id: 'goodworld', name: '좋은세상', url: '/images/sangjo/좋은세상.png' },
  { id: 'jiulife', name: '지우라이프상조', url: '/images/sangjo/지우라이프상조.png' },
  { id: 'hanra', name: '한라상조', url: '/images/sangjo/한라상조.png' },
  { id: 'happyending', name: '해피엔딩', url: '/images/sangjo/해피엔딩.png' },
  { id: 'hyundaes', name: '현대에스라이프', url: '/images/sangjo/현대에스라이프.png' },
  { id: 'hyundaitour', name: '현대투어플랜', url: '/images/sangjo/현대투어플랜.png' },
  { id: 'hyowon', name: '효원상조', url: '/images/sangjo/효원상조.png' },
  { id: 'humanlife', name: '휴먼라이프', url: '/images/sangjo/휴먼라이프.png' },
  { id: 'daehan', name: '대한더라이프', url: '/images/sangjo/대한더라이프.png' },
  { id: 'thejoeun', name: '더좋은라이프', url: '/images/sangjo/더좋은라이프.png' }
];

// 토글 스위치 컴포넌트
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        className={styles.toggleInput}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.toggleSlider} />
    </label>
  );
}

export default function OptionsSection({ formData, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [activeLogoTab, setActiveLogoTab] = useState<'favorites' | 'presets' | 'custom'>('favorites');
  const [favoriteLogos, setFavoriteLogos] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem('b2b_favorite_logos');
      if (stored) {
        setFavoriteLogos(JSON.parse(stored));
      } else {
        // 프리드라이프, 보람상조를 기본 즐겨찾기로 세팅
        setFavoriteLogos(['preed', 'boram']);
        localStorage.setItem('b2b_favorite_logos', JSON.stringify(['preed', 'boram']));
      }
    } catch {}
  }, []);

  const toggleFavoriteLogo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavoriteLogos(prev => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter(v => v !== id) : [...prev, id];
      localStorage.setItem('b2b_favorite_logos', JSON.stringify(next));
      return next;
    });
  };

  // 바텀시트 스와이프 닫기 로직
  const sheetDragStartY = useRef(0);
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetDragStartY.current = e.touches[0].clientY;
  };
  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - sheetDragStartY.current;
    if (dy > 80) setShowLogoModal(false);
  };

  const handleLogoSelect = (url: string) => {
    onChange('partner_logo_url', url);
    setShowLogoModal(false);
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange('partner_logo_url', url);
    setShowLogoModal(false);
  };

  const isLogoOn = !!formData.partner_logo_url;
  
  // 현재 선택된 로고 객체 찾기 (프리셋 중에 있으면)
  const selectedPreset = LOGO_PRESETS.find(p => p.url === formData.partner_logo_url);
  const previewName = selectedPreset ? selectedPreset.name : (formData.partner_logo_url ? '직접 등록 로고' : '');

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>기타 옵션</h2>

      {/* 1. 상조 로고 */}
      <div className={styles.optionRow}>
        <div className={styles.optionInfo}>
          <div className={styles.optionLabel}>상조 로고</div>
          {isLogoOn && (
            <div className={styles.logoPreviewArea}>
              {formData.partner_logo_url && formData.partner_logo_url !== 'mute' ? (
                <div className={styles.logoPreviewBox} onClick={() => setShowLogoModal(true)}>
                  <img src={formData.partner_logo_url} alt="로고" className={styles.logoPreviewImg} />
                  <span className={styles.logoPreviewText}>{previewName}</span>
                </div>
              ) : (
                <div className={styles.logoRegisterBox} onClick={() => setShowLogoModal(true)}>
                  <IconPlus size={20} color="var(--gray-400)" />
                  <span className={styles.logoRegisterText}>로고 등록</span>
                </div>
              )}
            </div>
          )}
        </div>
        <Toggle
          checked={isLogoOn}
          onChange={(val) => {
            if (val) {
              onChange('partner_logo_url', 'mute');
              setShowLogoModal(true);
            } else {
              onChange('partner_logo_url', '');
            }
          }}
        />
      </div>

      {/* 로고 바텀시트 모달 */}
      {showLogoModal && (
        <div className={styles.bottomSheetOverlay} onClick={() => setShowLogoModal(false)}>
          <div 
            className={styles.bottomSheet} 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={handleSheetTouchEnd}
          >
            <div className={styles.bottomSheetHandle} />
            <h3 className={styles.bottomSheetTitle}>로고 등록</h3>
            
            <div className={styles.logoTabs}>
              <button 
                className={`${styles.logoTab} ${activeLogoTab === 'favorites' ? styles.logoTabActive : ''}`}
                onClick={() => setActiveLogoTab('favorites')}
              >
                즐겨찾기
              </button>
              <button 
                className={`${styles.logoTab} ${activeLogoTab === 'presets' ? styles.logoTabActive : ''}`}
                onClick={() => setActiveLogoTab('presets')}
              >
                상조 로고
              </button>
              <button 
                className={`${styles.logoTab} ${activeLogoTab === 'custom' ? styles.logoTabActive : ''}`}
                onClick={() => setActiveLogoTab('custom')}
              >
                직접 등록
              </button>
            </div>

            <div className={styles.sheetContent}>
              {activeLogoTab === 'favorites' && (
                <div className={styles.logoGrid}>
                  {favoriteLogos.length === 0 ? (
                    <div className={styles.favoritesEmpty}>즐겨찾기된 로고가 없습니다.</div>
                  ) : (
                    LOGO_PRESETS.filter(p => favoriteLogos.includes(p.id)).map(logo => (
                      <div 
                        key={logo.id} 
                        className={`${styles.logoGridItem} ${formData.partner_logo_url === logo.url ? styles.logoGridItemActive : ''}`}
                        onClick={() => handleLogoSelect(logo.url)}
                      >
                        <div className={styles.logoImgWrapper}>
                          <img src={logo.url} alt={logo.name} />
                          {formData.partner_logo_url === logo.url && (
                            <div className={styles.logoCheckmark}>
                              <IconCheck size={16} color="white" />
                            </div>
                          )}
                        </div>
                        <div className={styles.logoItemFooter}>
                          <span className={styles.logoItemName}>{logo.name}</span>
                          <button 
                            type="button" 
                            className={styles.logoStarBtn}
                            onClick={(e) => toggleFavoriteLogo(e, logo.id)}
                          >
                            <IconStarFilled size={18} color="#F1C40F" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeLogoTab === 'presets' && (
                <div className={styles.logoGrid}>
                  {LOGO_PRESETS.map(logo => {
                    const isFav = favoriteLogos.includes(logo.id);
                    return (
                      <div 
                        key={logo.id} 
                        className={`${styles.logoGridItem} ${formData.partner_logo_url === logo.url ? styles.logoGridItemActive : ''}`}
                        onClick={() => handleLogoSelect(logo.url)}
                      >
                        <div className={styles.logoImgWrapper}>
                          <img src={logo.url} alt={logo.name} />
                          {formData.partner_logo_url === logo.url && (
                            <div className={styles.logoCheckmark}>
                              <IconCheck size={16} color="white" />
                            </div>
                          )}
                        </div>
                        <div className={styles.logoItemFooter}>
                          <span className={styles.logoItemName}>{logo.name}</span>
                          <button 
                            type="button" 
                            className={styles.logoStarBtn}
                            onClick={(e) => toggleFavoriteLogo(e, logo.id)}
                          >
                            {isFav ? <IconStarFilled size={18} color="#F1C40F" /> : <IconStar size={18} color="#DDDDDD" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeLogoTab === 'custom' && (
                <div className={styles.logoCustomArea}>
                  <div className={styles.logoCustomGuide}>
                    <p>등록 가이드</p>
                    <ul>
                      <li>확장자: png, jpg만 가능</li>
                      <li>용량: 2MB 이하</li>
                      <li>배경이 투명한 로고 사용을 권장합니다</li>
                    </ul>
                  </div>
                  <button type="button" className={styles.fileUploadBtnFull} onClick={handleFileAttach}>
                    <IconUpload size={20} />
                    <span>이미지 업로드</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg"
                    className={styles.photoHiddenInput}
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. 근조화환 받지 않기 */}
      <div className={styles.optionRow}>
        <div className={styles.optionInfo}>
          <div className={styles.optionLabel}>근조화환 받지 않기</div>
          <div className={styles.optionHint}>
            <em>*</em>무빈소일 경우 참고해주세요
          </div>
        </div>
        <Toggle
          checked={formData.hide_flower_order}
          onChange={(val) => onChange('hide_flower_order', val)}
        />
      </div>

      {/* 3. 조문객 안내 말씀 */}
      <div className={styles.optionRow}>
        <div className={styles.optionInfo}>
          <div className={styles.optionLabel}>조문객 안내 말씀</div>
          {formData.show_message && (
            <div className={styles.optionExpand}>
              <textarea
                className={styles.optionTextarea}
                placeholder="뜻밖의 비보에 슬픈 마음을 전합니다. 고인의 명복을 빌며, 유족에게 위로의 말씀을 전합니다."
                value={formData.message}
                onChange={(e) => onChange('message', e.target.value)}
              />
            </div>
          )}
        </div>
        <Toggle
          checked={formData.show_message}
          onChange={(val) => onChange('show_message', val)}
        />
      </div>

      {/* 4. 사망 표기 용어 */}
      <div className={styles.optionRow}>
        <div className={styles.optionInfo}>
          <div className={styles.optionLabel}>사망 표기 용어</div>
          {formData.death_term && (
            <div className={styles.optionExpand}>
              <select
                className={styles.optionSelect}
                value={formData.death_term}
                onChange={(e) => onChange('death_term', e.target.value)}
              >
                {DEATH_TERMS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <Toggle
          checked={!!formData.death_term}
          onChange={(val) => onChange('death_term', val ? '별세' : '')}
        />
      </div>

      {/* 5. 답례 메세지 자동 발송 */}
      <div className={styles.optionRow}>
        <div className={styles.optionInfo}>
          <div className={styles.optionLabel}>답례 메세지 자동 발송</div>
          <div className={styles.optionHint}>
            <em>*</em>발인 당일 오전 9시에 자동 발송됩니다
          </div>
        </div>
        <Toggle
          checked={formData.auto_reply}
          onChange={(val) => onChange('auto_reply', val)}
        />
      </div>
    </section>
  );
}
