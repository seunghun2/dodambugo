'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SideMenu from '@/components/SideMenu';

export default function HomePage() {
  const router = useRouter();
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTemplateId, setDraftTemplateId] = useState<string | null>(null);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  useEffect(() => {
    // 템플릿별 임시저장 확인
    const templates = ['basic', 'simple', 'ribbon', 'border', 'flower'];
    for (const template of templates) {
      const draft = localStorage.getItem(`bugo_draft_${template}`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          const savedAt = new Date(parsed.savedAt);
          const now = new Date();
          const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

          if (hoursDiff < 24) {
            setHasDraft(true);
            setDraftTemplateId(template);
            break;
          }
        } catch (e) { }
      }
    }

    // 통계 애니메이션 - easeOutQuad
    const animateStats = () => {
      const statNumbers = document.querySelectorAll('.stats-card .stat-number[data-count]');
      statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count') || '0');
        const suffix = stat.getAttribute('data-suffix') || '건';
        const duration = 1500; // 1.5초
        const startTime = performance.now();

        const easeOutQuad = (t: number) => t * (2 - t);

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutQuad(progress);
          const currentValue = Math.floor(easedProgress * target);

          if (stat.textContent !== null) {
            stat.textContent = currentValue.toLocaleString() + suffix;
          }

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      });
    };

    // 페이지 로드 시 바로 애니메이션 시작
    setTimeout(animateStats, 300);
  }, []);

  const checkDraftBeforeCreate = () => {
    if (hasDraft && draftTemplateId) {
      setDraftModalOpen(true);
    } else {
      router.push('/create');
    }
  };

  const continueDraft = () => {
    if (draftTemplateId) {
      router.push(`/create/${draftTemplateId}`);
    }
    setDraftModalOpen(false);
  };

  const discardDraft = () => {
    if (draftTemplateId) {
      localStorage.removeItem(`bugo_draft_${draftTemplateId}`);
    }
    setDraftModalOpen(false);
    setHasDraft(false);
    setDraftTemplateId(null);
    router.push('/create');
  };

  const openSideMenu = () => setSideMenuOpen(true);
  const closeSideMenu = () => setSideMenuOpen(false);

  const showTemplatePreview = (template: string) => {
    // 템플릿 미리보기 모달
    alert(`${template} 템플릿 미리보기 준비 중`);
  };

  return (
    <>
      {/* Navigation - 예지부고 스타일 */}
      <nav className="nav" id="nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">도담부고</Link>
          <ul className="nav-menu" id="navMenu">
            <li><Link href="/search" className="nav-link">부고검색</Link></li>
            <li><Link href="/faq" className="nav-link">자주묻는 질문</Link></li>
          </ul>
          <div className="nav-actions">
            <button className="nav-cta" onClick={checkDraftBeforeCreate}>부고장 만들기</button>
            <button className="nav-toggle" onClick={openSideMenu}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Side Menu - 공통 컴포넌트 */}
      <SideMenu isOpen={sideMenuOpen} onClose={closeSideMenu} />

      {/* Hero Section - KAKAOBUGO 스타일 */}
      <section className="hero" id="home">
        <div className="hero-content">
          {/* 통계 카드 - 미니멀 */}
          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-label">누적 부고장</div>
              <div className="stat-number" data-count="15149" data-suffix="">0</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-label">만족도</div>
              <div className="stat-number" data-count="99" data-suffix="%">0</div>
            </div>
          </div>

          {/* 히어로 이미지 */}
          <div className="hero-image">
            <img src="/images/hero-image.png" alt="도담부고" />
          </div>

          {/* 두 개 버튼 */}
          <div className="action-buttons">
            <button className="action-btn primary" onClick={checkDraftBeforeCreate}>
              <span className="material-symbols-outlined">edit_note</span>
              <span>부고장 만들기</span>
            </button>
            <button className="action-btn secondary" onClick={() => router.push('/search')}>
              <span className="material-symbols-outlined">search</span>
              <span>부고 검색</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">왜 도담부고일까요?</h2>
            <p className="section-subtitle">다른 부고 서비스와는 다른 특별함</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div className="feature-text">
                <h3 className="feature-title">3분 만에 완성</h3>
                <p className="feature-description">복잡한 과정 없이 간단한 정보 입력만으로 세련된 부고장이 완성됩니다.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="feature-text">
                <h3 className="feature-title">완전 무료</h3>
                <p className="feature-description">작성부터 공유까지 모든 기능을 완전히 무료로 사용하실 수 있습니다.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span className="material-symbols-outlined">palette</span>
              </div>
              <div className="feature-text">
                <h3 className="feature-title">품격있는 디자인</h3>
                <p className="feature-description">고인의 품격을 지키는 세련되고 정중한 디자인 템플릿을 제공합니다.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span className="material-symbols-outlined">block</span>
              </div>
              <div className="feature-text">
                <h3 className="feature-title">광고 없음</h3>
                <p className="feature-description">부고장 어디에도 광고나 불필요한 링크가 없습니다.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span className="material-symbols-outlined">person_off</span>
              </div>
              <div className="feature-text">
                <h3 className="feature-title">회원가입 불필요</h3>
                <p className="feature-description">별도의 회원가입이나 앱 설치 없이 바로 사용 가능합니다.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span className="material-symbols-outlined">share</span>
              </div>
              <div className="feature-text">
                <h3 className="feature-title">쉬운 공유</h3>
                <p className="feature-description">카카오톡, 문자 등으로 한 번에 간편하게 공유할 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="faq" id="faq">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">자주 묻는 질문</h2>
          </div>
          <div className="faq-list">
            <div className={`faq-item ${openFaqs.has(0) ? 'active' : ''}`} onClick={() => toggleFaq(0)}>
              <div className="faq-question">
                <span>정말 무료인가요?</span>
                <span className="faq-icon">{openFaqs.has(0) ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                네, 도담부고의 모든 기능은 완전히 무료입니다. 숨겨진 비용이나 유료 업그레이드도 없습니다.
              </div>
            </div>
            <div className={`faq-item ${openFaqs.has(1) ? 'active' : ''}`} onClick={() => toggleFaq(1)}>
              <div className="faq-question">
                <span>부고장은 얼마나 유지되나요?</span>
                <span className="faq-icon">{openFaqs.has(1) ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                생성된 부고장은 영구적으로 유지됩니다. 언제든지 링크를 통해 조회할 수 있습니다.
              </div>
            </div>
            <div className={`faq-item ${openFaqs.has(2) ? 'active' : ''}`} onClick={() => toggleFaq(2)}>
              <div className="faq-question">
                <span>수정은 가능한가요?</span>
                <span className="faq-icon">{openFaqs.has(2) ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                네, 작성 시 입력한 비밀번호(휴대번호 뒷자리)로 언제든지 수정하실 수 있습니다.
              </div>
            </div>
            <div className={`faq-item ${openFaqs.has(3) ? 'active' : ''}`} onClick={() => toggleFaq(3)}>
              <div className="faq-question">
                <span>개인정보는 안전한가요?</span>
                <span className="faq-icon">{openFaqs.has(3) ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                입력하신 정보는 부고장 표시 목적으로만 사용되며, 별도로 수집하거나 제3자에게 제공하지 않습니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">도담부고</div>
            <div className="footer-links-horizontal">
              <Link href="/terms">이용약관</Link>
              <span className="footer-separator">|</span>
              <Link href="/privacy">개인정보처리방침</Link>
              <span className="footer-separator">|</span>
              <Link href="/contact">제휴/문의</Link>
            </div>
            <div className="footer-info">
              <p>부산 북구 | 대표: 김미연 | 사업자 212-12-88198</p>
              <p>통신판매 제 2024-서울강서-1938</p>
              <p>Copyright dodambugo Corp All right reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* 임시저장 확인 모달 */}
      {draftModalOpen && (
        <div className="modal-overlay" onClick={() => setDraftModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>임시저장된 정보</h3>
            <p>임시저장된 정보가 있습니다.<br />계속 작성하시겠습니까?</p>
            <div className="modal-buttons">
              <button className="modal-btn secondary" onClick={discardDraft}>아니오</button>
              <button className="modal-btn primary" onClick={continueDraft}>예</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
