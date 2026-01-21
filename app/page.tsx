'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import SideMenu from '@/components/SideMenu';
import NavMenu from '@/components/NavMenu';
import KBEscrow from '@/components/KBEscrow';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  bugo_number: string;
  deceased_name: string;
  mourner_name?: string;
  funeral_date?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTemplateId, setDraftTemplateId] = useState<string | null>(null);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 누적 부고장 수 계산 (기준일: 2026-01-06, 기준값: 15149, 하루 +5건)
  const calculateBugoCount = () => {
    const baseDate = new Date('2026-01-06');
    const baseCount = 15149;
    const dailyIncrease = 5;
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    return baseCount + Math.max(0, daysPassed) * dailyIncrease;
  };
  const [bugoCount] = useState(calculateBugoCount());

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
      const statNumbers = document.querySelectorAll('.xd-stat-value[data-count]');
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

  // 자동완성 검색
  useEffect(() => {
    const searchBugo = async () => {
      if (searchQuery.trim().length < 1) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        // 1달 전 날짜 계산
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('bugo')
          .select('id, bugo_number, deceased_name, mourner_name, funeral_date')
          .or(`deceased_name.ilike.%${searchQuery}%,mourner_name.ilike.%${searchQuery}%`)
          .gte('funeral_date', oneMonthAgoStr) // 1달 이내만
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          // 상주 매칭 우선 정렬
          const query = searchQuery.toLowerCase();
          const sorted = data.sort((a, b) => {
            const aMournerMatch = a.mourner_name?.toLowerCase().includes(query) ? 1 : 0;
            const bMournerMatch = b.mourner_name?.toLowerCase().includes(query) ? 1 : 0;
            return bMournerMatch - aMournerMatch;
          }).slice(0, 5);

          setSearchResults(sorted);
          setShowDropdown(sorted.length > 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchBugo, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const showTemplatePreview = (template: string) => {
    // 템플릿 미리보기 모달
    alert(`${template} 템플릿 미리보기 준비 중`);
  };

  // Schema.org JSON-LD 데이터
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://maeumbugo.co.kr/#organization",
        "name": "마음부고",
        "url": "https://maeumbugo.co.kr",
        "logo": "https://maeumbugo.co.kr/images/logo.png",
        "sameAs": [],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "url": "https://maeumbugo.co.kr/contact"
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "서울특별시",
          "addressRegion": "강남구",
          "streetAddress": "압구정로 306",
          "addressCountry": "KR"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://maeumbugo.co.kr/#website",
        "url": "https://maeumbugo.co.kr",
        "name": "마음부고",
        "description": "3분 만에 만드는 품격있는 무료 모바일 부고장",
        "publisher": {
          "@id": "https://maeumbugo.co.kr/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://maeumbugo.co.kr/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        },
        "inLanguage": "ko-KR"
      },
      {
        "@type": "WebApplication",
        "name": "마음부고",
        "url": "https://maeumbugo.co.kr",
        "description": "3분 만에 만드는 품격있는 무료 모바일 부고장 서비스. 4가지 템플릿, 완전 무료, 광고 없음, 간편한 공유.",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "KRW"
        },
        "featureList": [
          "무료 모바일 부고장 생성",
          "4가지 템플릿 제공",
          "카카오톡/문자 공유",
          "QR코드 생성",
          "지도 연동",
          "회원가입 불필요"
        ],
        "inLanguage": "ko-KR"
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "정말 무료인가요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "네, 마음부고의 모든 기능은 완전히 무료입니다. 숨겨진 비용이나 유료 업그레이드도 없습니다."
            }
          },
          {
            "@type": "Question",
            "name": "부고장은 얼마나 유지되나요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "생성된 부고장은 영구적으로 유지됩니다. 언제든지 링크를 통해 조회할 수 있습니다."
            }
          },
          {
            "@type": "Question",
            "name": "수정은 가능한가요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "네, 작성 시 입력한 비밀번호(휴대번호 뒷자리)로 언제든지 수정하실 수 있습니다."
            }
          },
          {
            "@type": "Question",
            "name": "개인정보는 안전한가요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "입력하신 정보는 부고장 표시 목적으로만 사용되며, 별도로 수집하거나 제3자에게 제공하지 않습니다."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 상단 네비게이션 - 다른 페이지와 동일 */}
      <nav className="nav" id="nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo"><Image src="/images/logo.png" alt="마음부고" className="nav-logo-img" width={120} height={32} /></Link>
          <NavMenu />
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

      {/* 메인 콘텐츠 - XD 스타일 */}
      <div className="xd-main-wrapper">

        {/* 통계 섹션 */}
        <div className="xd-stats">
          <div className="xd-stat-item">
            <span className="xd-stat-label">누적부고장</span>
            <span className="xd-stat-value" data-count={bugoCount} data-suffix="건">0</span>
          </div>
          <div className="xd-stat-divider"></div>
          <div className="xd-stat-item">
            <span className="xd-stat-label">만족도</span>
            <span className="xd-stat-value" data-count="99" data-suffix="%">0</span>
          </div>
        </div>

        {/* 히어로 섹션 */}
        <section className="xd-hero">
          <h1 className="xd-hero-title">마음부고에서 부고장을 만드세요</h1>
          <p className="xd-hero-subtitle">가장 간편하고 빠르게 부고장을 만드세요.</p>
          <div className="xd-hero-image">
            <Image src="/images/hero-image.png" alt="마음부고 부고장 미리보기" width={400} height={600} priority />
          </div>
        </section>

        {/* 검색바 */}
        <div className="xd-search-wrapper" ref={searchRef}>
          <div className="xd-search">
            <input
              type="text"
              className="xd-search-input"
              placeholder="상주 / 고인을 검색하세요."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            />
            <button className="xd-search-btn" onClick={handleSearch}>
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
          {/* 자동완성 드롭다운 */}
          {showDropdown && (
            <div className="xd-search-dropdown">
              {searchResults.map((result) => {
                // 하이라이트 함수
                const highlight = (text: string) => {
                  if (!searchQuery.trim()) return text;
                  const regex = new RegExp(`(${searchQuery.trim()})`, 'gi');
                  const parts = text.split(regex);
                  return parts.map((part, i) =>
                    regex.test(part) ? <mark key={i}>{part}</mark> : part
                  );
                };

                // 발인 날짜 포맷
                const formatFuneralDate = (date?: string) => {
                  if (!date) return '';
                  const d = new Date(date);
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${month}/${day}`;
                };

                return (
                  <div
                    key={result.id}
                    className="xd-search-item"
                    onClick={() => {
                      router.push(`/view/${result.bugo_number}`);
                      setShowDropdown(false);
                    }}
                  >
                    <span className="xd-search-main">
                      {result.mourner_name && (
                        <>상주 {highlight(result.mourner_name)} </>
                      )}
                      <span className="xd-search-deceased">(故 {highlight(result.deceased_name)})</span>
                    </span>
                    {result.funeral_date && (
                      <span className="xd-search-date">발인 {formatFuneralDate(result.funeral_date)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 액션 카드 */}
        <div className="xd-action-cards">
          <button className="xd-action-card" onClick={checkDraftBeforeCreate}>
            <div className="xd-action-icon-circle">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
            <span className="xd-action-title">부고장 만들기</span>
          </button>
          <button className="xd-action-card" onClick={() => router.push('/search')}>
            <div className="xd-action-icon-circle">
              <span className="material-symbols-outlined">search</span>
            </div>
            <span className="xd-action-title">부고 검색</span>
          </button>
          <button className="xd-action-card xd-action-faq" onClick={() => router.push('/faq')}>
            <div className="xd-action-icon-circle">
              <span className="material-symbols-outlined">help</span>
            </div>
            <span className="xd-action-title">자주 묻는 질문</span>
          </button>
        </div>

        {/* 부고장 작성방법 */}
        <section className="xd-guide">
          <h2 className="xd-guide-title">부고장 작성방법</h2>
          <div className="xd-guide-card">
            <p className="xd-guide-text">
              고인 정보와 상주 연락처, 장례 일정만 입력하면 정중한 모바일 부고장이 완성됩니다.
              카카오톡, 문자, 밴드로 간편하게 전달하세요.
            </p>
          </div>
        </section>
      </div>

      {/* Side Menu */}
      <SideMenu isOpen={sideMenuOpen} onClose={closeSideMenu} />

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">왜 마음부고일까요?</h2>
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
      <section className="faq faq-section-bottom" id="faq">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">자주 묻는 질문</h2>
          </div>
          <div className="faq-list">
            <div className={`faq-item ${openFaqs.has(0) ? 'active' : ''}`} onClick={() => toggleFaq(0)}>
              <div className="faq-question">
                <span>회원가입 없이 이용 가능한가요?</span>
                <span className="faq-icon">{openFaqs.has(0) ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                네, 회원가입이나 로그인 없이 바로 부고장을 만들 수 있습니다. 간단한 정보 입력만으로 완성됩니다.
              </div>
            </div>
            <div className={`faq-item ${openFaqs.has(1) ? 'active' : ''}`} onClick={() => toggleFaq(1)}>
              <div className="faq-question">
                <span>앱 설치 없이도 사용할 수 있나요?</span>
                <span className="faq-icon">{openFaqs.has(1) ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                네, 별도의 앱 설치 없이 모바일 웹에서 바로 이용 가능합니다. 카카오톡, 문자, 밴드로 공유하세요.
              </div>
            </div>
            <div className={`faq-item ${openFaqs.has(2) ? 'active' : ''}`} onClick={() => toggleFaq(2)}>
              <div className="faq-question">
                <span>부고장은 언제까지 유지되나요?</span>
                <span className="faq-icon">{openFaqs.has(2) ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                개인정보 보호를 위해 발인 후 30일까지 열람 가능합니다. 이후에는 자동으로 비공개 처리됩니다.
              </div>
            </div>
            <div className={`faq-item ${openFaqs.has(3) ? 'active' : ''}`} onClick={() => toggleFaq(3)}>
              <div className="faq-question">
                <span>서비스 이용 중 문의는 어떻게 하나요?</span>
                <span className="faq-icon">{openFaqs.has(3) ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                문의는 제휴/문의 페이지를 통해 가능합니다. 빠른 시간 내에 답변 드리겠습니다.
              </div>
            </div>
          </div>
          {/* 더보기 버튼 */}
          <div className="faq-more-wrapper">
            <Link href="/faq" className="faq-more-btn">
              더보기
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo"><Image src="/images/logo.png" alt="마음부고" className="footer-logo-img" width={100} height={28} /></div>
            <div className="footer-links-horizontal">
              <Link href="/terms">이용약관</Link>
              <span className="footer-separator">|</span>
              <Link href="/privacy">개인정보처리방침</Link>
              <span className="footer-separator">|</span>
              <Link href="/contact">제휴/문의</Link>
            </div>
            <div className="footer-info">
              <p>서울특별시 강남구 압구정로 306, 리더스빌딩 3층</p>
              <p>대표: 김미연 | 대표번호: 02-6959-3500</p>
              <p>사업자등록번호: 408-22-68851 | 통신판매업신고: 2025-서울강남-00123</p>
              <p>Copyright maeumbugo Corp All right reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* 임시저장 확인 모달 */}
      {draftModalOpen && (
        <div className="modal-overlay" onClick={() => setDraftModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>임시저장된 부고장</h3>
            <p>임시저장된 부고장이 있습니다.<br />계속 작성하시겠습니까?</p>
            <div className="modal-buttons">
              <button className="modal-btn secondary" onClick={discardDraft}>아니오</button>
              <button className="modal-btn primary" onClick={continueDraft}>예</button>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 플로팅 버튼 - 부고장 만들기 */}
      <div className="mobile-floating-cta">
        <div className="floating-tooltip">
          링크형 <strong>부고장 무료</strong> 제작하기
        </div>
        <button className="btn-floating-create" onClick={checkDraftBeforeCreate}>
          부고장 만들기
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </>
  );
}
