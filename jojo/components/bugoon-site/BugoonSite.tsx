'use client';

import React, { useEffect, useRef, useState } from 'react';
import s from './site.module.css';

// 부고온 앱(서브도메인) 경로
const APP = 'https://bugoon.maeumbugo.co.kr';
const SIGNUP_URL = `${APP}/signup`;
const LOGIN_URL = `${APP}/login`;

// 실제 판매 중인 화환 상품 (flower_products 실사진)
const IMG = 'https://tbteghoppechzotdojna.supabase.co/storage/v1/object/public/images/products';
const PRODUCTS = [
    { name: '근조화환 기본형', desc: '실속형 3단 · 전국 3시간 당일배송', img: `${IMG}/product_1768716719472_0.jpg` },
    { name: '근조화환 고급형', desc: '가장 많이 찾는 추천 대국화 3단', img: `${IMG}/product_1768716748452_0.jpg` },
    { name: '근조화환 프리미엄형', desc: '풍성하고 격식 있는 VIP 3단', img: `${IMG}/product_1768716781804_0.jpg` },
    { name: '오브제 1단 화환', desc: '신형 장례식장 선호 모던 오브제', img: `${IMG}/product_1772792744476_0.jpg` },
];

/* ───────── 공통 훅 ───────── */

// 화면에 들어오면 .shown 부여 (스크롤 등장)
function useReveal() {
    useEffect(() => {
        const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add(s.shown);
                    io.unobserve(e.target);
                }
            }),
            { threshold: 0.15 }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);
}

// 숫자 카운트업
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const [val, setVal] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            const start = performance.now();
            const dur = 1400;
            const tick = (now: number) => {
                const p = Math.min(1, (now - start) / dur);
                setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, { threshold: 0.5 });
        io.observe(el);
        return () => io.disconnect();
    }, [to]);
    return <span ref={ref}>{val.toLocaleString()}{suffix && <span>{suffix}</span>}</span>;
}

/* ───────── 폰 화면 4종 (실제 서비스 화면 구성 기반) ───────── */

function ScreenCreate() {
    return (
        <div className={s.app}>
            <div className={s.appTop}>부고장 만들기 <small>1 / 2</small></div>
            <div className={s.appBody}>
                <div className={s.field}><label>고인 성함</label><div>홍길동</div></div>
                <div className={s.field}><label>장례식장</label><div>○○병원 장례식장 3호실</div></div>
                <div className={s.field}><label>발인일</label><div>10월 5일 (일) 오전 7시</div></div>
                <div className={s.field}><label>장지</label><div className={s.typing}>○○추모공원</div></div>
                <div className={s.appBtn}>부고장 만들기</div>
            </div>
        </div>
    );
}

function ScreenSend() {
    return (
        <div className={s.app} style={{ background: '#fff' }}>
            <div className={s.bugoImg}><img src="/images/mockup-bugo-main-v2.png" alt="부고온 실제 부고장 화면" /></div>
            <div className={s.shareSheet}>
                <div className={s.shareTitle}>부고장 보내기</div>
                <div className={s.shareRow}>
                    <div className={s.shareItem}>
                        <div className={s.shareIcon} style={{ background: '#FEE500' }}>
                            <img src="/images/ic_kakao.png" alt="카카오톡" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                        </div>
                        카카오톡
                    </div>
                    <div className={s.shareItem}>
                        <div className={s.shareIcon} style={{ background: '#eef5ee' }}>
                            <img src="/images/icon-sms.png" alt="문자" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                        </div>
                        문자
                    </div>
                    <div className={s.shareItem}><div className={s.shareIcon} style={{ background: '#f1f2f4', color: '#333' }}>🔗</div>링크 복사</div>
                    <div className={s.shareItem}><div className={s.shareIcon} style={{ background: '#f1f2f4', color: '#333' }}>⋯</div>더보기</div>
                </div>
            </div>
        </div>
    );
}

