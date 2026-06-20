'use client';

import React, { useState, useRef, useCallback } from 'react';
import { IconPhoto, IconX } from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import styles from './sections.module.css';

interface Props {
  showPhoto: boolean;
  photoUrl: string;
  onToggle: (show: boolean) => void;
  onPhotoChange: (url: string) => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export default function PhotoSection({ showPhoto, photoUrl, onToggle, onPhotoChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 업로드 핸들러
  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        alert('파일 크기는 최대 15MB까지 가능합니다.');
        return;
      }

      setUploading(true);

      try {
        // 고유 파일명 생성
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = `portraits/${fileName}`;

        const { error } = await supabase.storage
          .from('bugo-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error);
          alert('사진 업로드에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        // public URL 가져오기
        const { data: urlData } = supabase.storage
          .from('bugo-photos')
          .getPublicUrl(filePath);

        onPhotoChange(urlData.publicUrl);
      } catch (err) {
        console.error('Upload error:', err);
        alert('사진 업로드에 실패했습니다.');
      } finally {
        setUploading(false);
      }
    },
    [onPhotoChange],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // input 초기화 (같은 파일 재선택 가능하도록)
      e.target.value = '';
    },
    [handleUpload],
  );

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = useCallback(async () => {
    if (!photoUrl) return;

    try {
      // URL에서 파일 경로 추출
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/bugo-photos/');
      if (pathParts[1]) {
        await supabase.storage.from('bugo-photos').remove([pathParts[1]]);
      }
    } catch {
      // 삭제 실패해도 UI는 초기화
    }

    onPhotoChange('');
  }, [photoUrl, onPhotoChange]);

  const handleToggle = (checked: boolean) => {
    onToggle(checked);
    if (!checked && photoUrl) {
      // 체크 해제 시 사진도 초기화
      onPhotoChange('');
    }
  };

  return (
    <section className={styles.section}>
      {/* 헤더: 영정사진 + 체크박스 */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>영정사진</h2>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={showPhoto}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          영정사진 추가
        </label>
      </div>

      {/* 안내문 */}
      <p className={styles.photoInfo}>
        <span className={styles.photoInfoIcon}>✓</span>
        <span>선택사항 영정사진을 추가하시면 모바일 부고장에서 영정사진이 보여집니다. (최대 15MB)</span>
      </p>

      {/* 업로드 영역 */}
      {showPhoto && (
        <>

          {/* 업로드 중 */}
          {uploading && (
            <div className={styles.uploadingOverlay}>
              <div className={styles.spinner} />
              <span className={styles.uploadingText}>사진을 업로드하고 있습니다...</span>
            </div>
          )}

          {/* 미리보기 */}
          {!uploading && photoUrl && (
            <div className={styles.photoPreview}>
              <img
                src={photoUrl}
                alt="영정사진 미리보기"
                className={styles.photoPreviewImg}
              />
              <button
                type="button"
                className={styles.photoDeleteBtn}
                onClick={handleDelete}
                title="사진 삭제"
              >
                <IconX size={16} />
              </button>
            </div>
          )}

          {/* 드롭존 */}
          {!uploading && !photoUrl && (
            <div className={styles.photoDropzone} onClick={handleDropzoneClick}>
              <div className={styles.photoDropzoneIcon}>
                <IconPhoto size={24} />
              </div>
              <span className={styles.photoDropzoneText}>사진을 선택해주세요</span>
              <span className={styles.photoDropzoneHint}>JPG, PNG 파일 (최대 15MB)</span>
            </div>
          )}

          {/* 숨겨진 파일 인풋 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.photoHiddenInput}
            onChange={handleFileChange}
          />
        </>
      )}
    </section>
  );
}
