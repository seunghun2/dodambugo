'use client';

import Link from 'next/link';
import './cost.css';

export default function CostContent() {
    return (
        <div className="cost-page">
            {/* 헤더 */}
            <div className="cost-header">
                <div className="cost-header-content">
                    <h1>장례 비용 가이드</h1>
                    <p>항목별 예상 비용을 미리 확인해보세요</p>
                </div>
            </div>

            {/* 콘텐츠 */}
            <div className="cost-content">
                {/* 목차 */}
                <nav className="cost-toc">
                    <h3>목차</h3>
                    <ul>
                        <li><a href="#total">1. 장례 비용 전체 요약</a></li>
                        <li><a href="#funeral-hall">2. 장례식장 비용</a></li>
                        <li><a href="#supplies">3. 장례 용품 비용</a></li>
                        <li><a href="#cremation">4. 화장 및 장지 비용</a></li>
                        <li><a href="#sangjo">5. 상조 서비스</a></li>
                        <li><a href="#save-tips">6. 비용 절약 팁</a></li>
                    </ul>
                </nav>

                {/* 전체 요약 */}
                <section className="cost-section" id="total">
                    <h2>1. 장례 비용 전체 요약</h2>

                    <p>
                        장례 비용은 장례식장, 용품, 장지 등에 따라 크게 달라집니다.
                        일반적인 3일장 기준으로 평균 비용을 안내해 드립니다.
                    </p>

                    <div className="cost-image">
                        <img src="/images/cost-overview.png" alt="장례 비용 구성 - 장례식장, 장례용품, 화장/매장, 음식/접대, 기타" />
                    </div>

                    <div className="cost-summary">
                        <p>3일장 평균 총 비용</p>
                        <p className="cost-amount">약 1,000만 ~ 1,500만원</p>
                    </div>

                    <table className="cost-table">
                        <thead>
                            <tr>
                                <th>항목</th>
                                <th>평균 비용</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>장례식장 (빈소)</td>
                                <td>150~400만원</td>
                            </tr>
                            <tr>
                                <td>장례 용품</td>
                                <td>200~500만원</td>
                            </tr>
                            <tr>
                                <td>화장 / 매장</td>
                                <td>30~100만원</td>
                            </tr>
                            <tr>
                                <td>봉안 / 자연장</td>
                                <td>50~300만원</td>
                            </tr>
                            <tr>
                                <td>음식 / 접대</td>
                                <td>200~400만원</td>
                            </tr>
                            <tr>
                                <td>기타 (조화, 인건비 등)</td>
                                <td>100~200만원</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="cost-highlight">
                        <p>
                            <strong>참고:</strong> 위 금액은 평균적인 범위이며,
                            지역, 장례식장 등급, 장례 방식에 따라 크게 달라질 수 있습니다.
                        </p>
                    </div>
                </section>

                {/* 장례식장 비용 */}
                <section className="cost-section" id="funeral-hall">
                    <h2>2. 장례식장 비용</h2>

                    <p>
                        장례식장은 병원 장례식장과 전문 장례식장으로 나뉘며,
                        시설 수준에 따라 비용 차이가 큽니다.
                    </p>

                    <div className="cost-image">
                        <img src="/images/cost-funeral-hall.png" alt="장례식장 비용 - 빈소 공간, 제단 장식, 식사, 주차장" />
                    </div>

                    <h3>빈소 사용료 (3일 기준)</h3>
                    <table className="cost-table">
                        <thead>
                            <tr>
                                <th>구분</th>
                                <th>비용 범위</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>병원 장례식장 (일반)</td>
                                <td>100~200만원</td>
                            </tr>
                            <tr>
                                <td>병원 장례식장 (특실)</td>
                                <td>200~350만원</td>
                            </tr>
                            <tr>
                                <td>전문 장례식장</td>
                                <td>150~400만원</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3>빈소 비용에 포함되는 항목</h3>
                    <ul>
                        <li>빈소 공간 대여</li>
                        <li>제단 설치 및 장식</li>
                        <li>냉방/난방 시설</li>
                        <li>주차장 이용</li>
                        <li>안치실 사용 (별도인 경우도 있음)</li>
                    </ul>

                    <h3>별도 청구될 수 있는 항목</h3>
                    <ul>
                        <li><strong>안치실</strong>: 1일 5~15만원</li>
                        <li><strong>식당 이용</strong>: 1인당 1~2만원</li>
                        <li><strong>접객 도우미</strong>: 1일 10~15만원</li>
                    </ul>

                    <div className="cost-highlight">
                        <p>
                            <strong>Tip:</strong> 장례식장 선택 시 빈소 사용료에
                            어떤 항목이 포함되어 있는지 꼭 확인하세요.
                            식사비가 별도인 경우가 많습니다.
                        </p>
                    </div>
                </section>

                {/* 장례 용품 */}
                <section className="cost-section" id="supplies">
                    <h2>3. 장례 용품 비용</h2>

                    <p>
                        관, 수의, 상복 등 장례에 필요한 용품 비용입니다.
                        상조 서비스를 이용하면 패키지로 제공되기도 합니다.
                    </p>

                    <table className="cost-table">
                        <thead>
                            <tr>
                                <th>용품</th>
                                <th>비용 범위</th>
                                <th>비고</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>관 (목관)</td>
                                <td>50~200만원</td>
                                <td>오동나무, 향나무 등</td>
                            </tr>
                            <tr>
                                <td>수의</td>
                                <td>30~150만원</td>
                                <td>삼베, 명주 등</td>
                            </tr>
                            <tr>
                                <td>상복 대여</td>
                                <td>3~10만원</td>
                                <td>1벌 기준</td>
                            </tr>
                            <tr>
                                <td>영정사진</td>
                                <td>3~10만원</td>
                                <td>액자 포함</td>
                            </tr>
                            <tr>
                                <td>염습비</td>
                                <td>30~50만원</td>
                                <td>전문 염습사 비용</td>
                            </tr>
                            <tr>
                                <td>장의차량</td>
                                <td>30~80만원</td>
                                <td>거리에 따라 변동</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="cost-highlight">
                        <p>
                            <strong>참고:</strong> 장례식장에서 용품 패키지를 제공하는 경우가 많으니,
                            개별 구매 전에 패키지 가격을 먼저 비교해보세요.
                        </p>
                    </div>
                </section>

                {/* 화장 및 장지 */}
                <section className="cost-section" id="cremation">
                    <h2>4. 화장 및 장지 비용</h2>

                    <p>
                        요즘은 화장 후 봉안당이나 자연장을 선택하는 비율이
                        90% 이상입니다.
                    </p>

                    <div className="cost-image">
                        <img src="/images/cost-cremation.png" alt="장지 선택 - 봉안당, 자연장, 매장" />
                    </div>

                    <h3>화장 비용</h3>
                    <table className="cost-table">
                        <thead>
                            <tr>
                                <th>시설</th>
                                <th>비용</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>공설 화장시설</td>
                                <td>5~20만원</td>
                            </tr>
                            <tr>
                                <td>사설 화장시설</td>
                                <td>40~80만원</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3>봉안 (납골) 비용</h3>
                    <table className="cost-table">
                        <thead>
                            <tr>
                                <th>유형</th>
                                <th>비용</th>
                                <th>기간</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>공설 봉안당</td>
                                <td>20~50만원</td>
                                <td>15~30년</td>
                            </tr>
                            <tr>
                                <td>사설 봉안당</td>
                                <td>100~500만원</td>
                                <td>시설마다 다름</td>
                            </tr>
                            <tr>
                                <td>자연장 (수목장)</td>
                                <td>50~200만원</td>
                                <td>시설마다 다름</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3>매장 비용</h3>
                    <ul>
                        <li><strong>공설 묘지</strong>: 50~150만원</li>
                        <li><strong>사설 묘지</strong>: 200~1,000만원 이상</li>
                        <li><strong>종중 묘지</strong>: 무료~소액</li>
                    </ul>

                    <div className="cost-highlight">
                        <p>
                            <strong>Tip:</strong> 공설 화장시설은 저렴하지만 예약 대기가 길 수 있습니다.
                            사전에 예약 가능 여부를 확인하세요.
                        </p>
                    </div>
                </section>

                {/* 상조 서비스 */}
                <section className="cost-section" id="sangjo">
                    <h2>5. 상조 서비스</h2>

                    <p>
                        상조 서비스는 월 납입금을 내고 장례 시 용품과 서비스를
                        제공받는 방식입니다. 가입 여부에 따라 비용이 크게 달라질 수 있어요.
                    </p>

                    <h3>상조 서비스 유형</h3>
                    <table className="cost-table">
                        <thead>
                            <tr>
                                <th>유형</th>
                                <th>총 납입금</th>
                                <th>포함 내용</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>기본형</td>
                                <td>200~300만원</td>
                                <td>관, 수의, 장의차량 등 기본 용품</td>
                            </tr>
                            <tr>
                                <td>표준형</td>
                                <td>300~500만원</td>
                                <td>기본 + 염습, 인력 지원</td>
                            </tr>
                            <tr>
                                <td>프리미엄</td>
                                <td>500만원 이상</td>
                                <td>전 과정 케어 + 프리미엄 용품</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3>상조 가입 시 확인 사항</h3>
                    <ul>
                        <li><strong>공정거래위원회 등록 여부</strong> 확인 필수</li>
                        <li>해약 시 <strong>환급률</strong> 반드시 확인 (보통 납입금의 80~85%)</li>
                        <li>제공 용품의 <strong>등급과 구체적 내역</strong> 비교</li>
                        <li>장례식장 <strong>제휴 여부</strong> 확인</li>
                    </ul>

                    <div className="cost-highlight">
                        <p>
                            <strong>참고:</strong> 상조에 가입하지 않았더라도 장례식장에서
                            용품과 서비스를 개별로 이용할 수 있습니다.
                            가격 비교 후 결정하시는 게 좋아요.
                        </p>
                    </div>
                </section>

                {/* 비용 절약 팁 */}
                <section className="cost-section" id="save-tips">
                    <h2>6. 비용 절약 팁</h2>

                    <p>
                        장례는 갑작스럽게 치르는 경우가 많아 비용에 대한 판단이 어렵습니다.
                        아래 팁을 참고하시면 합리적인 비용으로 장례를 치르실 수 있어요.
                    </p>

                    <h3>비교하고 선택하세요</h3>
                    <ul>
                        <li>장례식장 <strong>2~3곳 비용을 비교</strong>한 후 결정하세요</li>
                        <li>용품은 <strong>패키지 vs 개별 구매</strong> 가격을 비교하세요</li>
                        <li>상조 가입자라면 <strong>추가 비용 항목</strong>을 꼭 확인하세요</li>
                    </ul>

                    <h3>불필요한 비용 줄이기</h3>
                    <ul>
                        <li>조화는 지인들이 보내주는 경우가 많으므로 <strong>자체 주문은 최소화</strong></li>
                        <li>식사는 <strong>장례식장 식당보다 외부 케이터링</strong>이 저렴할 수 있음</li>
                        <li>영정사진은 <strong>미리 준비</strong>해두면 급하게 맡기는 비용을 아낄 수 있음</li>
                    </ul>

                    <h3>지원금 확인하기</h3>
                    <ul>
                        <li><strong>국민건강보험 장제비</strong>: 사망 시 80만원 지급</li>
                        <li><strong>국민연금 사망일시금</strong>: 가입 기간에 따라 지급</li>
                        <li><strong>기초생활수급자</strong>: 장제급여 80만원</li>
                        <li><strong>보훈대상자</strong>: 국립묘지 안장 시 무료</li>
                    </ul>

                    <div className="cost-highlight">
                        <p>
                            장례 후 국민건강보험공단에 장제비를 신청하면
                            80만원을 지급받을 수 있습니다. 잊지 말고 꼭 신청하세요.
                        </p>
                    </div>
                </section>

                {/* 관련 가이드 링크 */}
                <section className="cost-section">
                    <h2>관련 장례 가이드</h2>
                    <ul>
                        <li><Link href="/guide/procedure">장례 절차 가이드 - 임종부터 발인까지 3일장 안내</Link></li>
                        <li><Link href="/guide/etiquette">장례 예절 가이드 - 조문 복장, 절하는 법, 부의금</Link></li>
                        <li><Link href="/guide/funeral-home">전국 장례식장 찾기 - 1,100여 개 장례식장 검색</Link></li>
                        <li><Link href="/mobile-bugo">모바일 부고장 만들기 - 무료, 3분 완성</Link></li>
                    </ul>
                    <div className="cost-highlight">
                        <p>
                            장례 소식을 전해야 하시나요? <Link href="/mobile-bugo"><strong>무료 모바일 부고장</strong></Link>을 3분 만에 만들고 카카오톡으로 공유하세요.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
