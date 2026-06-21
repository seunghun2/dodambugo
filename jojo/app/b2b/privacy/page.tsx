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
                        마음부고(이하 "회사")는 B2B 파트너(이하 "파트너")의 개인정보를 매우 중요하게 생각하며, "개인정보 보호법", "정보통신망 이용촉진 및 정보보호 등에 관한 법률" 등 관련 법규를 준수하고 있습니다. 회사는 본 개인정보처리방침을 통해 수집되는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 안전하게 보호하기 위해 어떠한 조치를 취하고 있는지 알려드립니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>1. 수집하는 개인정보 항목 및 수집방법</h2>
                    <h3>가. 수집하는 개인정보 항목</h3>
                    <p>회사는 B2B 파트너 서비스 제공, 정산 및 원천징수 세무신고를 위해 아래와 같은 개인정보를 수집합니다:</p>
                    <ul>
                        <li><strong>파트너 회원가입 시:</strong> 휴대폰 번호, 비밀번호, 상호명, 대표자명</li>
                        <li><strong>정산 계좌 등록 시 (선택/정산 대상자 필수):</strong> 은행명, 계좌번호, 예금주명</li>
                        <li><strong>본인인증 및 원천징수 신고 시 (최초 출금 신청 시 필수):</strong> 성명, 주민등록번호(또는 외국인등록번호), 본인 확인 정보(휴대폰 번호, 통신사), 주민등록증 발급일자 또는 운전면허증 면허번호</li>
                        <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 로그, IP 주소, 쿠키, 기기 정보</li>
                    </ul>

                    <h3>나. 수집방법</h3>
                    <ul>
                        <li>파트너 가입 페이지, 계좌 등록 페이지, 본인인증 및 세무 정보 입력 페이지에서 이용자가 직접 입력</li>
                        <li>서비스 이용 과정에서 시스템 로그를 통해 자동으로 생성 및 수집</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>2. 개인정보의 수집 및 이용목적</h2>
                    <p>수집된 파트너의 개인정보는 다음의 목적을 위해 활용됩니다:</p>
                    <ul>
                        <li><strong>파트너 관리:</strong> 파트너 회원 가입 의사 확인, 본인 확인, 파트너 서비스 제공에 따른 식별 및 가입 의사 확인, 불량 회원의 부정이용 방지</li>
                        <li><strong>정산 및 송금:</strong> 화환 매출 수당 및 추천 보너스 정산, 등록 계좌 실명 확인, 정산금(적립금) 이체 송금 처리</li>
                        <li><strong>세무 신고 대행:</strong> 개인 파트너(프리랜서) 대상 사업소득세 3.3% 원천징수 신고 대행 및 세무 증빙자료 작성 (국세청 제출)</li>
                        <li><strong>고객 지원 및 공지:</strong> 서비스 변경 안내, 공지사항 전달, 문의 및 불만 처리, 파트너 정산 리포트 제공</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>3. 개인정보의 보유 및 이용기간</h2>
                    <p>회사는 파트너의 가입 시부터 파트너 서비스 해지(탈퇴) 시까지 개인정보를 보유 및 이용합니다. 단, 다음의 경우에는 명시한 기간 동안 보관합니다:</p>
                    <ul>
                        <li><strong>소득세 원천징수 신고 자료:</strong> 5년 (국세기본법, 소득세법)</li>
                        <li><strong>계좌 실명확인 및 정산 거래 기록:</strong> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                        <li><strong>소비자 불만 또는 분쟁처리에 관한 기록:</strong> 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                        <li><strong>접속 로그 및 서비스 이용 기록:</strong> 3개월 (통신비밀보호법)</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>4. 개인정보의 파기절차 및 방법</h2>
                    <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
                    <h3>가. 파기절차</h3>
                    <p>파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</p>
                    <h3>나. 파기방법</h3>
                    <ul>
                        <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
                        <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>5. 개인정보의 제3자 제공</h2>
                    <p>회사는 파트너의 개인정보를 이용목적 범위 내에서만 처리하며, 파트너의 사전 동의 없이는 원칙적으로 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다. 단, 아래의 경우는 예외로 합니다:</p>
                    <ul>
                        <li>파트너가 사전에 동의한 경우</li>
                        <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                    </ul>
                    <p>원천징수 신고 세무 대행을 위해 아래와 같이 제3자에게 개인정보가 제공됩니다:</p>
                    <ul>
                        <li><strong>제공받는 자:</strong> 국세청 및 세무 당국, 수임 세무사</li>
                        <li><strong>제공 항목:</strong> 성명, 주민등록번호, 지급금액(정산금액), 지급일자, 업종구분(인적용역)</li>
                        <li><strong>이용 목적:</strong> 프리랜서 사업소득(3.3%) 원천징수 세무 신고 대행 및 영수증 발행</li>
                        <li><strong>보유 기간:</strong> 세법에 따른 보존 기한(5년)</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>6. 파트너의 권리와 행사방법</h2>
                    <p>파트너는 언제든지 회사에 대해 개인정보 열람, 정정, 삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다. 개인정보 보호책임자에게 서면 또는 이메일로 연락하시면 지체 없이 조치하겠습니다.</p>
                </section>

                <section className="terms-section">
                    <h2>7. 개인정보 보호책임자</h2>
                    <p>회사는 파트너의 개인정보 처리에 관한 업무를 총괄해서 책임지고, 관련 불만처리 및 피해구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                    <div className="contact-box">
                        <h3>▶ 개인정보 보호책임자</h3>
                        <ul>
                            <li><strong>성명:</strong> 김미연</li>
                            <li><strong>직책:</strong> 대표</li>
                            <li><strong>이메일:</strong> miyoun1990@gmail.com</li>
                        </ul>
                    </div>
                </section>

                <section className="terms-section">
                    <h2>부칙</h2>
                    <p>본 방침은 2026년 6월 21일부터 시행됩니다.</p>
                </section>
            </main>
        </div>
    );
}
