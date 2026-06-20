'use client';

import { useRouter } from 'next/navigation';
import styles from './notice.module.css';
import { B2BIcon } from '@/components/b2b/B2BIcon';

interface NoticeItem {
  id: number;
  title: string;
  date: string;
  isFixed: boolean;
}

const noticeData: NoticeItem[] = [
  {
    id: 1,
    title: '[공지] 등급별 포인트 지급 누락 관련 안내',
    date: '2025/10/31',
    isFixed: true,
  },
  {
    id: 2,
    title: '화환 판매금액 설정 기능 추가 안내',
    date: '2025/05/22',
    isFixed: true,
  },
  {
    id: 3,
    title: '부고온 화환 수수료 안내',
    date: '2025/05/16',
    isFixed: true,
  },
  {
    id: 4,
    title: '[공지] 부고온 등급별 혜택 변경',
    date: '2025/06/17',
    isFixed: true,
  },
  {
    id: 5,
    title: '[공지] 빈소현황판 AI 분석 기능 안내',
    date: '2025/03/18',
    isFixed: true,
  },
  {
    id: 6,
    title: '[공지] PC버전 로그인 계정 생성 방법 안내',
    date: '2025/02/04',
    isFixed: true,
  },
  {
    id: 7,
    title: '[공지] 답례글 관련 안내',
    date: '2024/09/26',
    isFixed: false,
  },
  {
    id: 8,
    title: '[공지] 실시간 환급금 자동이체 시행 안내',
    date: '2024/11/20',
    isFixed: false,
  },
];

export default function B2BNoticePage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <B2BIcon name="chevron-left" size={24} />
        </button>
        <span className={styles.headerTitle}>공지사항</span>
        <button className={styles.menuBtn} onClick={() => alert('메뉴 기능이 준비 중입니다.')}>
          <B2BIcon name="menu" size={24} />
        </button>
      </header>

      <div className={styles.container}>
        <div className={styles.noticeList}>
          {noticeData.map((item) => (
            <div
              key={item.id}
              className={styles.noticeItem}
              onClick={() => alert('공지사항 상세 내용이 곧 준비됩니다.')}
            >
              <div className={styles.noticeMain}>
                <div className={styles.titleRow}>
                  {item.isFixed && <span className={styles.noticeBadge}>공지</span>}
                  <span className={styles.noticeTitle}>{item.title}</span>
                </div>
                <span className={styles.noticeDate}>{item.date}</span>
              </div>
              <span className={styles.arrowIcon}>
                <B2BIcon name="chevron-right" size={20} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
