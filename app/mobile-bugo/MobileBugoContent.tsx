'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './mobile-bugo.css';

export default function MobileBugoContent() {
    const router = useRouter();
    const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

    const toggleFaq = (index: number) => {
        setOpenFaqs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) newSet.delete(index);
            else newSet.add(index);
            return newSet;
        });
    };

    return (
        <div className="mobile-bugo-page">
            {/* 헤더 */}
            <div className="mobile-bugo-header">
                <div className="mobile-bugo-header-content">
                    <h1>모바일 부고장 - 무료로 만들고 카카오톡으로 공유</h1>
                    <p>종이 부고장 대신, 3분 만에 품격 있는 모바일 부고장을 만드세요</p>
                </div>
            </div>

            {/* 콘텐츠 */}
            <div className="mobile-bugo-content">

                {/* 모바일 부고장이란? */}
                <section className="mobile-bugo-section" id="what-is">
                    <h2>모바일 부고장이란?</h2>
                    <p>
                        모바일 부고장은 스마트폰에서 열람할 수 있는 디지털 부고장입니다.
                        기존 종이 부고장이나 문자 메시지 대신, 링크 하나로 고인의 정보, 장례 일정,
                        장례식장 위치까지 한 번에 전달할 수 있습니다.
                    </p>
                    <p>
                        카카오톡, 문자, 밴드 등을 통해 간편하게 공유할 수 있어,
                        많은 지인에게 빠르고 정확하게 장례 소식을 전할 수 있습니다.
                    </p>
                    <div className="mobile-bugo-highlight">
                        <p>
                            마음부고에서는 누구나 <strong>완전 무료</strong>로 모바일 부고장을 만들 수 있습니다.
                            회원가입도, 앱 설치도 필요 없습니다.
                        </p>
                    </div>
                </section>

                {/* 종이 부고장 vs 모바일 부고장 */}
                <section className="mobile-bugo-section" id="compare">
                    <h2>종이 부고장 vs 모바일 부고장</h2>
                    <table className="mobile-bugo-compare">
                        <thead>
                            <tr>
                                <th>구분</th>
                                <th>종이 부고장</th>
                                <th>모바일 부고장</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>제작 시간</td>
                                <td>1~2시간</td>
                                <td>3분</td>
                            </tr>
                            <tr>
                                <td>비용</td>
                                <td>인쇄비 발생</td>
                                <td>무료</td>
                            </tr>
                            <tr>
                                <td>전달 방식</td>
                                <td>직접 전달</td>
                                <td>카카오톡, 문자</td>
                            </tr>
                            <tr>
                                <td>전달 속도</td>
                                <td>느림</td>
                                <td>즉시</td>
                            </tr>
                            <tr>
                                <td>장례식장 지도</td>
                                <td>별도 안내</td>
                                <td>지도 포함</td>
                            </tr>
                            <tr>
                                <td>수정 가능</td>
                                <td>불가</td>
                                <td>언제든 수정</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* 만드는 방법 */}
                <section className="mobile-bugo-section" id="how-to">
                    <h2>모바일 부고장 만드는 법</h2>
                    <p>마음부고에서 3분이면 모바일 부고장이 완성됩니다.</p>

                    <div className="mobile-bugo-steps">
                        <div className="mobile-bugo-step">
                            <div className="mobile-bugo-step-number">1</div>
                            <div className="mobile-bugo-step-text">
                                <h4>템플릿 선택</h4>
                                <p>4가지 품격 있는 디자인 중 선택하세요</p>
                            </div>
                        </div>
                        <div className="mobile-bugo-step">
                            <div className="mobile-bugo-step-number">2</div>
                            <div className="mobile-bugo-step-text">
                                <h4>정보 입력</h4>
                                <p>고인 정보, 상주, 장례 일정을 입력하세요</p>
                            </div>
                        </div>
                        <div className="mobile-bugo-step">
                            <div className="mobile-bugo-step-number">3</div>
                            <div className="mobile-bugo-step-text">
                                <h4>장례식장 검색</h4>
                                <p>전국 1,100여 개 장례식장에서 선택하세요</p>
                            </div>
                        </div>
                        <div className="mobile-bugo-step">
                            <div className="mobile-bugo-step-number">4</div>
                            <div className="mobile-bugo-step-text">
                                <h4>카카오톡 공유</h4>
                                <p>완성된 부고장을 카카오톡으로 바로 공유하세요</p>
                            </div>
                        </div>
                    </div>

                    <button
                        className="mobile-bugo-cta"
                        onClick={() => router.push('/create')}
                    >
                        무료로 모바일 부고장 만들기
                    </button>
                </section>

                {/* 마음부고 특징 */}
                <section className="mobile-bugo-section" id="features">
                    <h2>마음부고 모바일 부고장 특징</h2>

                    <h3>🎨 4가지 세련된 템플릿</h3>
                    <p>고인의 품격을 지키는 정중한 디자인 템플릿을 제공합니다.</p>

                    <h3>💰 완전 무료</h3>
                    <p>모바일 부고장 제작부터 공유까지 모든 기능이 무료입니다. 숨겨진 비용도 없습니다.</p>

                    <h3>🚫 광고 없음</h3>
                    <p>부고장에 광고가 노출되지 않습니다. 장례라는 상황에 맞는 격식을 지킵니다.</p>

                    <h3>📱 회원가입 불필요</h3>
                    <p>별도의 회원가입이나 앱 설치 없이 바로 모바일 부고장을 만들 수 있습니다.</p>

                    <h3>✏️ 언제든 수정 가능</h3>
                    <p>장례 일정이 변경되더라도 언제든 수정할 수 있습니다.</p>

                    <h3>🗺️ 장례식장 지도 포함</h3>
                    <p>장례식장 위치와 길찾기 기능이 부고장에 자동으로 포함됩니다.</p>
                </section>

                {/* 활용 사례 */}
                <section className="mobile-bugo-section" id="use-cases">
                    <h2>이런 분들에게 추천합니다</h2>
                    <ul>
                        <li><strong>급하게 부고장을 보내야 할 때</strong> — 3분이면 완성, 즉시 공유</li>
                        <li><strong>무빈소 장례, 가족장</strong> — 장례식장 없이도 모바일 부고장 제작 가능</li>
                        <li><strong>지방이나 제주에서 장례 시</strong> — 원거리 지인에게 쉽게 전달</li>
                        <li><strong>많은 분들에게 알려야 할 때</strong> — 카카오톡으로 한 번에 공유</li>
                        <li><strong>비용 부담 없이 부고장을 보내고 싶을 때</strong> — 완전 무료</li>
                    </ul>
                </section>

                {/* FAQ */}
                <section className="mobile-bugo-section" id="faq">
                    <h2>자주 묻는 질문</h2>
                    <div className="mobile-bugo-faq">
                        {[
                            { q: '모바일 부고장은 정말 무료인가요?', a: '네, 마음부고의 모든 기능은 완전히 무료입니다. 부고장 제작, 공유, 수정까지 비용이 전혀 들지 않습니다.' },
                            { q: '모바일 부고장은 어떻게 공유하나요?', a: '완성된 부고장의 링크를 카카오톡, 문자, 밴드 등으로 공유할 수 있습니다. 공유 버튼을 누르면 바로 전달됩니다.' },
                            { q: '장례식장이 없어도 만들 수 있나요?', a: '네, 무빈소 장례나 가족장의 경우에도 모바일 부고장을 제작할 수 있습니다. 장례식장 정보는 선택사항입니다.' },
                            { q: '부고장 수정은 가능한가요?', a: '네, 작성 시 입력한 비밀번호로 언제든지 수정할 수 있습니다. 일정이 변경되어도 바로 업데이트됩니다.' },
                            { q: '부고장은 얼마나 유지되나요?', a: '생성된 모바일 부고장은 발인 후 30일까지 열람 가능합니다. 이후에는 개인정보 보호를 위해 비공개 처리됩니다.' },
                            { q: '회원가입이 필요한가요?', a: '아닙니다. 별도의 회원가입이나 앱 설치 없이 바로 모바일 부고장을 만들 수 있습니다.' },
                        ].map((faq, i) => (
                            <div
                                key={i}
                                className={`mobile-bugo-faq-item ${openFaqs.has(i) ? 'active' : ''}`}
                                onClick={() => toggleFaq(i)}
                            >
                                <div className="mobile-bugo-faq-q">
                                    <span>{faq.q}</span>
                                    <span>{openFaqs.has(i) ? '−' : '+'}</span>
                                </div>
                                <div className="mobile-bugo-faq-a">{faq.a}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 관련 가이드 */}
                <section className="mobile-bugo-section" id="related-guides">
                    <h2>장례 관련 가이드</h2>
                    <p>처음 장례를 준비하시는 분들을 위한 안내입니다.</p>
                    <div className="mobile-bugo-links">
                        <Link href="/guide/procedure" className="mobile-bugo-link">
                            <span className="mobile-bugo-link-icon">📋</span>
                            장례 절차 안내
                        </Link>
                        <Link href="/guide/cost" className="mobile-bugo-link">
                            <span className="mobile-bugo-link-icon">💰</span>
                            장례 비용 안내
                        </Link>
                        <Link href="/guide/etiquette" className="mobile-bugo-link">
                            <span className="mobile-bugo-link-icon">🙏</span>
                            장례 예절 가이드
                        </Link>
                        <Link href="/guide/funeral-home" className="mobile-bugo-link">
                            <span className="mobile-bugo-link-icon">🏥</span>
                            장례식장 찾기
                        </Link>
                    </div>
                </section>

                {/* 하단 CTA */}
                <button
                    className="mobile-bugo-cta"
                    onClick={() => router.push('/create')}
                >
                    지금 무료로 모바일 부고장 만들기
                </button>

            </div>
        </div>
    );
}
