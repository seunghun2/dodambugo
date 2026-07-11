'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { B2BIcon } from '@/components/b2b/B2BIcon';
import styles from './notice.module.css';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  content?: string; // 레거시 호환
  type?: string;
  data?: { url?: string } | null;
  is_read?: boolean;
  created_at: string;
}

// 알림 타입별 아이콘 매핑
const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  signup_approved: { icon: '🤝', color: '#f0fdf4' },
  new_funeral: { icon: '📋', color: '#eff6ff' },
  referral_signup: { icon: '🎉', color: '#fefce8' },
  flower_order: { icon: '🌸', color: '#fdf2f8' },
  flower_refund: { icon: '↩️', color: '#fef2f2' },
  flower_commission: { icon: '💰', color: '#fffbeb' },
  settlement: { icon: '💳', color: '#f0fdf4' },
  notice: { icon: '📢', color: '#eff6ff' },
  funeral_reminder: { icon: '⏰', color: '#fefce8' },
};

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

  // 알림 클릭 시 해당 페이지로 이동 + 읽음 처리
  const handleNotificationClick = async (item: NotificationItem) => {
    // 읽음 처리 (비동기, 에러 무시)
    if (!item.is_read) {
      const token = localStorage.getItem('b2b_token');
      fetch(`/api/b2b/notifications/${item.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      }).catch(() => {});
    }

    // data.url이 있으면 해당 페이지로 이동
    const url = item.data?.url;
    if (url) {
      router.push(url);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);

      if (minutes < 1) return '방금';
      if (minutes < 60) return `${minutes}분 전`;
      if (hours < 24) return `${hours}시간 전`;

      const year = String(date.getFullYear()).slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    } catch {
      return dateStr;
    }
  };

  const getTypeInfo = (type?: string) => {
    return TYPE_ICONS[type || ''] || { icon: '🔔', color: '#f8fafc' };
  };

  return (
    <div className={styles.page}>
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
            {notifications.map((item) => {
              const typeInfo = getTypeInfo(item.type);
              const hasLink = !!item.data?.url;

              return (
                <div
                  key={item.id}
                  className={styles.noticeItem}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    cursor: hasLink ? 'pointer' : 'default',
                    opacity: item.is_read ? 0.7 : 1,
                    backgroundColor: item.is_read ? '#fafafa' : '#ffffff',
                  }}
                >
                  {/* 타입별 아이콘 */}
                  <div
                    className={styles.bellIconWrapper}
                    style={{ backgroundColor: typeInfo.color }}
                  >
                    <span style={{ fontSize: '16px' }}>{typeInfo.icon}</span>
                  </div>

                  {/* 텍스트 */}
                  <div className={styles.noticeMain}>
                    <span className={styles.noticeTitle} style={{ fontWeight: item.is_read ? '500' : '700' }}>
                      {item.title}
                    </span>
                    <span className={styles.noticeDesc}>
                      {item.body || item.content}
                    </span>
                  </div>

                  {/* 날짜 + 이동 표시 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span className={styles.noticeDate}>{formatDate(item.created_at)}</span>
                    {hasLink && (
                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>›</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
