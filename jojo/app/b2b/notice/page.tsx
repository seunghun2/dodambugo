'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { B2BIcon } from '@/components/b2b/B2BIcon';
import styles from './notice.module.css';

interface B2BNotice {
  id: string;
  title: string;
  content: string;
  is_fixed: boolean;
  created_at: string;
  updated_at: string;
}

function B2BNoticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams ? searchParams.get('id') : null;

  const [notices, setNotices] = useState<B2BNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  // 공지사항 가져오기
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

  // 대시보드 등에서 특정 공지를 선택해 들어온 경우 자동 오픈 및 스크롤 포커스
  useEffect(() => {
    if (targetId && notices.length > 0) {
      setOpenIds(new Set([targetId]));
      setTimeout(() => {
        const el = document.getElementById(`notice-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [targetId, notices]);

  // 아코디언 토글
  const toggleNotice = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}.${m}.${d}`;
    } catch {
      return dateStr;
    }
  };

  // 하이브리드 공지사항 렌더러 (위지윅 HTML & 레거시 일반 텍스트 대응)
  const renderNoticeContent = (content: string) => {
    if (!content) return null;
    
    // HTML 태그가 아예 없는 일반 텍스트인 경우 (레거시 대응)
    if (!/<[a-z][\s\S]*>/i.test(content)) {
      const sanitized = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br />');
      return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
    }

    // 위지윅 HTML 리치 텍스트 데이터 렌더링
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  return (
    <div className={styles.page}>
      {/* 상단 통합 고정 헤더 */}
      <div className={styles.fixedHeaderContainer}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push('/b2b/dashboard')}>
            <B2BIcon name="chevron-left" size={24} />
          </button>
          <span className={styles.headerTitle}>공지사항</span>
          <div className={styles.headerRightPlaceholder} />
        </header>
      </div>

      <div className={styles.container}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>공지사항 목록을 불러오는 중입니다...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className={styles.emptyState}>등록된 공지사항이 없습니다.</div>
        ) : (
          <div className={styles.noticeList}>
            {notices.map((item) => {
              const isOpen = openIds.has(item.id);

              return (
                <div key={item.id} id={`notice-${item.id}`} className={styles.noticeWrapper}>
                  {/* 클릭 가능한 헤더 행 */}
                  <div
                    className={styles.noticeItemHeader}
                    onClick={() => toggleNotice(item.id)}
                  >
                    <div className={styles.noticeMain}>
                      <div className={styles.titleRow}>
                        {item.is_fixed && <span className={styles.fixedBadge}>공지</span>}
                        <span className={styles.noticeTitle}>{item.title}</span>
                      </div>
                      <span className={styles.noticeDate}>{formatDate(item.created_at)}</span>
                    </div>
                    <span className={`${styles.arrowIcon} ${isOpen ? styles.arrowIconActive : ''}`}>
                      <B2BIcon name="chevron-right" size={20} />
                    </span>
                  </div>

                  {/* 아코디언 본문 패널 */}
                  <div className={`${styles.noticeContentPanel} ${isOpen ? styles.noticeContentPanelActive : ''}`}>
                    <div className={styles.noticeContent}>
                      {renderNoticeContent(item.content)}
                    </div>
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

export default function B2BNoticePage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.fixedHeaderContainer}>
          <header className={styles.header}>
            <div className={styles.backBtn} />
            <span className={styles.headerTitle}>공지사항</span>
            <div className={styles.headerRightPlaceholder} />
          </header>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>공지사항 목록을 불러오는 중입니다...</p>
        </div>
      </div>
    }>
      <B2BNoticePageContent />
    </Suspense>
  );
}
