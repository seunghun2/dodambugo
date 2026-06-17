'use client';

import Link from 'next/link';

export default function PrivacyThirdPartyPage() {
    return (
        <div className="legal-page">
            <header className="legal-header">
                <Link href="/" className="back-btn" style={{ textDecoration: 'none' }}>
                    <span className="material-symbols-outlined">chevron_left</span>
                </Link>
                <h1>개인정보 제3자 제공 동의</h1>
            </header>

            <main className="legal-content">
                <section className="terms-section">
                    <p className="privacy-intro">
                        마음부고(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다.
                        회사는 이용자의 동의를 기반으로 개인정보를 제3자에게 제공하고 있으며, 이에 관한 사항을 안내드리오니 자세히 읽은 후 동의 여부를 결정하여 주시기 바랍니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>1. 개인정보를 제공받는 자</h2>
                    <ul>
                        <li><strong>화환 및 조화 배송 업체:</strong> 전국 제휴 화원</li>
                        <li><strong>결제 대행 업체:</strong> 토스페이먼츠</li>
                        <li><strong>알림톡 발송 대행:</strong> 카카오</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>2. 개인정보를 제공받는 자의 이용 목적</h2>
                    <ul>
                        <li><strong>화환 및 조화 배송 업체:</strong> 주문한 상품의 배송</li>
                        <li><strong>결제 대행 업체:</strong> 결제 처리 및 결제 도용 방지</li>
                        <li><strong>알림톡 발송 대행:</strong> 주문 및 배송 알림 발송</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>3. 제공하는 개인정보의 항목</h2>
                    <ul>
                        <li><strong>화환 및 조화 배송 업체:</strong> 수령인 이름, 배송지 주소, 연락처, 리본 문구</li>
                        <li><strong>결제 대행 업체:</strong> 이름, 결제 정보, 휴대폰 번호</li>
                        <li><strong>알림톡 발송 대행:</strong> 휴대폰 번호, 주문 정보</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>4. 개인정보를 제공받는 자의 보유 및 이용 기간</h2>
                    <p>
                        제공받는 업체는 개인정보 이용 목적을 달성한 후 지체 없이 해당 정보를 파기합니다.
                        단, 관계 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관됩니다.
                    </p>
                    <ul>
                        <li><strong>화환 및 조화 배송 업체:</strong> 배송 완료 후 3개월</li>
                        <li><strong>결제 대행 업체:</strong> 전자상거래 등에서의 소비자 보호에 관한 법률에 따라 5년</li>
                        <li><strong>알림톡 발송 대행:</strong> 발송 완료 후 3개월</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>5. 동의 거부 권리 및 동의 거부에 따른 불이익</h2>
                    <p>
                        이용자는 개인정보 제3자 제공 동의를 거부할 권리가 있습니다.
                        단, 동의를 거부할 경우 서비스 이용에 제한이 있을 수 있습니다.
                    </p>
                    <ul>
                        <li>화환 및 조화 배송 서비스 이용 불가</li>
                        <li>결제 서비스 이용 불가</li>
                        <li>주문 알림 서비스 이용 불가</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>6. 개인정보의 안전성 확보 조치</h2>
                    <p>
                        회사는 개인정보를 제공받는 자에게 개인정보 보호법 제26조에 따라 개인정보 안전성 확보 조치를 요구하고 있습니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>7. 개인정보 제공 동의 철회</h2>
                    <p>
                        이용자는 언제든지 개인정보 제공 동의를 철회할 수 있습니다.
                        동의 철회는 고객센터(contact@maeumbugo.co.kr)를 통해 가능합니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>8. 개인정보 파기 절차 및 방법</h2>
                    <p>
                        제공받는 자는 이용 목적이 달성된 후 지체 없이 해당 정보를 파기합니다.
                        파기 절차 및 방법은 다음과 같습니다:
                    </p>
                    <ul>
                        <li><strong>파기 절차:</strong> 이용 목적 달성 후 내부 방침 및 관련 법령에 따라 일정 기간 저장 후 파기</li>
                        <li><strong>파기 방법:</strong> 전자적 파일 형태의 정보는 복구 불가능한 방법으로 영구 삭제, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>9. 시행일</h2>
                    <ul>
                        <li>공고일자: 2025년 1월 1일</li>
                        <li>시행일자: 2025년 1월 1일</li>
                    </ul>
                </section>
            </main>
        </div>
    );
}
