'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [hasDraft, setHasDraft] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  useEffect(() => {
    // 임시저장 확인
    const draft = localStorage.getItem('bugo_draft');
    if (draft) {
      setHasDraft(true);
    }

    // 통계 애니메이션
    const animateStats = () => {
      const statNumbers = document.querySelectorAll('.stat-number[data-count]');
      statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count') || '0');
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          if (stat.textContent !== null) {
            stat.textContent = Math.floor(current).toLocaleString() + (target === 98 ? '%' : target === 3 ? '분' : '+');
          }
        }, 30);
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStats();
          observer.disconnect();
        }
      });
    });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
      observer.observe(heroStats);
    }
  }, []);

  const checkDraftBeforeCreate = () => {
    const draft = localStorage.getItem('bugo_draft');
    if (draft) {
      if (confirm('작성 중인 부고장이 있습니다. 이어서 작성하시겠습니까?')) {
        router.push('/create');
      } else {
        localStorage.removeItem('bugo_draft');
        router.push('/create');
      }
    } else {
      router.push('/create');
    }
  };

  const openSideMenu = () => setSideMenuOpen(true);
  const closeSideMenu = () => setSideMenuOpen(false);

  const showTemplatePreview = (template: string) => {
    // 템플릿 미리보기 모달
    alert(`${template} 템플릿 미리보기 준비 중`);
  };

  return (
    <>
      {/* Navigation */}
      <nav className="nav" id="nav">
        <div className="nav-container">
          <div className="nav-logo">도담부고</div>
          <ul className="nav-menu" id="navMenu">
            <li><a href="#home" className="nav-link">홈</a></li>
            <li><Link href="/search" className="nav-link">부고검색</Link></li>
            <li><a href="#templates" className="nav-link">템플릿</a></li>
            <li><a href="#guide" className="nav-link">이용안내</a></li>
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

      {/* Side Menu */}
      <div className={`side-menu ${sideMenuOpen ? 'active' : ''}`} id="sideMenu">
        <div className="side-menu-overlay" onClick={closeSideMenu}></div>
        <div className="side-menu-content">
          <div className="side-menu-header">
            <div className="side-menu-logo">도담부고</div>
            <button className="side-menu-close" onClick={closeSideMenu}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="side-menu-nav">
            <Link href="/create" className="side-menu-item">
              <span className="material-symbols-outlined">add_circle</span>
              <span>부고장 만들기</span>
            </Link>
            <Link href="/search" className="side-menu-item">
              <span className="material-symbols-outlined">search</span>
              <span>부고 검색</span>
            </Link>
            <a href="#faq" className="side-menu-item" onClick={closeSideMenu}>
              <span className="material-symbols-outlined">contact_support</span>
              <span>자주 묻는 질문</span>
            </a>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-badge">무료 · 광고없음 · 회원가입 없음</div>
          <h1 className="hero-title">
            품격있는<br />
            <span className="gradient-text">모바일 부고장</span>
          </h1>
          <p className="hero-subtitle">
            3분이면 완성되는 정중하고 세련된 부고장.<br />
            고인의 품격을 지키는 가장 쉬운 방법입니다.
          </p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={checkDraftBeforeCreate}>
              지금 무료로 만들기
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="btn-secondary" onClick={() => router.push('/search')}>부고 검색</button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number" data-count="50000">0</div>
              <div className="stat-label">누적 부고장</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number" data-count="98">0</div>
              <div className="stat-label">만족도</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number" data-count="3">0</div>
              <div className="stat-label">분만에 완성</div>
            </div>
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
            <div className="feature-card glass-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="url(#gradient1)" opacity="0.2" />
                  <path d="M24 14V24L30 30" stroke="url(#gradient1)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gradient1" x1="0" y1="0" x2="48" y2="48">
                      <stop stopColor="#3182F6" />
                      <stop offset="1" stopColor="#1B64DA" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className="feature-title">3분 만에 완성</h3>
              <p className="feature-description">복잡한 과정 없이 간단한 정보 입력만으로 세련된 부고장이 완성됩니다.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="url(#gradient2)" opacity="0.2" />
                  <path d="M16 24L22 30L32 18" stroke="url(#gradient2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="gradient2" x1="0" y1="0" x2="48" y2="48">
                      <stop stopColor="#00C7B2" />
                      <stop offset="1" stopColor="#009F8B" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className="feature-title">완전 무료</h3>
              <p className="feature-description">작성부터 공유까지 모든 기능을 완전히 무료로 사용하실 수 있습니다.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="url(#gradient3)" opacity="0.2" />
                  <rect x="14" y="18" width="20" height="16" rx="2" stroke="url(#gradient3)" strokeWidth="3" />
                  <path d="M18 18V16C18 13.7909 19.7909 12 22 12H26C28.2091 12 30 13.7909 30 16V18" stroke="url(#gradient3)" strokeWidth="3" />
                  <defs>
                    <linearGradient id="gradient3" x1="0" y1="0" x2="48" y2="48">
                      <stop stopColor="#8B7355" />
                      <stop offset="1" stopColor="#6B5744" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className="feature-title">품격있는 디자인</h3>
              <p className="feature-description">고인의 품격을 지키는 세련되고 정중한 디자인 템플릿을 제공합니다.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="url(#gradient4)" opacity="0.2" />
                  <path d="M30 18L18 30M18 18L30 30" stroke="url(#gradient4)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gradient4" x1="0" y1="0" x2="48" y2="48">
                      <stop stopColor="#FF6B6B" />
                      <stop offset="1" stopColor="#EE5A52" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className="feature-title">광고 없음</h3>
              <p className="feature-description">부고장 어디에도 광고나 불필요한 링크가 없습니다.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="url(#gradient5)" opacity="0.2" />
                  <path d="M16 24L22 30L32 18" stroke="url(#gradient5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="gradient5" x1="0" y1="0" x2="48" y2="48">
                      <stop stopColor="#FFA726" />
                      <stop offset="1" stopColor="#FB8C00" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className="feature-title">회원가입 불필요</h3>
              <p className="feature-description">별도의 회원가입이나 앱 설치 없이 바로 사용 가능합니다.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="url(#gradient6)" opacity="0.2" />
                  <path d="M24 14C18.48 14 14 18.48 14 24C14 29.52 18.48 34 24 34C26.76 34 29.24 32.88 31 31.06" stroke="url(#gradient6)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gradient6" x1="0" y1="0" x2="48" y2="48">
                      <stop stopColor="#AB47BC" />
                      <stop offset="1" stopColor="#8E24AA" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3 className="feature-title">쉬운 공유</h3>
              <p className="feature-description">카카오톡, 문자 등으로 한 번에 간편하게 공유할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="templates" id="templates">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">4가지 템플릿 제공</h2>
          </div>
          <div className="template-selection-grid">
            <div className="template-select-card" data-template="basic">
              <div className="template-preview-box">
                <img src="/images/basic.png" alt="기본형 부고장" className="template-thumb" />
              </div>
              <div className="template-details">
                <h3 className="template-name">기본형 부고장</h3>
                <p className="template-desc">전통적이고 정중한 분위기</p>
                <button className="template-preview-btn" onClick={() => showTemplatePreview('basic')}>미리보기</button>
                <button className="template-create-btn" onClick={() => router.push('/create?template=basic')}>제작하기</button>
              </div>
            </div>

            <div className="template-select-card" data-template="ribbon">
              <div className="template-preview-box">
                <img src="/images/ribbon.png" alt="검은리본 부고장" className="template-thumb" />
              </div>
              <div className="template-details">
                <h3 className="template-name">검은리본 부고장</h3>
                <p className="template-desc">추모의 마음을 담은 디자인</p>
                <button className="template-preview-btn" onClick={() => showTemplatePreview('ribbon')}>미리보기</button>
                <button className="template-create-btn" onClick={() => router.push('/create?template=ribbon')}>제작하기</button>
              </div>
            </div>

            <div className="template-select-card" data-template="border">
              <div className="template-preview-box">
                <img src="/images/border.png" alt="검은띠 부고장" className="template-thumb" />
              </div>
              <div className="template-details">
                <h3 className="template-name">검은띠 부고장</h3>
                <p className="template-desc">깔끔하고 세련된 스타일</p>
                <button className="template-preview-btn" onClick={() => showTemplatePreview('border')}>미리보기</button>
                <button className="template-create-btn" onClick={() => router.push('/create?template=border')}>제작하기</button>
              </div>
            </div>

            <div className="template-select-card" data-template="flower">
              <div className="template-preview-box">
                <img src="/images/flower-detail.png" alt="국화 부고장" className="template-thumb" />
              </div>
              <div className="template-details">
                <h3 className="template-name">국화 부고장</h3>
                <p className="template-desc">우아하고 품격있는 느낌</p>
                <button className="template-preview-btn" onClick={() => showTemplatePreview('flower')}>미리보기</button>
                <button className="template-create-btn" onClick={() => router.push('/create?template=flower')}>제작하기</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section className="guide" id="guide">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">이용 방법</h2>
            <p className="section-subtitle">3단계로 완성되는 간편한 프로세스</p>
          </div>
          <div className="guide-steps">
            <div className="guide-step">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3 className="step-title">템플릿 선택</h3>
                <p className="step-description">마음에 드는 디자인 템플릿을 선택합니다</p>
              </div>
              <div className="step-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <rect x="15" y="15" width="30" height="30" rx="4" stroke="#3182F6" strokeWidth="3" />
                  <path d="M25 25H35M25 30H35M25 35H30" stroke="#3182F6" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3 className="step-title">정보 입력</h3>
                <p className="step-description">고인과 장례 정보를 간단히 입력합니다</p>
              </div>
              <div className="step-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <path d="M20 25H40M20 30H40M20 35H35" stroke="#00C7B2" strokeWidth="3" strokeLinecap="round" />
                  <rect x="15" y="15" width="30" height="30" rx="4" stroke="#00C7B2" strokeWidth="3" />
                </svg>
              </div>
            </div>

            <div className="guide-step">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3 className="step-title">공유하기</h3>
                <p className="step-description">완성된 부고장을 카카오톡으로 공유합니다</p>
              </div>
              <div className="step-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <path d="M30 20L30 40M30 20L25 25M30 20L35 25" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 40L40 40" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" />
                </svg>
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
            <div className="faq-item">
              <div className="faq-question">
                <span>정말 무료인가요?</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-answer">
                네, 도담부고의 모든 기능은 완전히 무료입니다. 숨겨진 비용이나 유료 업그레이드도 없습니다.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <span>부고장은 얼마나 유지되나요?</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-answer">
                생성된 부고장은 영구적으로 유지됩니다. 언제든지 링크를 통해 조회할 수 있습니다.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <span>수정은 가능한가요?</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-answer">
                네, 작성 시 입력한 비밀번호(휴대번호 뒷자리)로 언제든지 수정하실 수 있습니다.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <span>개인정보는 안전한가요?</span>
                <span className="faq-icon">+</span>
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
    </>
  );
}
