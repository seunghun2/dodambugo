'use client';

import React, { useRef } from 'react';
import { IconUpload } from '@tabler/icons-react';
import styles from './sections.module.css';

interface Props {
  formData: {
    partner_logo_url: string;
    no_wreath: boolean;
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
  { value: 'mute', label: '무트' },
  { value: 'custom', label: '기타' },
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

  const handleLogoSelect = (type: string) => {
    if (type === 'mute') {
      onChange('partner_logo_url', 'mute');
    } else {
      // "기타" 선택 시 — 현재 URL 유지 or 비워둠
      onChange('partner_logo_url', formData.partner_logo_url === 'mute' ? '' : formData.partner_logo_url);
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 임시: 로컬 URL 생성 (실제로는 Supabase Storage 업로드)
    const url = URL.createObjectURL(file);
    onChange('partner_logo_url', url);
  };

  const isLogoOn = !!formData.partner_logo_url;
  const isCustomLogo =
    formData.partner_logo_url && formData.partner_logo_url !== 'mute';

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>기타 옵션</h2>

      {/* 1. 상조 로고 */}
      <div className={styles.optionRow}>
        <div className={styles.optionInfo}>
          <div className={styles.optionLabel}>상조 로고</div>
          {isLogoOn && (
            <div className={styles.optionExpand}>
              <div className={styles.logoSelectRow}>
                {LOGO_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`${styles.logoOption} ${
                      (preset.value === 'mute' && formData.partner_logo_url === 'mute') ||
                      (preset.value === 'custom' && isCustomLogo)
                        ? styles.logoOptionActive
                        : ''
                    }`}
                    onClick={() => handleLogoSelect(preset.value)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {/* 기타 선택 시 파일 첨부 */}
              {isCustomLogo && (
                <>
                  <button
                    type="button"
                    className={styles.fileUploadBtn}
                    onClick={handleFileAttach}
                  >
                    <IconUpload size={16} />
                    파일 첨부
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.photoHiddenInput}
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>
          )}
        </div>
        <Toggle
          checked={isLogoOn}
          onChange={(val) => onChange('partner_logo_url', val ? 'mute' : '')}
        />
      </div>

      {/* 2. 근조화환 받지 않기 */}
      <div className={styles.optionRow}>
        <div className={styles.optionInfo}>
          <div className={styles.optionLabel}>근조화환 받지 않기</div>
          <div className={styles.optionHint}>
            <em>*</em>무빈소일 경우 참고해주세요
          </div>
        </div>
        <Toggle
          checked={formData.no_wreath}
          onChange={(val) => onChange('no_wreath', val)}
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
