'use client';

import { useState } from 'react';
import Link from 'next/link';
import SideMenu from '@/components/SideMenu';

const faqData = [
    {
        question: '정말 무료로 이용할 수 있나요?',
        answer: '네, 마음부고에서 모바일 부고장을 만드는 것은 완전 무료입니다. 숨겨진 비용이나 유료 업그레이드 없이 모든 기능을 이용하실 수 있습니다.',
    },
    {
        question: '회원가입 없이 이용 가능한가요?',
        answer: '네, 별도의 회원가입 절차 없이 바로 부고장을 작성하실 수 있습니다. 간편하게 정보만 입력하시면 됩니다.',
    },
    {
        question: '앱 설치 없이도 사용할 수 있나요?',
        answer: '네, 별도의 앱 설치가 필요 없습니다. 스마트폰, 태블릿, PC 등 모든 기기의 웹 브라우저에서 바로 이용하실 수 있습니다.',
    },
    {
        question: '작성한 부고장은 어떻게 공유하나요?',
        answer: '부고장 작성 완료 후 카카오톡, 문자 메시지, URL 복사 등 다양한 방법으로 손쉽게 공유하실 수 있습니다.',
    },
    {
        question: '부고장 내용 수정은 가능한가요?',
        answer: '네, 작성 시 입력한 비밀번호(휴대번호 뒷자리 4자리)를 통해 언제든지 수정하실 수 있습니다.',
    },
    {
        question: '부고장은 언제까지 유지되나요?',
        answer: '부고장은 발인일로부터 2주 후 자동으로 삭제됩니다. 삭제 전 별도 연장 요청을 하시면 유지 기간을 늘릴 수 있습니다.',
    },
    {
        question: '부고장 삭제는 어떻게 하나요?',
        answer: '부고장 삭제를 원하시면 고객센터로 연락 주시거나, 부고장 수정 페이지에서 삭제 요청을 해주시면 됩니다.',
    },
    {
        question: '서비스 이용 중 문의는 어떻게 하나요?',
        answer: '홈페이지 하단의 문의하기를 통해 언제든지 문의해주시면 신속하게 답변 드리겠습니다.',
    },
    {
        question: '개인정보는 안전하게 보호되나요?',
        answer: '네, 입력하신 개인정보는 부고장 표시 목적으로만 사용되며, 제3자에게 제공하거나 별도로 수집하지 않습니다.',
    },
];

export default function FAQPage() {
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

    return (
        <>
            {/* Navigation - 다른 페이지와 동일 */}
            <nav className="nav" id="nav">
                <div className="nav-container">
                    <Link href="/" className="nav-logo" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}><img src="/images/logo.png" alt="마음부고" className="nav-logo-img" /></Link>
                    <ul className="nav-menu" id="navMenu">
                        <li><Link href="/search" className="nav-link">부고검색</Link></li>
                        <li><Link href="/faq" className="nav-link">자주묻는 질문</Link></li>
                    </ul>
                    <div className="nav-actions">
                        <Link href="/create" className="nav-cta">부고장 만들기</Link>
                        <button className="nav-toggle" onClick={() => setSideMenuOpen(true)}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Side Menu */}
            <SideMenu isOpen={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />

            {/* FAQ Section */}
            <section className="faq" id="faq" style={{ paddingTop: '100px', minHeight: '100vh', background: '#f8f9fa' }}>
                <div className="container">
                    <div className="section-header" style={{ marginBottom: '16px' }}>
                        <h2 className="section-title" style={{ marginBottom: '4px' }}>자주 묻는 질문</h2>
                        <p className="section-subtitle" style={{ color: '#666', marginTop: '0' }}>
                            궁금하신 점이 있으시면 아래에서 확인해보세요
                        </p>
                    </div>
                    <div className="faq-list">
                        {faqData.map((item, index) => (
                            <div
                                key={index}
                                className={`faq-item ${openFaqs.has(index) ? 'active' : ''}`}
                                onClick={() => toggleFaq(index)}
                            >
                                <div className="faq-question">
                                    <span>{item.question}</span>
                                    <span className="faq-icon">{openFaqs.has(index) ? '−' : '+'}</span>
                                </div>
                                <div className="faq-answer">
                                    {item.answer}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
