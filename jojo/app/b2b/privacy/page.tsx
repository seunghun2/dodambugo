'use client';

import { useRouter } from 'next/navigation';

export default function B2BPrivacyPage() {
    const router = useRouter();

    return (
        <div className="legal-page">
            <header className="legal-header">
                <button 
                    onClick={() => router.back()} 
                    className="back-btn" 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h1>B2B 파트너 개인정보처리방침</h1>
            </header>

            <main className="legal-content">
                <section className="terms-section">
                    <p className="privacy-intro">
                        마음부고(이하 "회사")는 B2B 파트너의 개인정보를 중요시하며, "개인정보 보호법" 등 관련 법규를 준수하고 있습니다. 회사는 개인정보처리방침을 통하여 파트너가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>1. 수집하는 개인정보 항목 및 수집방법</h2>
                    <h3>가. 수집하는 개인정보 항목</h3>
                    <p>회사는 파트너 가입, 부고장 작성 및 정산금 지급, 세무 신고 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
                    <ul>
                        <li><strong>필수항목:</strong> 휴대폰 번호, 상호명(소속), 대표자명(성명), 비밀번호</li>
                        <li><strong>정산 수집항목:</strong> 예금주, 은행명, 계좌번호</li>
                        <li><strong>원천징수 세무 신고 수집항목:</strong> 성명, 주민등록번호(또는 외국인등록번호), 본인인증 정보 (소득세법 제127조 및 국세기본법 근거)</li>
                        <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 로그, IP 주소, 쿠키, 접속 기기 정보</li>
                    </ul>

                    <h3>나. 개인정보 수집방법</h3>
                    <ul>
                        <li>웹/앱을 통한 파트너 회원가입 및 계좌 등록 시 이용자가 직접 입력</li>
                        <li>본인인증 및 세무 신고 폼 입력 시 직접 입력</li>
                        <li>제휴/문의 폼을 통한 문의 시 직접 입력</li>
                        <li>서비스 이용 과정에서 자동으로 생성되어 수집</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>2. 개인정보의 수집 및 이용목적</h2>
                    <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다:</p>
                    
                    <h3>가. 파트너 서비스 제공</h3>
                    <ul>
                        <li>B2B 파트너 회원가입 및 관리</li>
                        <li>부고장 대행 작성 및 관리</li>
                        <li>화환 주문 내역 조회 및 대시보드 제공</li>
                        <li>본인 확인 및 파트너 자격 확인</li>
                    </ul>

                    <h3>나. 정산금 지급 및 세무 신고</h3>
                    <ul>
                        <li>화환 수당 및 추천인 보너스 이체 송금 처리</li>
                        <li>프리랜서 사업소득 3.3%(국세 3%, 지방소득세 0.3%) 원천징수 세무 신고 대행 및 지급명세서 제출</li>
                        <li>정산 내역 조회 및 관리</li>
                        <li>부정 이용 및 부정 수급 방지</li>
                    </ul>

                    <h3>다. 서비스 개선 및 마케팅</h3>
                    <ul>
                        <li>신규 파트너 서비스 개발 및 맞춤 서비스 제공</li>
                        <li>서비스 이용 통계 및 분석</li>
                        <li>이벤트 및 파트너 혜택 정보 제공 (동의한 경우에 한함)</li>
                    </ul>

                    <h3>라. 고객 지원</h3>
                    <ul>
                        <li>문의사항 및 불만처리</li>
                        <li>공지사항 및 정산 안내 전달</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>3. 개인정보의 보유 및 이용기간</h2>
                    <ul>
                        <li><strong>파트너 회원 정보:</strong> 파트너 회원 탈퇴 시까지</li>
                        <li><strong>세무 신고 관련 자료 (주민등록번호 포함):</strong> 5년 (국세기본법 및 소득세법에 따라 보관)</li>
                        <li><strong>정산금 결제 및 이체 기록:</strong> 5년 (전자상거래법 및 전자금융거래법에 따라 보관)</li>
                        <li><strong>문의 정보:</strong> 문의 처리 완료 후 1년</li>
                        <li><strong>서비스 이용 기록:</strong> 3개월 (통신비밀보호법에 따라 보관)</li>
                        <li><strong>부정 이용 및 어뷰징 기록:</strong> 5년 (전자상거래법에 따라 보관)</li>
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
                    <p>회사는 파트너의 개인정보를 "개인정보의 수집 및 이용목적"에서 고지한 범위 내에서 사용하며, 파트너의 사전 동의 없이는 동 범위를 초과하여 이용하거나 원칙적으로 외부에 공개하지 않습니다.</p>

                    <p>다만, 아래의 경우에는 예외로 합니다:</p>
                    <ul>
                        <li>이용자가 사전에 동의한 경우</li>
                        <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                    </ul>

                    <h3>가. 원천징수 세무 신고 관련 제3자 제공</h3>
                    <p>회사는 파트너 소득세 원천징수 신고 대행을 위해 개인정보보호법 제17조 제2항에 따라 아래와 같이 개인정보를 제3자에게 제공합니다:</p>
                    <ul>
                        <li><strong>제공받는 자:</strong> 국세청, 관할 세무서, 회사의 수임 세무사</li>
                        <li><strong>제공하는 항목:</strong> 성명, 주민등록번호, 지급 금액, 지급 일자</li>
                        <li><strong>제공 목적:</strong> 소득세법에 따른 사업소득 3.3% 원천징수 세무 신고 및 영수증 발행</li>
                        <li><strong>보유 기간:</strong> 세법에 따른 보존 기한 5년</li>
                        <li><strong>동의 거부권:</strong> 동의를 거부할 권리가 있으나, 거부 시 원천징수 세무 신고 불가로 정산 출금이 제한될 수 있습니다.</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>6. 이용자(파트너)의 권리와 행사방법</h2>
                    <p>파트너는 언제든지 자신의 개인정보에 대해 다음의 권리를 행사할 수 있습니다:</p>
                    <ul>
                        <li><strong>열람 요청:</strong> 본인의 개인정보 열람을 요청할 수 있습니다.</li>
                        <li><strong>정정 요청:</strong> 개인정보의 오류에 대한 정정을 요청할 수 있습니다.</li>
                        <li><strong>삭제 요청:</strong> 개인정보의 삭제를 요청할 수 있습니다.</li>
                        <li><strong>처리정지 요청:</strong> 개인정보 처리의 정지를 요청할 수 있습니다.</li>
                    </ul>
                    <p>위 권리 행사는 개인정보보호책임자에게 이메일로 연락하시면 지체 없이 조치하겠습니다.</p>
                </section>

                <section className="terms-section">
                    <h2>7. 쿠키의 사용</h2>
                    <p>회사는 파트너의 정보를 수시로 저장하고 찾아내는 '쿠키(cookie)'를 사용합니다.</p>
                    <h3>가. 쿠키 사용 목적</h3>
                    <ul>
                        <li>파트너의 접속 빈도나 방문 시간 등을 분석</li>
                        <li>서비스 이용 편의성 향상 및 자동 로그인 제공</li>
                    </ul>
                    <h3>나. 쿠키 설정 거부 방법</h3>
                    <p>이용자는 웹 브라우저의 설정을 통해 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 서비스 이용에 어려움이 있을 수 있습니다.</p>
                </section>

                <section className="terms-section">
                    <h2>8. 개인정보보호책임자</h2>
                    <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.</p>
                    
                    <div className="contact-box">
                        <h3>▶ 개인정보보호책임자</h3>
                        <ul>
                            <li><strong>성명:</strong> 김미연</li>
                            <li><strong>직책:</strong> 대표</li>
                            <li><strong>이메일:</strong> miyoun1990@gmail.com</li>
                        </ul>
                    </div>
                </section>

                <section className="terms-section">
                    <h2>9. 권익침해 구제방법</h2>
                    <p>이용자는 개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다:</p>
                    <ul>
                        <li><strong>개인정보침해신고센터:</strong> privacy.kisa.or.kr / 국번없이 118</li>
                        <li><strong>대검찰청 사이버수사과:</strong> www.spo.go.kr / 국번없이 1301</li>
                        <li><strong>경찰청 사이버안전국:</strong> cyberbureau.police.go.kr / 국번없이 182</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>10. 개인정보처리방침 변경</h2>
                    <p>이 개인정보처리방침은 2026년 6월 21일부터 적용됩니다.</p>
                </section>
            </main>
        </div>
    );
}
