'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { IconChevronLeft } from '@tabler/icons-react';
import Image from 'next/image';
import styles from './complete.module.css';

interface MournerState {
  relationship: string;
  name: string;
  contact: string;
  bank?: string;
  accountHolder?: string;
  accountNumber?: string;
  send: boolean;
  accountDisplay: 'mine' | 'all' | 'none';
}

interface BugoData {
  bugo_number: string;
  deceased_name: string;
  funeral_home?: string;
  room_number?: string;
  funeral_date?: string;
  funeral_time?: string;
  address?: string;
  mourners?: string;
}

export default function B2BCompletePage() {
  const params = useParams();
  const router = useRouter();
  const [bugo, setBugo] = useState<BugoData | null>(null);
  const [mourners, setMourners] = useState<MournerState[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // 조문객에게 공유할 URL: bugoon.maeumbugo.co.kr/view/{번호} (b2b 경로 제외)
  const bugoUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const hostname = window.location.hostname;
    const domain = hostname.includes('maeumbugo.co.kr')
      ? 'https://bugoon.maeumbugo.co.kr'
      : window.location.origin;
    return `${domain}/view/${params.bugoNumber}`;
  }, [params.bugoNumber]);

  // DB에서 생성된 부고 데이터 및 상주 목록 조회
  useEffect(() => {
    const fetchBugo = async () => {
      try {
        const { data, error } = await supabase
          .from('bugo')
          .select('bugo_number, deceased_name, funeral_home, room_number, funeral_date, funeral_time, address, mourners')
          .eq('bugo_number', params.bugoNumber)
          .single();

        if (error) throw error;
        setBugo(data);

        // 상주 목록 파싱 및 상태 초기화
        if (data.mourners) {
          const parsedMourners = typeof data.mourners === 'string'
            ? JSON.parse(data.mourners)
            : data.mourners;

          if (Array.isArray(parsedMourners)) {
            // 연락처(contact)가 등록되어 있는 상주만 발송 목록 대상에 포함
            const validMourners = parsedMourners.filter((m: any) => m.name && m.contact && m.contact.trim() !== '');
            const mapped = validMourners.map((m: any) => ({
              relationship: m.relationship || '',
              name: m.name || '',
              contact: m.contact || '',
              bank: m.bank || '',
              accountHolder: m.accountHolder || m.account_holder || '',
              accountNumber: m.accountNumber || m.account_number || '',
              send: m.send !== undefined ? m.send : true,
              accountDisplay: m.accountDisplay || 'mine',
            }));
            setMourners(mapped);
          }
        }
      } catch (err) {
        console.error('부고 데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.bugoNumber) {
      fetchBugo();
    }
  }, [params.bugoNumber]);

  // 토스트 메시지 출력 제어
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // 상주별 개별 부고장 URL 생성
  const getMournerUrl = (index: number) => {
    if (typeof window === 'undefined') return '';
    const hostname = window.location.hostname;
    const domain = hostname.includes('maeumbugo.co.kr')
      ? 'https://bugoon.maeumbugo.co.kr'
      : window.location.origin;
    return `${domain}/view/${params.bugoNumber}?m=${index}`;
  };

  // URL 복사
  const copyUrl = async (url: string, name: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast(`${name}님 부고장 URL이 복사되었습니다.`);
    } catch {
      // 폴백
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`${name}님 부고장 URL이 복사되었습니다.`);
    }
  };

  // 발송 체크박스 토글
  const handleToggleSend = (index: number) => {
    setMourners(prev => prev.map((m, idx) => 
      idx === index ? { ...m, send: !m.send } : m
    ));
  };

  // 계좌 노출 옵션 변경
  const handleDisplayChange = (index: number, val: 'mine' | 'all' | 'none') => {
    setMourners(prev => prev.map((m, idx) => 
      idx === index ? { ...m, accountDisplay: val } : m
    ));
  };

  // 발송 실행 및 DB 저장
  const handleSend = async (type: 'sms' | 'alimtalk') => {
    if (sending) return;
    const sendTargets = mourners
      .map((m, originalIndex) => ({ ...m, originalIndex }))
      .filter(m => m.send && m.contact?.trim());
    if (sendTargets.length === 0) {
      alert('발송할 대상을 선택하거나 연락처를 올바르게 입력해주세요.');
      return;
    }

    setSending(true);

    try {
      // 1. 먼저 계좌 및 발송 변경 설정을 Supabase DB에 저장
      const { error: updateError } = await supabase
        .from('bugo')
        .update({
          mourners: JSON.stringify(mourners.map(m => ({
            relationship: m.relationship,
            name: m.name,
            contact: m.contact,
            bank: m.bank,
            accountHolder: m.accountHolder,
            accountNumber: m.accountNumber,
            send: m.send,
            accountDisplay: m.accountDisplay
          })))
        })
        .eq('bugo_number', params.bugoNumber);

      if (updateError) throw updateError;

      // 2. 서버 발송 API 호출
      const res = await fetch('/api/b2b/send-mourner-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bugo_number: params.bugoNumber,
          type,
          mourners: sendTargets,
          origin: window.location.origin,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        showToast(type === 'sms' ? '문자가 발송되었습니다.' : '알림톡이 발송되었습니다.');
      } else {
        throw new Error(resData.error || '발송 API 오류');
      }
    } catch (err) {
      console.error(err);
      alert('발송 처리에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  };

  // 부고장 미리보기 오픈 (화면 내부 팝업 모달)
  const handlePreview = () => {
    setShowViewModal(true);
  };

  if (loading) {
    return (
      <div className={styles.page} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className={styles.title}>데이터 로딩 중...</div>
      </div>
    );
  }

  if (!bugo) {
    return (
      <div className={styles.page} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className={styles.title} style={{ color: 'var(--b2b-error)' }}>부고장 정보를 찾을 수 없습니다.</div>
        <button className={styles.btnList} onClick={() => router.push('/b2b/dashboard')} style={{ marginTop: '20px', maxWidth: '200px' }}>
          대시보드로 이동
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 상단 닫기 헤더 (수정 페이지로 이동) */}
      <header className={styles.header}>
        <button className={styles.btnClose} onClick={() => router.push(`/b2b/create?edit=${params.bugoNumber}`)} title="수정하기">
          <IconChevronLeft size={24} stroke={2} />
          <span>수정하기</span>
        </button>
      </header>

      {/* 타이틀 및 미리보기 버튼 */}
      <div className={styles.titleSection}>
        <h1 className={styles.title}>
          발송여부와 계좌번호<br />
          노출 여부를 선택해주세요
        </h1>
        <button className={styles.btnPreview} onClick={handlePreview}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          부고장 미리보기
        </button>
      </div>

      {/* 상주 테이블 목록 */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.colSend}>발송</div>
          <div className={styles.colRel}>관계</div>
          <div className={styles.colName}>상주명</div>
          <div className={styles.colDisplay}>계좌 노출</div>
        </div>

        {mourners.map((m, index) => (
          <div className={styles.tableRow} key={index}>
            <div className={styles.colSend}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={m.send}
                onChange={() => handleToggleSend(index)}
              />
            </div>
            <div className={styles.colRel}>{m.relationship || '상주'}</div>
            <div className={styles.colName}>{m.name || '-'}</div>
            <div className={styles.colDisplay}>
              <select
                className={styles.select}
                value={m.accountDisplay}
                onChange={(e) => handleDisplayChange(index, e.target.value as any)}
              >
                <option value="mine">내 계좌만 노출</option>
                <option value="all">모든 계좌 노출</option>
                <option value="none">모든 계좌 노출안함</option>
              </select>
            </div>
          </div>
        ))}
      </div>



      {/* 발송 버튼 그룹 */}
      <div className={styles.sendButtonGroup}>
        <button className={styles.btnSendKakao} onClick={() => handleSend('alimtalk')} disabled={sending}>
          <img src="/images/icon-kakao.png" alt="카카오톡" className={styles.btnIconImg} />
          카카오톡보내기
        </button>
        <button className={styles.btnSendSms} onClick={() => handleSend('sms')} disabled={sending}>
          <img src="/images/icon-sms.png" alt="문자" className={styles.btnIconImg} />
          문자보내기
        </button>
      </div>

      {/* 최하단 홈으로 이동 버튼 */}
      <div className={styles.footerArea}>
        <button className={styles.btnList} onClick={() => router.push('/b2b/dashboard')}>
          홈으로
        </button>
      </div>

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}

      {/* 화면 내부 부고장 미리보기 모달 */}
      {showViewModal && (
        <div className={styles.viewModalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.viewModalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.viewModalHeader}>
              <span className={styles.viewModalTitle}>부고장 미리보기</span>
              <button className={styles.viewModalCloseBtn} onClick={() => setShowViewModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.viewModalBody}>
              <iframe
                src={`/view/${params.bugoNumber}`}
                className={styles.viewIframe}
                title="부고장 미리보기"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