function ScreenFlower() {
    return (
        <div className={s.app}>
            <div className={s.appTop}>주문 알림 <small>실시간</small></div>
            <div className={s.appBody}>
                {[
                    { p: PRODUCTS[1], from: '○○건설 임직원 일동', t: '방금 전' },
                    { p: PRODUCTS[0], from: '대학 동기 일동', t: '12분 전' },
                    { p: PRODUCTS[2], from: '○○회 회원 일동', t: '38분 전' },
                ].map((n, i) => (
                    <div className={s.notice} key={i}>
                        <div className={s.noticeImg}><img src={n.p.img} alt={n.p.name} /></div>
                        <div className={s.noticeText}><b>{n.p.name}</b><span>{n.from} · {n.t}</span></div>
                        <div className={s.noticeBadge}>주문완료</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ScreenWallet() {
    return (
        <div className={s.app}>
            <div className={s.sampleTag}>예시 화면</div>
            <div className={s.appTop}>정산</div>
            <div className={s.appBody}>
                <div className={s.wallet}>
                    <small>환급 가능 금액</small>
                    <div className={s.walletAmt}>○○○,○○○원</div>
                    <div className={s.walletBtn}>환급 신청</div>
                </div>
                <div className={s.txRow}><div><b>화환 주문 적립</b><span>故 홍길동 · 근조화환 고급형</span></div><div className={s.txPlus}>적립</div></div>
                <div className={s.txRow}><div><b>화환 주문 적립</b><span>故 홍길동 · 근조화환 기본형</span></div><div className={s.txPlus}>적립</div></div>
                <div className={s.txRow}><div><b>답례품 주문 적립</b><span>故 홍길동 · 답례품</span></div><div className={s.txPlus}>적립</div></div>
            </div>
        </div>
    );
}

const SCREENS = [ScreenCreate, ScreenSend, ScreenFlower, ScreenWallet];

function Phone({ children, small }: { children: React.ReactNode; small?: boolean }) {
    return (
        <div className={`${s.phone} ${small ? s.phoneSm : ''}`}>
            <div className={s.screen}>
                <div className={s.island} />
                {children}
            </div>
        </div>
    );
}

/* ───────── 스토리 섹션 (장례 3일) ───────── */

const STEPS = [
    {
        day: '첫째 날 · 임종 직후',
        title: <>부고장은<br />1분이면 됩니다</>,
        desc: '고인 성함, 장례식장, 발인 일시만 입력하세요. 앱 설치 없이 휴대폰 브라우저에서 바로 만듭니다.',
        points: ['전국 장례식장 주소 자동 검색', '무빈소 · 가족장도 그대로 표시', '종교별 호칭과 문구 선택'],
    },
    {
        day: '첫째 날 · 부고 발송',
        title: <>카카오톡 한 번으로<br />모든 조문객에게</>,
        desc: '상주님께 링크 하나만 전달하면 끝입니다. 조문객은 그 링크에서 빈소 위치, 길안내, 마음 전할 곳까지 확인합니다.',
        points: ['카카오맵 · 티맵 · 네이버 길안내 연결', '상주 계좌 안내', '정갈한 부고장 템플릿'],
    },
    {
        day: '둘째 날 · 조문',
        title: <>화환 주문은<br />부고장 안에서</>,
        desc: '조문객이 부고장에서 바로 근조화환을 주문합니다. 빈소 주소를 따로 묻고 답할 필요가 없습니다.',
        points: ['실제 화원 상품 사진 그대로', '리본 문구 직접 입력', '주문 내역은 관리 화면에서 확인'],
    },
    {
        day: '셋째 날 · 발인 이후',
        title: <>장례가 끝나면,<br />페이백이 남습니다</>,
        desc: '부고장을 통해 들어온 화환·답례품 주문은 적립금으로 쌓입니다. 환급 신청하면 등록한 계좌로 입금됩니다.',
        points: ['적립 내역 실시간 확인', '개인 파트너 3.3% 원천징수 자동 처리', '상조사 본사 · 지도사 분할 정산'],
    },
];

function Story() {
    const [active, setActive] = useState(0);
    const refs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => {
                if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx));
            }),
            { rootMargin: '-45% 0px -45% 0px' }
        );
        refs.current.forEach((el) => el && io.observe(el));
        return () => io.disconnect();
    }, []);

    return (
        <div className={s.story}>
            <div className={s.steps}>
                {STEPS.map((st, i) => {
                    const Screen = SCREENS[i];
                    return (
                        <div
                            key={i}
                            data-idx={i}
                            ref={(el) => { refs.current[i] = el; }}
                            className={`${s.step} ${active === i ? s.stepActive : ''}`}
                        >
                            <div className={s.stepDay}>{st.day}</div>
                            <h3 className={s.stepTitle}>{st.title}</h3>
                            <p className={s.stepDesc}>{st.desc}</p>
                            <ul className={s.stepPoints}>{st.points.map((p) => <li key={p}>{p}</li>)}</ul>
                            {/* 모바일: 단계별 화면을 바로 아래에 */}
                            <div className={s.stepInline}><Phone small><Screen /></Phone></div>
                        </div>
                    );
                })}
            </div>
            {/* 데스크톱: 스크롤에 따라 화면이 바뀌는 고정 폰 */}
            <div className={s.stickyCol}>
                <div className={s.stickyPhone}>
                    <Phone>
                        {SCREENS.map((Screen, i) => (
                            <div key={i} className={`${s.screenLayer} ${active === i ? s.screenOn : ''}`}>
                                {active === i && <Screen />}
                            </div>
                        ))}
                    </Phone>
                </div>
            </div>
        </div>
    );
}

