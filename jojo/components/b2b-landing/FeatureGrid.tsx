'use client';

import React from 'react';
import styles from './landing.module.css';

export default function FeatureGrid() {
    return (
        <section style={{ background: '#ffffff', padding: '90px 20px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTag}>강력한 시스템</span>
                    <h2 className={styles.sectionTitle}>오직 장례 비즈니스만을 위해 설계된 기능들</h2>
                    <p className={styles.sectionDesc}>
                        부고장 작성부터 화환 수당 출금, 본사 세무 정산까지 한 화면에서 물 흐르듯 처리됩니다.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '36px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📱</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>3분 모바일 부고장</h3>
                        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                            상주 성함과 빈소만 넣으면 고인과의 관계 호칭을 30여 개 예법 규칙으로 자동 생성하며, 오타 없이 깔끔한 카톡 부고장이 완성됩니다.
                        </p>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>💐</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>화환·부의금·답례품 원스톱</h3>
                        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                            조문객이 부고장에서 화환을 주문하거나 온라인 부의금을 보내면, 전국 화원 배송부터 상주 송금까지 시스템이 100% 자동 대행합니다.
                        </p>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>💳</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>실시간 지갑 & 즉시 출금</h3>
                        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                            주문 완료 즉시 내 지갑에 수당이 적립되며, 24시간 언제든 [출금 신청] 터치 한 번으로 3.3% 원천징수 공제 후 실시간 입금됩니다.
                        </p>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📑</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>상조 본사 정산서 자동화</h3>
                        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                            상조 본사용 통합 어드민에서 월별 대금 정산서가 자동 생성되어 세금계산서 발행과 대사 업무를 손쉽게 마감할 수 있습니다.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
