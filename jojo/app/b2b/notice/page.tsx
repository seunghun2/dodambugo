'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

export default function B2BNoticePage() {
  const router = useRouter();
  const [notices, setNotices] = useState<B2BNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [targetId, setTargetId] = useState<string | null>(null);

  // 클라이언트 마운트 후 URL 파라미터 파싱 (Next.js Hydration 락 차단)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get('id');
      if (idParam) {
        setTargetId(idParam);
      }
    }
  }, []);

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

  // 대시보드 등에서 특정 공지를 선택해 들어온 경우 자동 오픈
  useEffect(() => {
    if (targetId && notices.length > 0) {
      setOpenIds(new Set([targetId]));
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
        .replace(/\\n/g, '<br />') // 문자열 역슬래시 n 대응
        .replace(/\n/g, '<br />'); // 실제 개행 문자 대응
      return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
    }

    // 위지윅 HTML 리치 텍스트 데이터 렌더링
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  // 특정 공지 ID를 타고 상세로 온 경우 (단독 상세 뷰 렌더링)
  if (targetId && !loading) {
    const activeNotice = notices.find(item => item.id === targetId);

    return (
      <div className={styles.page}>
        <div className={styles.fixedHeaderContainer}>
          <header className={styles.header}>
            <button className={styles.backBtn} onClick={() => router.back()}>
              <B2BIcon name="chevron-left" size={24} />
            </button>
            <span className={styles.headerTitle}>공지사항 상세</span>
            <div className={styles.headerRightPlaceholder} />
          </header>
        </div>

        <div className={styles.container}>
          {activeNotice ? (
            <div className={styles.detailContainer}>
              <div className={styles.detailTitleRow}>
                {activeNotice.is_fixed && <span className={styles.fixedBadge} style={{ width: 'fit-content' }}>공지</span>}
                <h2 className={styles.detailTitle}>{activeNotice.title}</h2>
                <span className={styles.detailDate}>{formatDate(activeNotice.created_at)}</span>
              </div>
              <hr className={styles.detailDivider} />
              <div className={styles.detailContent}>
                {renderNoticeContent(activeNotice.content)}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>해당 공지사항을 찾을 수 없습니다.</div>
          )}
        </div>
      </div>
    );
  }

  // 쿼리 파라미터 id 가 없을 경우 (전체 아코디언 목록 뷰 렌더링)
  return (
    <div className={styles.page}>
      {/* 상단 통합 고정 헤더 */}
      <div className={styles.fixedHeaderContainer}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => {
            if (window.history.length > 1) router.back();
            else router.replace('/b2b/dashboard');
          }}>
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
