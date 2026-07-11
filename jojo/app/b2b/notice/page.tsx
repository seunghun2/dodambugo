'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { B2BIcon } from '@/components/b2b/B2BIcon';
import styles from './notice.module.css';

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function B2BNoticePage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('b2b_token');
      const res = await fetch('/api/b2b/notifications', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.error('알림 목록 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const year = String(date.getFullYear()).slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <B2BIcon name="chevron-left" size={24} />
        </button>
        <span className={styles.headerTitle}>알림</span>
        <div className={styles.headerRightPlaceholder} />
      </header>

      <div className={styles.container}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>알림 목록을 불러오는 중입니다...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>수신된 알림 내역이 없습니다.</div>
        ) : (
          <div className={styles.noticeList}>
            {notifications.map((item) => (
              <div key={item.id} className={styles.noticeItem}>
                {/* 왼쪽 연한 종 아이콘 */}
                <div className={styles.bellIconWrapper}>
                  <B2BIcon name="bell" size={16} className={styles.bellIcon} />
                </div>
                
                {/* 중앙 텍스트 정보 */}
                <div className={styles.noticeMain}>
                  <span className={styles.noticeTitle}>{item.title}</span>
                  <span className={styles.noticeDesc}>{item.content}</span>
                </div>
                
                {/* 우측 상단 날짜 */}
                <span className={styles.noticeDate}>{formatDate(item.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
