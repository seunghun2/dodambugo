'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { B2BIcon } from '@/components/b2b/B2BIcon';
import {
  IconUserCheck,
  IconFileText,
  IconGift,
  IconFlower,
  IconArrowBackUp,
  IconCoin,
  IconCreditCard,
  IconVolume2,
  IconClock,
  IconBell,
} from '@tabler/icons-react';
import styles from './notifications.module.css';

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

// 알림 타입별 아이콘 및 스타일 클래스 매핑 함수
const getTypeIconAndClass = (type?: string) => {
  switch (type) {
    case 'signup_approved':
      return { icon: <IconUserCheck size={16} />, className: styles.iconSignup };
    case 'new_funeral':
      return { icon: <IconFileText size={16} />, className: styles.iconFuneral };
    case 'referral_signup':
      return { icon: <IconGift size={16} />, className: styles.iconReferral };
    case 'flower_order':
    case 'flower_delivery_completed':
      return { icon: <IconFlower size={16} />, className: styles.iconFlower };
    case 'flower_refund':
      return { icon: <IconArrowBackUp size={16} />, className: styles.iconRefund };
    case 'flower_commission':
      return { icon: <IconCoin size={16} />, className: styles.iconCommission };
    case 'settlement':
      return { icon: <IconCreditCard size={16} />, className: styles.iconSettlement };
    case 'notice':
      return { icon: <IconVolume2 size={16} />, className: styles.iconNotice };
    case 'funeral_reminder':
      return { icon: <IconClock size={16} />, className: styles.iconReminder };
    default:
      return { icon: <IconBell size={16} />, className: styles.iconDefault };
  }
};


export default function B2BNotificationsPage() {
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
    // 1. 화면 상의 상태 즉시 비활성화(회색) 처리
    if (!item.is_read) {
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
      );

      // 서버에 비동기로 읽음 처리 전송
      const token = localStorage.getItem('b2b_token');
      fetch(`/api/b2b/notifications/${item.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      }).catch(() => {});
    }

    // 2. 알림 타입별 이동 처리 (1순위: data.url, 2순위: 수동 맵핑)
    let targetUrl = item.data?.url;

    if (!targetUrl) {
      switch (item.type) {
        case 'condolence_earned':
        case 'flower_commission':
        case 'flower_order':
        case 'flower_delivery_completed':
          targetUrl = '/b2b/wallet'; // 수당 및 정산(지갑) 페이지로 이동
          break;
        case 'notice':
          targetUrl = '/b2b/notice'; // 공지사항 상세 목록
          break;
        case 'referral_signup':
          targetUrl = '/b2b/settings'; // 추천인 조회가 가능한 마이페이지/설정
          break;
        case 'funeral_reminder':
          const alarmData = item.data as any;
          const bugoId = alarmData?.bugo_id || alarmData?.id;
          targetUrl = bugoId ? `/view/${bugoId}` : '/b2b/dashboard'; // 고인 부고장으로 이동
          break;
        case 'signup_approved':
        case 'new_funeral':
        default:
          targetUrl = undefined; // 가입 승인 및 신규 부고 알림은 이동 없이 꺼지기(비활성화)만 함
          break;
      }
    }

    // 3. 페이지 위치 이동
    if (targetUrl) {
      router.push(targetUrl);
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/b2b/dashboard')}>
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
              const typeInfo = getTypeIconAndClass(item.type);
              const hasLink = !!item.data?.url || !['signup_approved', 'new_funeral'].includes(item.type || '');

              // 인라인 스타일을 배제하고 className 조합
              const itemClassName = [
                styles.noticeItem,
                hasLink ? styles.noticeItemClickable : '',
                item.is_read ? styles.noticeItemRead : ''
              ].filter(Boolean).join(' ');

              const titleClassName = [
                styles.noticeTitle,
                item.is_read ? styles.noticeTitleRead : styles.noticeTitleUnread
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={item.id}
                  className={itemClassName}
                  onClick={() => handleNotificationClick(item)}
                >
                  {/* 타입별 아이콘 */}
                  <div className={`${styles.bellIconWrapper} ${typeInfo.className}`}>
                    {typeInfo.icon}
                  </div>

                  {/* 텍스트 */}
                  <div className={styles.noticeMain}>
                    <span className={titleClassName}>
                      {item.title}
                    </span>
                    <span className={styles.noticeDesc}>
                      {item.body || item.content}
                    </span>
                  </div>

                  {/* 날짜 */}
                  <span className={styles.noticeDate}>{formatDate(item.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

