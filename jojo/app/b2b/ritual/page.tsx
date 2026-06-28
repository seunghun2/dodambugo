'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './ritual.module.css';

/** 부고장 정보 타입 */
interface BugoItem {
  bugo_number: string;
  deceased_name: string;
  funeral_home?: string;
  room_number?: string;
  created_at: string;
  relationship?: string;
  mourner_name?: string;
  gender?: string;
  death_date?: string;
  death_time?: string;
  encoffin_date?: string;
  encoffin_time?: string;
  funeral_date?: string;
  funeral_time?: string;
  burial_place?: string;
  age?: number;
}

export default function RitualListPage() {
  const router = useRouter();
  const [bugoList, setBugoList] = useState<BugoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 로그인 확인 및 부고장 리스트 로드
  const fetchBugoList = useCallback(async () => {
    const token = localStorage.getItem('b2b_token');
    const userData = localStorage.getItem('b2b_user');
    if (!token || !userData) {
      router.push('/b2b/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      const { data, error } = await supabase
        .from('bugo')
        .select('bugo_number, deceased_name, funeral_home, room_number, created_at, relationship, mourner_name, gender, death_date, death_time, encoffin_date, encoffin_time, funeral_date, funeral_time, burial_place, age')
        .eq('b2b_user_id', parsedUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('부고장 조회 실패:', error);
        return;
      }

      setBugoList(data || []);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBugoList();
  }, [fetchBugoList]);

  // 날짜 포맷팅 (2026-06-28 → 6월 28일)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  // 시간 포맷팅 (14:00 → 오후 2시)
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const period = h < 12 ? '오전' : '오후';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return m ? `${period} ${hour}시 ${m}분` : `${period} ${hour}시`;
  };

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.headerTitle}>위패 / 축문 / 지방</span>
      </header>

      {/* 부고장 리스트 */}
      <section className={styles.section}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>부고장 목록 불러오는 중...</span>
          </div>
        ) : bugoList.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📄</span>
            <span className={styles.emptyText}>작성한 부고장이 없습니다.</span>
          </div>
        ) : (
          <div className={styles.bugoList}>
            {bugoList.map((bugo) => (
              <div
                key={bugo.bugo_number}
                className={styles.bugoCard}
                onClick={() => router.push(`/b2b/ritual/${bugo.bugo_number}`)}
              >
                <div className={styles.bugoInfo}>
                  <span className={styles.bugoDeceased}>
                    故 {bugo.deceased_name}
                    {bugo.age ? ` (향년 ${bugo.age}세)` : ''}
                  </span>
                  <span className={styles.bugoMeta}>
                    {bugo.funeral_home || '장례식장 미등록'}
                    {bugo.room_number ? ` · ${bugo.room_number}` : ''}
                  </span>
                  <div className={styles.bugoDetails}>
                    {bugo.encoffin_date && (
                      <span className={styles.bugoDetailItem}>
                        입관 {formatDate(bugo.encoffin_date)} {formatTime(bugo.encoffin_time)}
                      </span>
                    )}
                    {bugo.funeral_date && (
                      <span className={styles.bugoDetailItem}>
                        발인 {formatDate(bugo.funeral_date)} {formatTime(bugo.funeral_time)}
                      </span>
                    )}
                    {bugo.burial_place && (
                      <span className={styles.bugoDetailItem}>
                        장지 {bugo.burial_place}
                      </span>
                    )}
                  </div>
                  {bugo.mourner_name && (
                    <span className={styles.bugoMourner}>
                      상주 {bugo.mourner_name}
                    </span>
                  )}
                </div>
                <div className={styles.bugoArrow}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
