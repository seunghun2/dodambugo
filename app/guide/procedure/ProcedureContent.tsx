'use client';

import Link from 'next/link';
import './procedure.css';

export default function ProcedureContent() {
    return (
        <div className="procedure-page">
            {/* 헤더 */}
            <div className="procedure-header">
                <div className="procedure-header-content">
                    <h1>장례 절차 가이드</h1>
                    <p>임종부터 장례 마무리까지 한눈에 보는 안내</p>
                </div>
            </div>

            {/* 콘텐츠 */}
            <div className="procedure-content">
                {/* 목차 */}
                <nav className="procedure-toc">
                    <h3>목차</h3>
                    <ul>
                        <li><a href="#overview">1. 장례 절차 전체 흐름</a></li>
                        <li><a href="#day1">2. 1일차 – 임종 당일</a></li>
                        <li><a href="#day2">3. 2일차 – 입관 및 조문</a></li>
                        <li><a href="#day3">4. 3일차 – 발인 및 장지</a></li>
                        <li><a href="#after">5. 장례 후 절차</a></li>
                        <li><a href="#checklist">6. 준비물 체크리스트</a></li>
                    </ul>
                </nav>

                {/* 장례 절차 전체 흐름 */}
                <section className="procedure-section" id="overview">
                    <h2>1. 장례 절차 전체 흐름</h2>

                    <p>
                        한국의 장례는 대부분 <strong>3일장</strong>으로 진행됩니다.
                        임종 당일부터 발인까지 3일 동안 진행되며,
                        장례식장에서 많은 부분을 안내해주기 때문에 너무 걱정하지 않으셔도 됩니다.
                    </p>

                    <div className="procedure-image">
                        <img src="/images/procedure-overview.png" alt="장례 절차 전체 흐름 - 1일차 임종, 2일차 조문, 3일차 발인" />
                    </div>

                    <table className="procedure-table">
                        <thead>
                            <tr>
                                <th>일차</th>
                                <th>주요 절차</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>1일차</strong></td>
                                <td>임종 → 장례식장 이동 → 안치 → 빈소 설치</td>
                            </tr>
                            <tr>
                                <td><strong>2일차</strong></td>
                                <td>입관 → 조문 접수 → 조문객 맞이</td>
                            </tr>
                            <tr>
                                <td><strong>3일차</strong></td>
                                <td>발인제 → 운구 → 화장/매장 → 마무리</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="procedure-highlight">
                        <p>
                            <strong>참고:</strong> 요즘은 5일장, 7일장을 하는 경우도 있으며,
                            가족장이나 무빈소 장례 등 다양한 형태가 있습니다.
                        </p>
                    </div>
                </section>

                {/* 1일차 */}
                <section className="procedure-section" id="day1">
                    <h2>2. 1일차 – 임종 당일</h2>

                    <p>
                        갑작스러운 상황에서 가장 당황스러운 날입니다.
                        하지만 장례식장에 연락하면 대부분의 절차를 안내받을 수 있어요.
                    </p>

                    <div className="procedure-image">
                        <img src="/images/procedure-day1.png" alt="1일차 절차 - 사망진단서, 장례식장 준비, 친지 연락, 제단 설치" />
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">1</span>
                        <div className="procedure-step-text">
                            <strong>임종 확인</strong>
                            <span>병원에서 임종 시 사망진단서를 발급받습니다. 자택 사망 시 119에 연락합니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">2</span>
                        <div className="procedure-step-text">
                            <strong>장례식장 선택 및 연락</strong>
                            <span>병원 장례식장 또는 원하시는 장례식장에 연락하여 빈소를 예약합니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">3</span>
                        <div className="procedure-step-text">
                            <strong>고인 이송 및 안치</strong>
                            <span>장례식장으로 고인을 모시고 안치실에 안치합니다. 장례식장에서 도와줍니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">4</span>
                        <div className="procedure-step-text">
                            <strong>장례 일정 협의</strong>
                            <span>장례지도사와 장례 일정, 규모, 방식(화장/매장), 비용 등을 상의합니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">5</span>
                        <div className="procedure-step-text">
                            <strong>빈소 설치</strong>
                            <span>영정사진, 제단, 상복 등을 준비하고 빈소를 설치합니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">6</span>
                        <div className="procedure-step-text">
                            <strong>부고 알림</strong>
                            <span>가족, 친지, 지인에게 부고를 알립니다. 마음부고를 이용하시면 간편하게 전달할 수 있습니다.</span>
                        </div>
                    </div>

                    <div className="procedure-highlight">
                        <p>
                            <strong>Tip:</strong> 사망진단서는 여러 장 발급받아 두세요.
                            사망신고, 보험 청구 등에 필요합니다. (보통 10장 정도 권장)
                        </p>
                    </div>
                </section>

                {/* 2일차 */}
                <section className="procedure-section" id="day2">
                    <h2>3. 2일차 – 입관 및 조문</h2>

                    <p>
                        본격적으로 조문객을 맞이하는 날입니다.
                        입관 절차를 마치고 난 후 조문을 받습니다.
                    </p>

                    <div className="procedure-image">
                        <img src="/images/procedure-day2.png" alt="2일차 절차 - 염습, 방명록 접수, 조문객 맞이" />
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">1</span>
                        <div className="procedure-step-text">
                            <strong>염습 및 입관</strong>
                            <span>고인을 깨끗이 씻기고(염습) 수의를 입혀 관에 모십니다. 전문 염습사가 진행하며, 유가족이 참관할 수 있습니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">2</span>
                        <div className="procedure-step-text">
                            <strong>조문 접수</strong>
                            <span>조문객이 방문하면 방명록 작성과 부의금을 접수합니다. 접수를 도와줄 분을 미리 정하면 좋습니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">3</span>
                        <div className="procedure-step-text">
                            <strong>조문객 맞이</strong>
                            <span>상주는 빈소 옆에서 조문객을 맞이하고 감사의 인사를 드립니다.</span>
                        </div>
                    </div>

                    <div className="procedure-highlight">
                        <p>
                            <strong>Tip:</strong> 부의금 관리를 위해 접수 담당자를 2명 이상 지정하고,
                            부의록을 꼼꼼히 기록하는 것이 좋습니다.
                        </p>
                    </div>
                </section>

                {/* 3일차 */}
                <section className="procedure-section" id="day3">
                    <h2>4. 3일차 – 발인 및 장지</h2>

                    <p>
                        마지막 날입니다. 고인을 모시고 장지로 향합니다.
                    </p>

                    <div className="procedure-image">
                        <img src="/images/procedure-day3.png" alt="3일차 절차 - 발인제, 영구차, 화장장 및 봉안당" />
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">1</span>
                        <div className="procedure-step-text">
                            <strong>발인제</strong>
                            <span>고인과의 마지막 인사를 나누는 의식입니다. 종교에 따라 형식이 다를 수 있습니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">2</span>
                        <div className="procedure-step-text">
                            <strong>운구</strong>
                            <span>관을 영구차에 싣고 장지(화장장 또는 묘지)로 이동합니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">3</span>
                        <div className="procedure-step-text">
                            <strong>화장 또는 매장</strong>
                            <span>화장의 경우 화장장에서 진행하며, 약 1~2시간 소요됩니다. 매장의 경우 묘지에서 하관 절차를 진행합니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">4</span>
                        <div className="procedure-step-text">
                            <strong>봉안 또는 자연장</strong>
                            <span>화장 후 유골을 봉안당에 모시거나 자연장(수목장 등)으로 진행합니다.</span>
                        </div>
                    </div>

                    <div className="procedure-step-item">
                        <span className="procedure-step-number">5</span>
                        <div className="procedure-step-text">
                            <strong>마무리</strong>
                            <span>장례식장 정산, 빈소 철거 등 마무리 절차를 진행합니다.</span>
                        </div>
                    </div>

                    <div className="procedure-highlight">
                        <p>
                            <strong>참고:</strong> 화장 예약은 사망 후 빠르게 해야 합니다.
                            인기 있는 화장시설은 2~3일 대기가 생길 수 있어요.
                        </p>
                    </div>
                </section>

                {/* 장례 후 절차 */}
                <section className="procedure-section" id="after">
                    <h2>5. 장례 후 절차</h2>

                    <p>
                        장례가 끝난 후에도 처리해야 할 행정적인 일들이 있습니다.
                        기한이 있는 것들이 있으니 미리 알아두면 좋아요.
                    </p>

                    <table className="procedure-table">
                        <thead>
                            <tr>
                                <th>절차</th>
                                <th>기한</th>
                                <th>장소</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>사망신고</td>
                                <td>1개월 이내</td>
                                <td>주민센터</td>
                            </tr>
                            <tr>
                                <td>상속 재산 조회</td>
                                <td>사망일로부터 1년</td>
                                <td>정부24 (안심상속)</td>
                            </tr>
                            <tr>
                                <td>상속세 신고</td>
                                <td>6개월 이내</td>
                                <td>세무서</td>
                            </tr>
                            <tr>
                                <td>국민연금 유족급여</td>
                                <td>5년 이내</td>
                                <td>국민연금공단</td>
                            </tr>
                            <tr>
                                <td>보험금 청구</td>
                                <td>3년 이내</td>
                                <td>해당 보험사</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="procedure-highlight">
                        <p>
                            <strong>Tip:</strong> 정부24 &apos;안심상속 원스톱 서비스&apos;를 이용하면
                            고인의 재산(금융, 부동산, 자동차 등)을 한번에 조회할 수 있습니다.
                        </p>
                    </div>

                    <h3>사망신고 시 필요 서류</h3>
                    <ul>
                        <li>사망진단서 (또는 시체검안서)</li>
                        <li>신고인 신분증</li>
                        <li>사망신고서 (주민센터 비치)</li>
                    </ul>
                </section>

                {/* 준비물 체크리스트 */}
                <section className="procedure-section" id="checklist">
                    <h2>6. 준비물 체크리스트</h2>

                    <p>
                        장례를 처음 치르시는 분들을 위해
                        미리 준비하면 좋은 것들을 정리했습니다.
                    </p>

                    <h3>필수 준비물</h3>
                    <ul>
                        <li><strong>사망진단서</strong> – 여러 장 발급 (10장 권장)</li>
                        <li><strong>영정사진</strong> – 고인의 최근 사진 (장례식장에서 확대제작)</li>
                        <li><strong>고인 옷</strong> – 수의 또는 고인이 좋아하던 옷</li>
                        <li><strong>상주 신분증</strong> – 각종 서류 처리용</li>
                        <li><strong>인감도장/인감증명</strong> – 행정 처리 시 필요</li>
                    </ul>

                    <h3>참고 사항</h3>
                    <ul>
                        <li><strong>상복</strong> – 장례식장에서 대여 가능</li>
                        <li><strong>식사</strong> – 장례식장 식당 이용 또는 외부 음식 주문</li>
                        <li><strong>화환/근조화환</strong> – 마음부고를 통해 온라인 주문 가능</li>
                        <li><strong>부고 알림</strong> – 마음부고에서 간편하게 제작 및 공유</li>
                    </ul>

                    <div className="procedure-highlight">
                        <p>
                            장례식장에서 대부분의 물품을 준비해주므로,
                            영정사진과 사망진단서만 챙기시면 됩니다.
                            나머지는 장례지도사와 상의하며 진행하시면 돼요.
                        </p>
                    </div>
                </section>

                {/* 관련 가이드 링크 */}
                <section className="procedure-section">
                    <h2>관련 장례 가이드</h2>
                    <ul>
                        <li><Link href="/guide/cost">장례 비용 가이드 - 항목별 예상 비용 총정리</Link></li>
                        <li><Link href="/guide/etiquette">장례 예절 가이드 - 조문 복장, 절하는 법, 부의금</Link></li>
                        <li><Link href="/guide/funeral-home">전국 장례식장 찾기 - 1,100여 개 장례식장 검색</Link></li>
                        <li><Link href="/mobile-bugo">모바일 부고장 만들기 - 무료, 3분 완성</Link></li>
                    </ul>
                    <div className="procedure-highlight">
                        <p>
                            장례 소식을 전해야 하시나요? <Link href="/mobile-bugo"><strong>무료 모바일 부고장</strong></Link>을 3분 만에 만들고 카카오톡으로 공유하세요.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
