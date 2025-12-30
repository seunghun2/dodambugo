'use client';

import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="legal-page">
            <header className="legal-header">
                <Link href="/" className="back-btn">
                    <span className="material-symbols-outlined">chevron_left</span>
                </Link>
                <h1>개인정보처리방침</h1>
            </header>

            <main className="legal-content">
                <section className="terms-section">
                    <p className="privacy-intro">
                        도담부고(이하 "회사")는 이용자의 개인정보를 중요시하며, "개인정보 보호법" 등 관련 법규를 준수하고 있습니다.
                        회사는 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
                        개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>1. 수집하는 개인정보 항목 및 수집방법</h2>
                    <h3>가. 수집하는 개인정보 항목</h3>
                    <p>회사는 부고장 작성 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
                    <ul>
                        <li><strong>필수항목:</strong> 신청자 성명, 신청자 연락처, 고인 성명, 연세, 성별, 상주 이름 및 관계, 상주 연락처, 장례식장 정보, 장례 일정</li>
                        <li><strong>선택항목:</strong> 고인 종교, 호실, 상세주소, 안내 메시지, 장지 정보, 부의금 계좌정보(예금주, 은행명, 계좌번호)</li>
                        <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 로그, IP 주소, 쿠키, 접속 기기 정보</li>
                    </ul>

                    <h3>나. 개인정보 수집방법</h3>
                    <ul>
                        <li>웹사이트를 통한 부고장 작성 시 이용자가 직접 입력</li>
                        <li>제휴/문의 폼을 통한 문의 시 직접 입력</li>
                        <li>서비스 이용 과정에서 자동으로 생성되어 수집</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>2. 개인정보의 수집 및 이용목적</h2>
                    <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다:</p>
                    <h3>가. 서비스 제공</h3>
                    <ul>
                        <li>부고장 작성 및 생성</li>
                        <li>부고장 조회 서비스 제공</li>
                        <li>부고 정보 공유 및 전송</li>
                        <li>본인 확인 및 부고장 관리</li>
                    </ul>

                    <h3>나. 서비스 개선 및 마케팅</h3>
                    <ul>
                        <li>신규 서비스 개발 및 맞춤 서비스 제공</li>
                        <li>서비스 이용 통계 및 분석</li>
                        <li>이벤트 및 광고성 정보 제공 (동의한 경우에 한함)</li>
                    </ul>

                    <h3>다. 고객 지원</h3>
                    <ul>
                        <li>문의사항 및 불만처리</li>
                        <li>공지사항 전달</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>3. 개인정보의 보유 및 이용기간</h2>
                    <ul>
                        <li><strong>부고장 정보:</strong> 작성일로부터 1년 후 자동 삭제 또는 이용자 삭제 요청 시 즉시 삭제</li>
                        <li><strong>문의 정보:</strong> 문의 처리 완료 후 1년</li>
                        <li><strong>서비스 이용 기록:</strong> 3개월 (통신비밀보호법에 따라 보관)</li>
                        <li><strong>부정 이용 기록:</strong> 5년 (전자상거래법에 따라 보관)</li>
                    </ul>
                    <p>단, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 관계 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.</p>
                </section>

                <section className="terms-section">
                    <h2>4. 개인정보의 파기절차 및 방법</h2>
                    <h3>가. 파기절차</h3>
                    <p>이용자가 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.</p>

                    <h3>나. 파기방법</h3>
                    <ul>
                        <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
                        <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>5. 개인정보 제공 및 공유</h2>
                    <p>회사는 이용자의 개인정보를 "개인정보의 수집 및 이용목적"에서 고지한 범위 내에서 사용하며, 이용자의 사전 동의 없이는 동 범위를 초과하여 이용하거나 원칙적으로 외부에 공개하지 않습니다.</p>
                    <p>다만, 아래의 경우에는 예외로 합니다:</p>
                    <ul>
                        <li>이용자가 사전에 동의한 경우</li>
                        <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                        <li>통계작성, 학술연구나 시장조사를 위하여 특정 개인을 식별할 수 없는 형태로 제공하는 경우</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>6. 검색엔진 노출 관련 안내</h2>
                    <p>회사는 이용자가 자발적으로 입력·공개한 부고 정보가 외부 검색엔진(네이버, 구글 등)에 의해 수집·노출될 수 있으며, 회사는 이를 직접 통제할 수 없습니다.</p>
                    <p>이에 따라 이용자가 직접 입력한 내용의 공개·노출에 대해서는 이용자 본인의 책임으로 합니다.</p>
                    <p><strong>회사는 다음과 같은 보호조치를 이행합니다:</strong></p>
                    <ul>
                        <li>robots.txt 설정을 통한 검색엔진 크롤링 제한</li>
                        <li>민감정보(계좌번호 등) 마스킹 처리</li>
                        <li>부고장 작성 후 1년 경과 시 자동 삭제</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>7. 이용자의 권리와 행사방법</h2>
                    <p>이용자는 언제든지 자신의 개인정보에 대해 다음의 권리를 행사할 수 있습니다:</p>
                    <ul>
                        <li><strong>열람 요청:</strong> 본인의 개인정보 열람을 요청할 수 있습니다.</li>
                        <li><strong>정정 요청:</strong> 개인정보의 오류에 대한 정정을 요청할 수 있습니다.</li>
                        <li><strong>삭제 요청:</strong> 개인정보의 삭제를 요청할 수 있습니다.</li>
                        <li><strong>처리정지 요청:</strong> 개인정보 처리의 정지를 요청할 수 있습니다.</li>
                    </ul>
                    <p>위 권리 행사는 개인정보보호책임자에게 이메일로 연락하시면 지체 없이 조치하겠습니다.</p>
                </section>

                <section className="terms-section">
                    <h2>8. 쿠키의 사용</h2>
                    <p>회사는 이용자의 정보를 수시로 저장하고 찾아내는 '쿠키(cookie)'를 사용합니다.</p>
                    <h3>가. 쿠키 사용 목적</h3>
                    <ul>
                        <li>이용자의 접속 빈도나 방문 시간 등을 분석</li>
                        <li>서비스 이용 편의성 향상</li>
                    </ul>
                    <h3>나. 쿠키 설정 거부 방법</h3>
                    <p>이용자는 웹 브라우저의 설정을 통해 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 서비스 이용에 어려움이 있을 수 있습니다.</p>
                </section>

                <section className="terms-section">
                    <h2>9. 개인정보보호책임자</h2>
                    <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.</p>

                    <div className="contact-box">
                        <h3>▶ 개인정보보호책임자</h3>
                        <ul>
                            <li><strong>성명:</strong> 김미연</li>
                            <li><strong>직책:</strong> 대표</li>
                            <li><strong>이메일:</strong> wsh9991@gmail.com</li>
                        </ul>
                    </div>
                </section>

                <section className="terms-section">
                    <h2>10. 권익침해 구제방법</h2>
                    <p>이용자는 개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다:</p>
                    <ul>
                        <li><strong>개인정보침해신고센터:</strong> privacy.kisa.or.kr / 국번없이 118</li>
                        <li><strong>대검찰청 사이버수사과:</strong> www.spo.go.kr / 국번없이 1301</li>
                        <li><strong>경찰청 사이버안전국:</strong> cyberbureau.police.go.kr / 국번없이 182</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>11. 개인정보처리방침 변경</h2>
                    <p>이 개인정보처리방침은 2024년 12월 30일부터 적용됩니다.</p>
                    <ul>
                        <li>공고일자: 2024년 12월 30일</li>
                        <li>시행일자: 2024년 12월 30일</li>
                    </ul>
                </section>
            </main>
        </div>
    );
}
