'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { B2BIcon } from '@/components/b2b/B2BIcon';
import styles from './notice.module.css';

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function B2BNoticePage() {
  const router = useRouter();
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNoticeIds, setOpenNoticeIds] = useState<string[]>([]);

  const fetchNotices = useCallback(async () => {
    try {
      const res = await fetch('/api/b2b/notices');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notices) {
          setNotices(data.notices);
        }
      }
    } catch (err) {
      console.error('공지사항 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const toggleNotice = (id: string) => {
    if (openNoticeIds.includes(id)) {
      setOpenNoticeIds(openNoticeIds.filter(item => item !== id));
    } else {
      setOpenNoticeIds([...openNoticeIds, id]);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
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
        <span className={styles.headerTitle}>공지사항 (알림)</span>
        <div className={styles.headerRightPlaceholder} />
      </header>

      <div className={styles.container}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>공지사항을 불러오는 중입니다...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className={styles.emptyState}>등록된 공지사항이 없습니다.</div>
        ) : (
          <div className={styles.noticeList}>
            {notices.map((item) => {
              const isOpen = openNoticeIds.includes(item.id);
              return (
                <div key={item.id} className={styles.noticeWrapper}>
                  <div
                    className={`${styles.noticeItem} ${isOpen ? styles.noticeItemOpen : ''}`}
                    onClick={() => toggleNotice(item.id)}
                  >
                    <div className={styles.noticeMain}>
                      <div className={styles.titleRow}>
                        <span className={styles.noticeBadge}>공지</span>
                        <span className={styles.noticeTitle}>{item.title}</span>
                      </div>
                      <span className={styles.noticeDate}>{formatDate(item.created_at)}</span>
                    </div>
                    <span className={`${styles.arrowIcon} ${isOpen ? styles.arrowIconRotate : ''}`}>
                      <B2BIcon name="chevron-right" size={20} />
                    </span>
                  </div>
                  {isOpen && (
                    <div className={styles.noticeContent}>
                      <p>{item.content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
