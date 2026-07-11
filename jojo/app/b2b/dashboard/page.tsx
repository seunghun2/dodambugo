'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { registerPushNotifications } from '@/lib/push-notifications';

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
  const [notices, setNotices] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 데이터 로딩
  const fetchData = useCallback(async () => {
    let token = localStorage.getItem('b2b_token');
    let userData = localStorage.getItem('b2b_user');

    // localStorage에 토큰이 없으면 쿠키 기반 인증 확인 (iOS WebView 대응)
    if (!token || !userData) {
      try {
        const authRes = await fetch('/api/b2b/auth', { credentials: 'include' });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.token && authData.user) {
            // 쿠키에서 인증 성공 → localStorage 복원
            token = authData.token;
            userData = JSON.stringify(authData.user);
            localStorage.setItem('b2b_token', token!);
            localStorage.setItem('b2b_user', userData!);
          }
        }
      } catch {
        // 쿠키 인증도 실패
      }
    }

    if (!token || !userData) {
      router.push('/b2b/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // 푸시 알림 등록 (네이티브 앱에서만 동작, Next.js 라우터 주입)
    registerPushNotifications(parsedUser.id, router);

    // 앱 기동 시(Cold Start) 대기 중이던 푸시 클릭 라우팅 처리
    if (typeof window !== 'undefined' && (window as any).__pendingPushUrl) {
      const pendingUrl = (window as any).__pendingPushUrl;
      (window as any).__pendingPushUrl = null; // 처리 완료 후 비우기
      console.log('[Push] 펜딩되었던 푸시 라우팅 실행:', pendingUrl);
      router.push(pendingUrl);
    }

    // 최신 정보 DB에서 동기화
    try {
      const res = await fetch('/api/b2b/me', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('b2b_user', JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.error('사용자 정보 실시간 동기화 실패:', err);
    }
  }, [router]);

  // 공지사항 로드
  const fetchNotices = useCallback(async () => {
    try {
      const res = await fetch('/api/b2b/notices');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notices) {
          setNotices(data.notices.slice(0, 2));
        }
      }
    } catch (err) {
      console.error('공지사항 로드 실패:', err);
    }
  }, []);

  // 안읽은 알림 카운트 로드
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('b2b_token');
      const res = await fetch('/api/b2b/notifications/unread-count', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('안읽은 알림 카운트 로드 실패:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchNotices();
    fetchUnreadCount();
  }, [fetchData, fetchNotices, fetchUnreadCount]);

  const copyCode = () => {
    if (user) {
      navigator.clipboard.writeText(user.my_referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareCode = async () => {
    if (!user) return;
    const text = `[부고온 파트너] ${user.owner_name}님이 추천 코드를 보냈습니다.\n회원가입 시 추천 코드 [${user.my_referral_code}]를 입력해 주세요.\n\n파트너 앱 다운로드: https://bugoon.co.kr/download/partner`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '부고온 파트너 추천',
          text: text,
        });
      } catch (err: any) {
        // 사용자가 단순히 공유창을 닫은 경우(AbortError)는 에러 처리 및 SMS 이동을 하지 않고 조용히 리턴합니다.
        if (err?.name === 'AbortError') {
          return;
        }
        console.error('공유 실패:', err);
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
      }
    } else {
      window.location.href = `sms:?body=${encodeURIComponent(text)}`;
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  if (!user) return null;

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <img src="/images/splash/logo.png" alt="부고온 파트너" className={styles.headerLogo} />
        <button className={styles.headerBtn} onClick={() => router.push('/b2b/notifications')} style={{ position: 'relative' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              borderRadius: '10px',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              width: 'auto',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              border: '2px solid #ffffff',
              boxSizing: 'border-box'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* CTA 배너 — 부고장 만들기 */}
      <section className={styles.ctaBanner} onClick={() => router.push('/b2b/create')}>
        <div className={styles.ctaText}>
          <h2 className={styles.ctaTitle}>부고장 만들기</h2>
          <p className={styles.ctaDesc}>
            장례식장, 고인, 상주 정보를{"\n"}등록해 주세요.
          </p>
        </div>
        <div className={styles.ctaIcon}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </div>
      </section>

      {/* 부고장 관리 카드 */}
      <section className={styles.section}>
        <div className={styles.card} onClick={() => router.push('/b2b/manage')}>
          <div className={styles.cardLeft}>
            <h3 className={styles.cardTitle}>부고장 관리</h3>
            <p className={styles.cardDesc}>
              작성한 부고장을 확인하고{"\n"}수정 또는 삭제할 수 있습니다.
            </p>
          </div>
          <div className={styles.cardIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <circle cx="11.5" cy="14.5" r="2.5"></circle>
              <line x1="13.3" y1="16.3" x2="16" y2="19"></line>
            </svg>
          </div>
        </div>
      </section>

      {/* 3열 기능 카드 */}
      <section className={styles.section}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard} onClick={() => router.push('/b2b/inquiry')}>
            <span className={styles.featureLabel}>1:1{"\n"}문의하기</span>
            <div className={styles.featureIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
          <div className={styles.featureCard} onClick={() => router.push('/b2b/ritual')}>
            <span className={styles.featureLabel}>위패/축문{"\n"}지방</span>
            <div className={styles.featureIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
          </div>
          <div className={styles.featureCard} onClick={() => router.push('/b2b/manage')}>
            <span className={styles.featureLabel}>답례문{"\n"}보내기</span>
            <div className={styles.featureIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 잔액 요약 */}
      <section className={styles.section}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceLabel}>적립 예정 금액</span>
          {balanceVisible ? (
            <div className={styles.balanceActiveRow}>
              <span className={styles.balanceAmount} onClick={() => router.push('/b2b/wallet')}>
                {fmt(user.balance || 0)}원
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle', opacity: 0.7 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
              <button className={styles.hideBtn} onClick={(e) => { e.stopPropagation(); setBalanceVisible(false); }}>
                가리기
              </button>
            </div>
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
          <div className={styles.btnGroup}>
            <button className={styles.copyBtn} onClick={copyCode}>
              {copied ? '복사 완료' : '복사'}
            </button>
            <button className={styles.shareBtn} onClick={shareCode}>
              공유
            </button>
          </div>
        </div>
      </section>

      {/* 공지사항 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>공지사항</h3>
          <button className={styles.moreBtn} onClick={() => router.push('/b2b/notice')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <div className={styles.noticeCard}>
          {notices.length > 0 ? (
            notices.map((notice) => {
              const noticeDate = notice.created_at
                ? new Date(notice.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }).replace(/\. /g, '-').replace(/\./, '')
                : '';
              return (
                <div 
                  key={notice.id} 
                  className={styles.noticeItem}
                  onClick={() => router.push(`/b2b/notice?id=${notice.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={styles.noticeBadge}>공지</span>
                  <span className={styles.noticeText}>{notice.title}</span>
                  <span className={styles.noticeDate}>{noticeDate}</span>
                </div>
              );
            })
          ) : (
            <div className={styles.noticeItem}>
              <span className={styles.noticeText}>등록된 공지사항이 없습니다.</span>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
