'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BottomTabBar } from '@/components/b2b/BottomTabBar';
import styles from './inquiry.module.css';

interface User {
  id: string;
  phone: string;
  company_name: string;
  owner_name: string;
}

interface InquiryItem {
  id: string;
  name: string;
  phone: string;
  company: string | null;
  email: string;
  inquiry_type: string;
  message: string;
  memo: string | null;
  created_at: string;
}

export default function B2BInquiryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  
  // 문의하기 폼 상태
  const [title, setTitle] = useState('');
  const [inquiryType, setInquiryType] = useState('');
  const [message, setMessage] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 문의내역 상태
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 유저 토큰 및 로그인 확인
  useEffect(() => {
    const token = localStorage.getItem('b2b_token');
    const userData = localStorage.getItem('b2b_user');
    if (!token || !userData) {
      router.push('/b2b/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  // 문의 내역 가져오기
  const fetchInquiries = useCallback(async () => {
    if (!user?.phone) return;
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('phone', user.phone)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('token')) {
          localStorage.removeItem('b2b_token');
          localStorage.removeItem('b2b_user');
          router.push('/b2b/login');
          return;
        }
        throw error;
      }
      setInquiries(data || []);
    } catch (err) {
      console.error('문의 내역 로드 실패:', err);
    } finally {
      setLoadingList(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (activeTab === 'list' && user) {
      fetchInquiries();
    }
  }, [activeTab, user, fetchInquiries]);

  // 문의 등록 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!inquiryType) {
      alert('문의 항목을 선택해주세요.');
      return;
    }
    if (!message.trim()) {
      alert('문의 내용을 입력해주세요.');
      return;
    }
    if (!agree) {
      alert('개인정보 수집 및 이용에 동의해야 문의를 등록할 수 있습니다.');
      return;
    }

    setSubmitting(true);
    try {
      // inquiries 테이블 스키마에 맞추어 데이터 insert
      // message 필드에 [제목] + 내용을 합성하여 넣거나, 혹은 별도 컬럼이 없으므로 message에 합쳐서 넣음
      const fullMessage = `[제목: ${title}]\n\n${message}`;

      const { error } = await supabase.from('inquiries').insert([
        {
          name: user.owner_name || 'B2B 파트너',
          phone: user.phone,
          company: user.company_name || null,
          email: '', // 비필수 정보
          inquiry_type: inquiryType,
          message: fullMessage,
        },
      ]);

      if (error) throw error;

      alert('문의가 정상적으로 등록되었습니다.');
      // 폼 초기화
      setTitle('');
      setInquiryType('');
      setMessage('');
      setAgree(false);
      // 문의내역 탭으로 이동
      setActiveTab('list');
    } catch (err) {
      console.error('문의 등록 실패:', err);
      alert('문의 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // 날짜 변환 YYYY/MM/DD HH:mm
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${y}/${m}/${d} ${hh}:${mm}`;
    } catch {
      return dateStr;
    }
  };

  // 제목 및 메시지 파싱 (inquiries message 컬럼에서 [제목] 추출)
  const parseInquiryContent = (fullText: string) => {
    const titleMatch = fullText.match(/^\[제목:\s*(.*?)\]/);
    if (titleMatch && titleMatch[1]) {
      const parsedTitle = titleMatch[1];
      const parsedMessage = fullText.replace(/^\[제목:\s*(.*?)\]\s*/, '');
      return { title: parsedTitle, message: parsedMessage };
    }
    return { title: '1:1 문의사항', message: fullText };
  };

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/b2b/dashboard')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className={styles.headerTitle}>1:1 문의</span>
        <button className={styles.menuBtn} onClick={() => router.push('/b2b/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </header>

      {/* 탭 헤더 */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'create' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('create')}
        >
          문의하기
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'list' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('list')}
        >
          문의내역
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className={styles.content}>
        {activeTab === 'create' ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* 자주하는 질문 바로가기 배너 */}
            <div className={styles.faqBanner} onClick={() => router.push('/b2b/faq')}>
              <p className={styles.faqBannerText}>
                많은 분들이 질문한 문의를 보면<br />더 빨리 알 수 있어요.
              </p>
              <button type="button" className={styles.faqLinkBtn}>자주하는 질문 보기</button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                문의 내용 <span className={styles.required}>*</span>
              </label>
              
              {/* 제목 입력 */}
              <div className={styles.inputContainer}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="제목입력"
                  maxLength={16}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <span className={styles.charCount}>{title.length}/16</span>
                {title && (
                  <button type="button" className={styles.clearInputBtn} onClick={() => setTitle('')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              {/* 항목 선택 dropdown */}
              <div className={styles.selectContainer}>
                <select
                  className={styles.select}
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                >
                  <option value="" disabled>항목선택</option>
                  <option value="서비스 문의">서비스 문의</option>
                  <option value="이용 문의">이용 문의</option>
                  <option value="정산 문의">정산 문의</option>
                  <option value="기타">기타</option>
                </select>
                <div className={styles.selectArrow}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E94A0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* 내용 입력 */}
              <textarea
                className={styles.textarea}
                placeholder="내용을 입력해주세요"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* 동의 체크박스 */}
            <div className={styles.agreeContainer} onClick={() => setAgree(!agree)}>
              <div className={`${styles.checkbox} ${agree ? styles.checkboxChecked : ''}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className={styles.agreeTextContainer}>
                <p className={styles.agreeTitle}>[필수] 개인정보 수집 및 이용 동의</p>
                <p className={styles.agreeDesc}>
                  수집된 정보는 고객문의 처리 및 제휴 관련 답변을 위해 사용되며, 전자상거래 법에 따라 3년간 보관 후 삭제됩니다.
                </p>
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || !title.trim() || !inquiryType || !message.trim() || !agree}
            >
              {submitting ? '등록 중...' : '문의등록'}
            </button>
          </form>
        ) : (
          <div className={styles.listContainer}>
            {loadingList ? (
              <div className={styles.loadingBox}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>문의 내역을 불러오고 있습니다</p>
              </div>
            ) : inquiries.length === 0 ? (
              <div className={styles.emptyBox}>
                등록된 1:1 문의 내역이 없습니다.
              </div>
            ) : (
              <div className={styles.accordionList}>
                {inquiries.map((item) => {
                  const { title: parsedTitle, message: parsedMessage } = parseInquiryContent(item.message);
                  const isDone = !!item.memo; // memo가 있으면 답변완료
                  const isExpanded = expandedId === item.id;

                  return (
                    <div key={item.id} className={styles.accordionItem}>
                      {/* 아코디언 헤더 */}
                      <div
                        className={styles.accordionHeader}
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      >
                        <div className={styles.headerInfo}>
                          <span className={`${styles.statusBadge} ${isDone ? styles.badgeDone : styles.badgeWait}`}>
                            {isDone ? '답변완료' : '답변대기'}
                          </span>
                          <span className={styles.itemTitle}>
                            [{item.inquiry_type}] {parsedTitle}
                          </span>
                        </div>
                        <div className={styles.headerRight}>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#8E94A0"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      {/* 아코디언 바디 */}
                      {isExpanded && (
                        <div className={styles.accordionBody}>
                          {/* 질문 내용 */}
                          <div className={styles.questionBox}>
                            <p className={styles.bodyMessage}>{parsedMessage}</p>
                            <span className={styles.bodyDate}>{formatDate(item.created_at)}</span>
                          </div>

                          {/* 답변 내용 */}
                          {isDone && (
                            <div className={styles.answerBox}>
                              <p className={styles.answerText}>
                                안녕하세요. {user?.owner_name || '상주'}님 부고온 파트너 지원팀입니다.<br /><br />
                                {item.memo ? item.memo.replace(/부고드림/g, '부고온').replace(/마음부고/g, '부고온') : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
}
