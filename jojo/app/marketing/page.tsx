'use client';

import Link from 'next/link';

export default function MarketingPage() {
    return (
        <div className="legal-page">
            <header className="legal-header">
                <Link href="/" className="back-btn" style={{ textDecoration: 'none' }}>
                    <span className="material-symbols-outlined">chevron_left</span>
                </Link>
                <h1>마케팅 정보 수신 동의</h1>
            </header>

            <main className="legal-content">
                <section className="terms-section">
                    <p className="privacy-intro">
                        마음부고에서는 고객님께 더 나은 서비스 경험과 다양한 혜택을 안내해 드리고자 합니다.
                        마케팅 정보 수신은 선택사항이며, 미동의 시에도 서비스 이용에 어떠한 불이익도 없습니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>수신 동의 항목</h2>

                    <h3>안내 받으실 내용</h3>
                    <ul>
                        <li>마음부고 신규 기능 및 업데이트 소식</li>
                        <li>화환/조화 주문 관련 특별 할인 안내</li>
                        <li>고인 기일 알림 서비스 (원하시는 경우)</li>
                    </ul>

                    <h3>발송 방법</h3>
                    <ul>
                        <li>카카오 알림톡 또는 문자메시지(SMS/LMS)</li>
                    </ul>

                    <h3>활용되는 정보</h3>
                    <ul>
                        <li>성함, 휴대폰 번호</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <h2>정보 보관 기간</h2>
                    <p>
                        수신 동의일로부터 2년간 보관되며, 동의 철회 요청 시 즉시 삭제됩니다.
                    </p>
                </section>

                <section className="terms-section">
                    <h2>수신 거부 안내</h2>
                    <p>언제든지 아래 방법으로 수신을 거부하실 수 있습니다.</p>
                    <ul>
                        <li>수신된 메시지 내 '수신거부' 선택</li>
                        <li>이메일 문의: contact@maeumbugo.co.kr</li>
                    </ul>
                </section>

                <section className="terms-section">
                    <p style={{ fontSize: '13px', color: '#888888' }}>
                        본 약관은 2025년 1월 1일부터 시행됩니다.
                    </p>
                </section>
            </main>
        </div>
    );
}