/* ───────── 대상별 탭 ───────── */

const AUDIENCES = [
    {
        tab: '장례지도사',
        title: <>소속이 없어도,<br />내 계좌로 당일 직송금</>,
        desc: '상조회사 소속이든 프리랜서든 관계없이 가입 즉시 내 이름으로 부고장을 만듭니다. 화환·답례품 주문이 발생하면 3.3% 원천징수 후 개인 계좌로 투명하게 입금됩니다.',
        items: [
            ['가입비 · 월회비 영구 0원', '휴대폰 인증만으로 10초 만에 가입하고 첫 부고장을 발행합니다.'],
            ['상주에게 당당한 무광고 부고장', '조잡한 성형외과·보험 배너 광고가 전혀 없어 유족에게 보낼 때 품격을 지킵니다.'],
            ['주문 발생 즉시 실시간 페이백', '내 부고장에서 화환이 결제되는 즉시 카카오톡 알림과 함께 정산 지갑에 적립됩니다.'],
        ],
        img: '/images/b2b/envelope.png',
        caption: '프리랜서 개인 계좌 당일 정산 지원',
    },
    {
        tab: '상조사 본사',
        title: <>전국 소속 지도사의 부고를<br />본사 관리자에서 한눈에</>,
        desc: '본사 단체 도입 시 전용 관리자 대시보드가 제공됩니다. 지점별·지도사별 부고 발행 건수와 화환 매출을 실시간으로 집계하고, 본사 몫과 지도사 수당을 시스템이 자동 분할합니다.',
        items: [
            ['상조사 단독 브랜드 로고 적용', '모든 부고장 상단에 회사 공식 로고와 상조 브랜드가 고정 표기됩니다.'],
            ['본사 - 지도사 자동 분할 정산', '주문 발생 시 약정된 요율에 따라 본사 정산금과 지도사 수당이 분리 적립됩니다.'],
            ['월별 부고 · 정산 엑셀 보고서', '클릭 한 번으로 세무 신고용 정산 내역 및 월별 통계 데이터를 다운로드합니다.'],
        ],
        img: '/images/b2b/document.png',
        caption: '본사 관리자 단체 도입 상담 가능',
    },
    {
        tab: '장례식장',
        title: <>문의 전화 80% 감소,<br />빈소 알림톡 1초 발송</>,
        desc: '빈소가 배정되면 상주님께 카카오톡으로 부고장을 전달하세요. 조문객들이 가장 많이 묻는 빈소 위치, 주차장 길안내, 상주 계좌가 일원화되어 사무실 전화 업무가 획기적으로 줄어듭니다.',
        items: [
            ['네이버·티맵·카카오 길안내 자동 연동', '주소를 복사해서 검색할 필요 없이 조문객이 바로 내비게이션을 실행합니다.'],
            ['화환 배송 호실 착오 원천 차단', '빈소 호실과 상주명이 주문장에 박혀 배송 기사의 오배송이 사라집니다.'],
            ['식장 지정 화원 연동 지원', '기존 거래 화원을 부고장에 연결하거나 부고온 전국 화원망을 병행 선택 가능합니다.'],
        ],
        img: '/images/b2b/wreath.png',
        caption: '장례식장 사무실 제휴 접수 중',
    },
];

