'use client';

import './etiquette.css';

export default function EtiquettePage() {
    return (
        <div className="etiquette-page">
            {/* 헤더 */}
            <div className="etiquette-header">
                <div className="etiquette-header-content">
                    <h1>장례 복장 및 예절 가이드</h1>
                    <p>처음 조문을 가시는 분들을 위한 현대적인 안내</p>
                </div>
            </div>

            {/* 콘텐츠 */}
            <div className="etiquette-content">
                {/* 목차 */}
                <nav className="etiquette-toc">
                    <h3>목차</h3>
                    <ul>
                        <li><a href="#visitor-dress">1. 조문객 복장</a></li>
                        <li><a href="#mourner-dress">2. 상주 복장</a></li>
                        <li><a href="#visit-etiquette">3. 조문 예절</a></li>
                        <li><a href="#bow-method">4. 절하는 방법</a></li>
                        <li><a href="#condolence-money">5. 부의금 봉투 쓰는 법</a></li>
                        <li><a href="#greeting">6. 위로의 말</a></li>
                    </ul>
                </nav>

                {/* 조문객 복장 */}
                <section className="etiquette-section" id="visitor-dress">
                    <h2>1. 조문객 복장</h2>

                    <p>
                        요즘은 예전처럼 무조건 검정색만 고집하지 않아도 됩니다.
                        화려하지 않은 차분한 색상이라면 대부분 괜찮습니다.
                    </p>

                    <div className="etiquette-image">
                        <img src="/images/etiquette-visitor-dress.png" alt="조문객 복장 안내 - 남성, 여성 복장 예시" />
                    </div>

                    <h3>남성</h3>
                    <ul>
                        <li>어두운 색 정장이나 깔끔한 캐주얼</li>
                        <li>넥타이는 필수 아님, 착용한다면 어두운 색</li>
                        <li>운동화도 깔끔하면 OK (요즘은 자연스럽게 받아들임)</li>
                    </ul>

                    <h3>여성</h3>
                    <ul>
                        <li>검정, 남색, 회색 등 차분한 색상</li>
                        <li>바지, 치마 모두 OK</li>
                        <li>너무 화려한 액세서리나 향수만 피하면 됨</li>
                    </ul>

                    <div className="etiquette-highlight">
                        <p>
                            <strong>핵심:</strong> 고인과 유가족에 대한 예의를 표하는
                            마음이 중요합니다. 단정하고 수수한 차림이면 충분해요.
                        </p>
                    </div>
                </section>

                {/* 상주 복장 */}
                <section className="etiquette-section" id="mourner-dress">
                    <h2>2. 상주 복장</h2>

                    <p>
                        요즘 장례식장에서는 상복을 대여해주는 곳이 많아서
                        미리 준비하지 않아도 됩니다.
                    </p>

                    <div className="etiquette-image">
                        <img src="/images/etiquette-mourner-dress.png" alt="상주 복장 안내 - 한복, 정장 착용 예시" />
                    </div>

                    <h3>상주 복장 옵션</h3>
                    <ul>
                        <li><strong>전통 상복</strong>: 장례식장에서 대여 가능</li>
                        <li><strong>검정 정장</strong>: 요즘 가장 많이 선택하는 방식</li>
                        <li><strong>검정 한복</strong>: 원하시는 분만</li>
                    </ul>

                    <h3>리본 색상 의미</h3>
                    <table className="etiquette-table">
                        <thead>
                            <tr>
                                <th>구분</th>
                                <th>색상</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>자녀</td>
                                <td>흰색</td>
                            </tr>
                            <tr>
                                <td>손자녀</td>
                                <td>노란색</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* 조문 예절 */}
                <section className="etiquette-section" id="visit-etiquette">
                    <h2>3. 조문 예절</h2>

                    <p>
                        처음 조문을 가면 긴장될 수 있는데,
                        사실 별거 없어요. 아래 순서대로 하시면 됩니다.
                    </p>

                    <div className="etiquette-image">
                        <img src="/images/etiquette-visit-process.png" alt="조문 예절 순서 - 방명록, 분향, 위로인사" />
                    </div>

                    <h3>간단한 조문 순서</h3>
                    <ol>
                        <li><strong>접수대</strong>에서 방명록 작성 & 부의금 전달</li>
                        <li><strong>영정 앞</strong>에서 분향 또는 헌화</li>
                        <li><strong>절 2번</strong> (또는 묵념)</li>
                        <li><strong>상주에게</strong> 가볍게 절하고 위로의 말</li>
                        <li>식사 권유 시 함께하거나, 인사 후 퇴장</li>
                    </ol>

                    <div className="etiquette-highlight">
                        <p>
                            분향할 때 향에 불 붙이고 손으로 살짝 부쳐서 끄면 됩니다.
                            입으로 불면 안 된다고 알려져 있어요.
                        </p>
                    </div>
                </section>

                {/* 절하는 방법 */}
                <section className="etiquette-section" id="bow-method">
                    <h2>4. 절하는 방법</h2>

                    <p>
                        절은 2번이 기본입니다.
                        종교가 다르면 묵념이나 기도로 대신해도 전혀 문제없어요.
                    </p>



                    <h3>절하는 순서 (간단 버전)</h3>
                    <ol>
                        <li>양손을 모으고 (남자: 왼손 위 / 여자: 오른손 위)</li>
                        <li>무릎을 꿇고 깊이 엎드림</li>
                        <li>일어나서 한 번 더 반복</li>
                        <li>가볍게 목례 후 상주에게로</li>
                    </ol>

                    <div className="etiquette-highlight">
                        <p>
                            <strong>Tip:</strong> 긴장되면 앞사람 따라하면 됩니다.
                            마음이 담겨있으면 형식은 크게 중요하지 않아요.
                        </p>
                    </div>
                </section>

                {/* 부의금 봉투 */}
                <section className="etiquette-section" id="condolence-money">
                    <h2>5. 부의금 봉투 쓰는 법</h2>

                    <p>
                        봉투 앞면과 뒷면에 뭘 적어야 할지 몰라서 당황하셨죠?
                        간단합니다!
                    </p>

                    <div className="etiquette-image">
                        <img src="/images/etiquette-envelope.png" alt="부의금 봉투 뒷면 작성 예시" />
                    </div>

                    <h3>봉투 앞면</h3>
                    <ul>
                        <li><strong>부의(賻儀)</strong> 또는 <strong>근조(謹弔)</strong> 라고 씁니다</li>
                        <li>요즘은 안 써도 되는 경우 많음 (장례식장 봉투에 이미 인쇄됨)</li>
                    </ul>

                    <h3>봉투 뒷면</h3>
                    <ul>
                        <li><strong>왼쪽 하단</strong>에 본인 이름을 세로로 씁니다</li>
                        <li>단체일 경우: &apos;OO회사 일동&apos;, &apos;OO동기 일동&apos;</li>
                    </ul>

                    <div className="etiquette-highlight">
                        <p>
                            봉투 준비 못했으면 장례식장 접수대에서 받으면 됩니다.
                        </p>
                    </div>
                </section>

                {/* 조의 인사말 */}
                <section className="etiquette-section" id="greeting">
                    <h2>6. 위로의 말</h2>

                    <p>
                        뭐라고 해야 할지 모르겠을 땐,
                        말보다 손 한번 잡아드리는 게 더 큰 위로가 됩니다.
                    </p>



                    <h3>간단한 인사말</h3>
                    <ul>
                        <li>&quot;삼가 조의를 표합니다.&quot;</li>
                        <li>&quot;얼마나 힘드시겠어요.&quot;</li>
                        <li>&quot;뭐라 드릴 말씀이 없네요.&quot;</li>
                    </ul>

                    <h3>피하면 좋은 말</h3>
                    <ul>
                        <li>사망 원인이나 병세에 대한 질문</li>
                        <li>&quot;천수를 누리셨네요&quot; 같은 표현</li>
                        <li>유산이나 재산 관련 언급</li>
                    </ul>

                    <div className="etiquette-highlight">
                        <p>
                            어색해도 괜찮아요. 와주신 것만으로도
                            유가족에게는 큰 힘이 됩니다.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
