'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconChevronRight, IconBell, IconFilePlus, IconFileSearch,
  IconFlower, IconMail, IconWallet, IconUsers
} from '@tabler/icons-react';
import { BottomTabBar } from '@/components/b2b/BottomTabBar';
import styles from './dashboard.module.css';

interface User {
  id: string;
  phone: string;
  company_name: string;
  owner_name: string;
  my_referral_code: string;
  balance: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('b2b_token');
    const userData = localStorage.getItem('b2b_user');
    if (!token || !userData) {
      router.push('/b2b/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const copyCode = () => {
    if (user) {
      navigator.clipboard.writeText(user.my_referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  if (!user) return null;

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <span className={styles.headerTitle}>마음부고 파트너</span>
        <button className={styles.headerBtn} onClick={() => {}}>
          <IconBell size={20} stroke={1.5} />
        </button>
      </header>

      {/* CTA 배너 — 부고장 만들기 */}
      <section className={styles.ctaBanner} onClick={() => router.push('/b2b/create')}>
        <div className={styles.ctaText}>
          <h2 className={styles.ctaTitle}>부고장 만들기</h2>
          <p className={styles.ctaDesc}>
            장례식장, 고인, 상주 정보를{'\n'}등록해 주세요.
          </p>
        </div>
        <div className={styles.ctaIcon}>
          <IconFilePlus size={30} stroke={1.8} />
        </div>
      </section>

      {/* 부고장 관리 카드 */}
      <section className={styles.section}>
        <div className={styles.card} onClick={() => {}}>
          <div className={styles.cardLeft}>
            <h3 className={styles.cardTitle}>부고장 관리</h3>
            <p className={styles.cardDesc}>
              작성한 부고장을 확인하고{'\n'}수정 또는 삭제할 수 있습니다.
            </p>
          </div>
          <div className={styles.cardIcon}>
            <IconFileSearch size={26} stroke={1.8} />
          </div>
        </div>
      </section>

      {/* 3열 기능 카드 */}
      <section className={styles.section}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard} onClick={() => {}}>
            <span className={styles.featureLabel}>상주별{'\n'}부고장 보기</span>
            <div className={styles.featureIcon}>
              <IconUsers size={22} stroke={1.8} />
            </div>
          </div>
          <div className={styles.featureCard} onClick={() => router.push('/b2b/wallet')}>
            <span className={styles.featureLabel}>화환{'\n'}보내기</span>
            <div className={styles.featureIcon}>
              <IconFlower size={22} stroke={1.8} />
            </div>
          </div>
          <div className={styles.featureCard} onClick={() => {}}>
            <span className={styles.featureLabel}>답례문{'\n'}보내기</span>
            <div className={styles.featureIcon}>
              <IconMail size={22} stroke={1.8} />
            </div>
          </div>
        </div>
      </section>

      {/* 잔액 요약 */}
      <section className={styles.section}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceLabel}>적립 예정 금액</span>
          {balanceVisible ? (
            <span className={styles.balanceAmount}>{fmt(user.balance || 0)}원</span>
          ) : (
            <button className={styles.inquiryBtn} onClick={() => setBalanceVisible(true)}>
              조회하기
            </button>
          )}
        </div>
      </section>

      {/* 추천 코드 */}
      <section className={styles.section}>
        <div className={styles.referralRow}>
          <div>
            <span className={styles.referralLabel}>나의 추천 코드</span>
            <span className={styles.referralCode}>{user.my_referral_code}</span>
          </div>
          <button className={styles.copyBtn} onClick={copyCode}>
            {copied ? '복사 완료' : '복사'}
          </button>
        </div>
      </section>

      {/* 공지사항 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>공지사항</h3>
          <button className={styles.moreBtn}>
            <IconChevronRight size={18} />
          </button>
        </div>
        <div className={styles.noticeCard}>
          <div className={styles.noticeItem}>
            <span className={styles.noticeBadge}>공지</span>
            <span className={styles.noticeText}>답례메시지 자동 발송 시간 변경 안내</span>
            <span className={styles.noticeDate}>2026-06-15</span>
          </div>
          <div className={styles.noticeItem}>
            <span className={styles.noticeBadge}>공지</span>
            <span className={styles.noticeText}>화환 판매금액 설정 기능 추가 안내</span>
            <span className={styles.noticeDate}>2026-05-22</span>
          </div>
        </div>
      </section>

      <BottomTabBar />
    </div>
  );
}