function Audience() {
    const [i, setI] = useState(0);
    const a = AUDIENCES[i];
    return (
        <>
            <div className={s.tabs} role="tablist">
                {AUDIENCES.map((x, idx) => (
                    <button key={x.tab} role="tab" aria-selected={i === idx} className={`${s.tab} ${i === idx ? s.tabOn : ''}`} onClick={() => setI(idx)}>
                        {x.tab}
                    </button>
                ))}
            </div>
            <div className={s.audience} key={i}>
                <div>
                    <h3 className={s.audTitle}>{a.title}</h3>
                    <p className={s.audDesc}>{a.desc}</p>
                    <div className={s.audList}>
                        {a.items.map(([t, d], k) => (
                            <div className={s.audItem} key={t}>
                                <div className={s.audNum}>{k + 1}</div>
                                <div><b>{t}</b><span>{d}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={s.audVisual}>
                    <img src={a.img} alt="" />
                    <div className={s.audCaption}><span className={s.floatIcon}>✓</span>{a.caption}</div>
                </div>
            </div>
        </>
    );
}

/* ───────── FAQ ───────── */

const FAQS = [
    ['정말 비용이 없나요?', '가입비와 월 이용료가 없습니다. 부고온은 조문객의 화환·답례품 주문에서 발생하는 수익으로 운영되며, 그 일부를 부고장을 만든 지도사님께 페이백으로 돌려드립니다.'],
    ['앱을 설치해야 하나요?', '아니요. 휴대폰 브라우저에서 바로 가입하고 부고장을 만들 수 있습니다. 상주님과 조문객도 링크만 열면 됩니다.'],
    ['페이백은 어떻게 받나요?', '부고장을 통해 주문이 완료되면 적립금으로 쌓이고, 정산 화면에서 환급 신청하면 등록한 계좌로 입금됩니다. 개인 파트너는 3.3% 원천징수 후 입금됩니다.'],
    ['상조사·장례식장 단위로 도입할 수 있나요?', '가능합니다. 아래 도입 문의를 남겨주시면 담당자가 직접 연락드려 회사 로고 적용, 소속 지도사 등록, 정산 방식을 안내해 드립니다.'],
    ['유족 개인정보는 어떻게 관리되나요?', '발인 후 30일이 지난 부고장은 자동으로 비공개 처리됩니다.'],
];

function Faq() {
    const [open, setOpen] = useState<number | null>(0);
    return (
        <div className={s.faq}>
            {FAQS.map(([q, a], i) => (
                <div key={q} className={`${s.faqItem} ${open === i ? s.faqOpen : ''}`}>
                    <button className={s.faqQ} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                        {q}<i>+</i>
                    </button>
                    <div className={s.faqA}><p>{a}</p></div>
                </div>
            ))}
        </div>
    );
}

/* ───────── 도입 문의 모달 ───────── */

const TYPES = ['장례지도사', '상조사', '장례식장', '기타'];

function InquiryModal({ onClose }: { onClose: () => void }) {
    const [type, setType] = useState('장례지도사');
    const [company, setCompany] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return setError('성함과 연락처를 입력해 주세요.');
        if (!agree) return setError('개인정보 수집·이용에 동의해 주세요.');
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/b2b/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, companyName: company, contactName: name, phone, message }),
            });
            if (!res.ok) throw new Error();
            setDone(true);
        } catch {
            setError('접수에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={s.modalBg} onClick={onClose}>
            <div className={s.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <button className={s.modalClose} onClick={onClose} aria-label="닫기">✕</button>
                {done ? (
                    <div className={s.done}>
                        <div className={s.doneIcon}>✓</div>
                        <h3>문의가 접수되었습니다</h3>
                        <p style={{ color: '#5d636b', margin: '8px 0 24px' }}>담당자가 확인 후 연락드리겠습니다.</p>
                        <button className={`${s.btn} ${s.btnPrimary}`} style={{ width: '100%' }} onClick={onClose}>확인</button>
                    </div>
                ) : (
                    <>
                        <h3>도입 문의</h3>
                        <p>남겨주시면 담당자가 직접 연락드립니다.</p>
                        <form className={s.form} onSubmit={submit}>
                            <div>
                                <span className={s.formLabel}>구분</span>
                                <div className={s.chips}>
                                    {TYPES.map((t) => (
                                        <button type="button" key={t} className={`${s.chip} ${type === t ? s.chipOn : ''}`} onClick={() => setType(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <input className={s.input} placeholder="소속 (회사·식장명, 프리랜서는 생략)" value={company} onChange={(e) => setCompany(e.target.value)} />
                            <input className={s.input} placeholder="성함" value={name} onChange={(e) => setName(e.target.value)} />
                            <input className={s.input} placeholder="연락처" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            <textarea className={s.input} placeholder="문의 내용 (선택)" value={message} onChange={(e) => setMessage(e.target.value)} />
                            <label className={s.agree}>
                                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                                <span>상담 목적의 개인정보(성함, 연락처, 소속) 수집·이용에 동의합니다. 상담 완료 후 지체 없이 파기합니다.</span>
                            </label>
                            {error && <div className={s.formError}>{error}</div>}
                            <button className={`${s.btn} ${s.btnPrimary}`} disabled={loading}>{loading ? '접수 중…' : '문의 남기기'}</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

/* ───────── 페이지 ───────── */

export default function BugoonSite() {
    useReveal();
    const [scrolled, setScrolled] = useState(false);
    const [modal, setModal] = useState(false);

    useEffect(() => {
        // globals.css의 html, body { overflow-x: hidden }이 position: sticky를 무력화하므로 clip으로 교체
        const h = document.documentElement;
        const b = document.body;
        const prevH = h.style.overflow;
        const prevB = b.style.overflow;
        h.style.overflow = 'visible';
        b.style.overflow = 'visible';
        return () => {
            h.style.overflow = prevH;
            b.style.overflow = prevB;
        };
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 480);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const R = (extra = '') => ({ 'data-reveal': '', className: `${s.reveal} ${extra}` });

    return (
        <div className={s.site}>
            {/* 헤더 */}
            <header className={`${s.header} ${scrolled ? s.headerScrolled : ''}`}>
                <div className={`${s.wrap} ${s.headerInner}`}>
                    <a href="#top" className={s.logo}><img src="/images/b2b-logo.png" alt="부고온" style={{ height: 52, margin: "-8px -10px" }} /></a>
                    <nav className={s.nav}>
                        <a href="#how">사용 방법</a>
                        <a href="#who">도입 대상</a>
                        <a href="#flower">화환</a>
                        <a href="#faq">자주 묻는 질문</a>
                    </nav>
                    <div className={s.headerCta}>
                        <a href={LOGIN_URL} className={`${s.btn} ${s.btnSm} ${s.btnGhost}`}>로그인</a>
                        <a href={SIGNUP_URL} className={`${s.btn} ${s.btnSm} ${s.btnPrimary}`}>무료로 시작하기</a>
                    </div>
                </div>
            </header>

            {/* 히어로 */}
            <section className={s.hero} id="top">
                <div className={`${s.wrap} ${s.heroGrid}`}>
                    <div>
                        <div {...R()}><span className={s.eyebrow}><span className={s.eyebrowDot} />장례 현장을 위한 모바일 부고 솔루션</span></div>
                        <h1 {...R(s.heroTitle + ' ' + s.d1)}>부고는 1분,<br />나머지는 <em>부고온</em>이<br />챙깁니다.</h1>
                        <p {...R(s.heroDesc + ' ' + s.d2)}>부고장 작성부터 발송, 화환 주문, 정산까지. 장례지도사·상조사·장례식장이 쓰는 부고 솔루션입니다.</p>
                        <div {...R(s.heroBtns + ' ' + s.d3)}>
                            <a href={SIGNUP_URL} className={`${s.btn} ${s.btnPrimary}`}>무료로 시작하기</a>
                            <button className={`${s.btn} ${s.btnGhost}`} onClick={() => setModal(true)}>도입 문의</button>
                        </div>
                        <div {...R(s.heroNote + ' ' + s.d3)}>앱 설치 없음 · 가입비 0원 · 월 이용료 0원</div>
                    </div>
                    <div className={s.heroVisual} {...{ 'data-reveal': '' }}>
                        <div className={`${s.card} ${s.cardLeft}`}><img src="/images/mockup-bugo-flower-v2.png" alt="국화 부고장 완성 화면" /></div>
                        <div className={`${s.card} ${s.cardRight}`}><img src="/images/mockup-bugo-ribbon-v2.png" alt="리본 부고장 완성 화면" /></div>
                        <div className={`${s.card} ${s.cardMain}`}><img src="/images/mockup-bugo-hero-v2.png" alt="기본 부고장 완성 화면" /></div>
                        <div className={`${s.floatTag} ${s.tagA}`}><span className={s.floatIcon}>✉</span><div>부고장 발송 완료<small>카카오톡으로 전달됨</small></div></div>
                        <div className={`${s.floatTag} ${s.tagB}`}><span className={s.floatIcon}>✿</span><div>화환 주문 도착<small>근조화환 고급형</small></div></div>
                    </div>
                </div>
            </section>

            {/* 실적 (실사용 기준 보수적 수치) */}
            <section className={s.proof}>
                <div className={s.wrap}>
                    <div {...R(s.proofBox)}>
                        <div className={s.proofItem}><div className={s.proofNum}><CountUp to={52000} suffix="+" /></div><div className={s.proofLabel}>누적 모바일 부고장 발행</div></div>
                        <div className={s.proofItem}><div className={s.proofNum}><CountUp to={1680000} suffix="+" /></div><div className={s.proofLabel}>누적 조문객 열람</div></div>
                        <div className={s.proofItem}><div className={s.proofNum}><CountUp to={0} suffix="원" /></div><div className={s.proofLabel}>가입비 · 월 이용료 영구 0원</div></div>
                    </div>
                    <div className={s.proofFoot}>전국 제휴 네트워크 및 모바일 부고 발송 누적 기준</div>
                </div>
            </section>

            {/* 장례 3일 스토리 */}
            <section className={`${s.section} ${s.sectionWhite}`} id="how">
                <div className={s.wrap}>
                    <div {...R(s.center)}>
                        <div className={s.kicker}>사용 방법</div>
                        <h2 className={s.h2}>장례 3일,<br />휴대폰 하나로 끝납니다</h2>
                        <p className={s.lead}>임종 직후 부고 작성부터 발인 후 정산까지, 지도사님이 실제로 하시는 순서대로 보여드립니다.</p>
                    </div>
                    <Story />
                </div>
            </section>

            {/* 대상별 */}
            <section className={s.section} id="who">
                <div className={`${s.wrap} ${s.center}`}>
                    <div {...R()}>
                        <div className={s.kicker}>도입 대상</div>
                        <h2 className={s.h2}>혼자 일하든, 회사로 일하든</h2>
                        <p className={s.lead}>장례 현장에 있는 분이라면 누구나 같은 도구로 시작합니다.</p>
                    </div>
                    <Audience />
                </div>
            </section>

            {/* 화환 */}
            <section className={`${s.section} ${s.sectionWhite}`} id="flower">
                <div className={s.wrap}>
                    <div {...R(s.center)}>
                        <div className={s.kicker}>근조화환</div>
                        <h2 className={s.h2}>조문객은 부고장에서 바로,<br />화환은 빈소로 정확하게</h2>
                        <p className={s.lead}>부고장 안에 실제 화원 상품이 그대로 들어갑니다. 빈소 주소와 호실이 자동으로 담겨 배송 착오가 줄어듭니다.</p>
                    </div>
                    <div className={s.products}>
                        {PRODUCTS.map((p, i) => (
                            <div key={p.name} {...R(s.product + ' ' + [s.d1, s.d2, s.d3, ''][i])}>
                                <div className={s.productImg}><img src={p.img} alt={p.name} loading="lazy" /></div>
                                <div className={s.productInfo}><b>{p.name}</b><span>{p.desc}</span></div>
                            </div>
                        ))}
                    </div>
                    <p className={s.paybackNote} {...{ 'data-reveal': '' }}>부고장을 통해 들어온 주문은 <b>부고장을 만든 지도사님께 페이백</b>으로 적립됩니다.</p>
                </div>
            </section>

            {/* 비교 */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div {...R(s.center)}>
                        <div className={s.kicker}>비교</div>
                        <h2 className={s.h2}>문자 부고와 무엇이 다른가요</h2>
                    </div>
                    <div {...R(s.compare)}>
                        <div className={`${s.compareRow} ${s.compareHead}`}><div /><div>문자 · 이미지 부고</div><div>부고온</div></div>
                        {[
                            ['빈소 길안내', '주소를 복사해서 검색', '눌러서 바로 길찾기'],
                            ['화환 주문', '조문객이 직접 화원 수소문', '부고장에서 바로 주문'],
                            ['정보 수정', '다시 만들어 다시 발송', '수정하면 링크 그대로 반영'],
                            ['지도사 수익', '없음', '주문마다 페이백 적립'],
                            ['비용', '-', '0원'],
                        ].map(([k, a, b]) => (
                            <div className={s.compareRow} key={k}><div>{k}</div><div>{a}</div><div>{b}</div></div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className={`${s.section} ${s.sectionWhite}`} id="faq">
                <div className={s.wrap}>
                    <div {...R(s.center)}>
                        <div className={s.kicker}>자주 묻는 질문</div>
                        <h2 className={s.h2}>궁금한 점이 있으신가요</h2>
                    </div>
                    <Faq />
                </div>
            </section>

            {/* 최종 CTA */}
            <section className={s.final}>
                <div className={s.finalHanja} aria-hidden>訃告</div>
                <div className={s.wrap}>
                    <h2 {...R(s.finalTitle)}>다음 부고는<br />부고온으로 보내보세요.</h2>
                    <p {...R(s.finalDesc + ' ' + s.d1)}>가입은 1분, 비용은 0원입니다. 회사·식장 단위 도입은 문의를 남겨주세요.</p>
                    <div {...R(s.finalBtns + ' ' + s.d2)}>
                        <a href={SIGNUP_URL} className={`${s.btn} ${s.btnWhite}`}>무료로 시작하기</a>
                        <button className={`${s.btn} ${s.btnOutlineWhite}`} onClick={() => setModal(true)}>도입 문의</button>
                    </div>
                </div>
            </section>

            {/* 푸터 (마음부고 실제 사업자 정보) */}
            <footer className={s.footer}>
                <div className={s.wrap}>
                    <div className={s.footerTop}>
                        <img src="/images/b2b-logo.png" alt="부고온" className={s.footerLogo} style={{ height: 48, margin: "-8px -10px" }} />
                        <div className={s.footerLinks}>
                            <a href={`${APP}/terms`}>이용약관</a>
                            <a href={`${APP}/privacy`}>개인정보처리방침</a>
                            <a href={LOGIN_URL}>파트너 로그인</a>
                        </div>
                    </div>
                    <p>(주)마음부고 | 대표 김미연 | 사업자등록번호 408-22-68851 | 통신판매업신고 2026-서울강남-00502</p>
                    <p>서울특별시 강남구 압구정로 306</p>
                    <p>Copyright © maeumbugo Corp. All rights reserved.</p>
                </div>
            </footer>

            {/* 모바일 하단 고정 CTA */}
            <div className={`${s.mobileBar} ${scrolled ? s.mobileBarOn : ''}`}>
                <button className={`${s.btn} ${s.btnGhost}`} onClick={() => setModal(true)}>도입 문의</button>
                <a href={SIGNUP_URL} className={`${s.btn} ${s.btnPrimary}`}>무료로 시작하기</a>
            </div>

            {modal && <InquiryModal onClose={() => setModal(false)} />}
        </div>
    );
}
