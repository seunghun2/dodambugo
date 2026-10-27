'use client';

import React, { useState } from 'react';
import styles from './landing.module.css';

interface DualAudienceSectionProps {
    onOpenInquiry: () => void;
}

export default function DualAudienceSection({ onOpenInquiry }: DualAudienceSectionProps) {
    const [activeTab, setActiveTab] = useState<'individual' | 'corporate'>('individual');

    return (
        <section id="dual-benefits" style={{ background: '#f8fafc', padding: '100px 24px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className={styles.sectionHeaderCenter}>
                    <div className={styles.sectionPretitle}>맞춤형 파트너십</div>
                    <h2 className={styles.sectionTitle}>
                        현장 지도사부터 상조 본사까지,<br />
                        모두를 만족시키는 독보적 혜택
                    </h2>
                    <p style={{ fontSize: '16px', color: '#64748b', marginTop: '10px' }}>
                        개인 프리랜서 활동도, 소속 상조회사 단체 도입도 부고온플러스 하나로 완벽하게 해결됩니다.
                    </p>
                </div>

                {/* 탭 전환 버튼 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '40px' }}>
                    <button
                        onClick={() => setActiveTab('individual')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: activeTab === 'individual' ? '1.5px solid #15803d' : '1px solid #e2e8f0',
                            background: activeTab === 'individual' ? '#15803d' : '#ffffff',
                            color: activeTab === 'individual' ? '#ffffff' : '#475569',
                            boxShadow: activeTab === 'individual' ? '0 4px 12px rgba(21, 128, 61, 0.2)' : 'none',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        👤 장례지도사 (개인 파트너)
                    </button>
                    <button
                        onClick={() => setActiveTab('corporate')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: activeTab === 'corporate' ? '1.5px solid #15803d' : '1px solid #e2e8f0',
                            background: activeTab === 'corporate' ? '#15803d' : '#ffffff',
                            color: activeTab === 'corporate' ? '#ffffff' : '#475569',
                            boxShadow: activeTab === 'corporate' ? '0 4px 12px rgba(21, 128, 61, 0.2)' : 'none',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        🏢 장례식장 · 상조회사 (법인 본사)
                    </button>
                </div>

                {/* 탭 내용 */}
                {activeTab === 'individual' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>💰</div>
                            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>건당 최대 65,000원 적립</h3>
                            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
                                부고장에 화환 주문이 들어오면 기본 5만 원, VIP 화환 6.5만 원이 주문 완료 즉시 지도사님의 지갑에 투명하게 꽂힙니다.
                            </p>
                        </div>

                        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚡</div>
                            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>24시간 언제든 실시간 출금</h3>
                            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
                                월말까지 기다릴 필요 없습니다. 모바일에서 [출금 신청] 터치 1번이면 3.3% 원천징수 공제 후 지도사님 통장으로 바로 입금됩니다.
                            </p>
                        </div>

                        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🤝</div>
                            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>동료 추천 건당 3,500원 연금</h3>
                            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
                                내가 추천한 동료 지도사가 화환을 팔 때마다 건당 3,500원의 보너스가 평생 내 지갑으로 무제한 자동 적립됩니다.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
                            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>본사 전용 관리자 어드민 제공</h3>
                            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
                                소속 장례지도사들의 부고장 개설 현황, 화환 판매 현황, 부의금 결제 내역을 실시간 대시보드에서 한눈에 통제할 수 있습니다.
                            </p>
                        </div>

                        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📑</div>
                            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>월간 정산서 & 세금계산서 연동</h3>
                            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
                                매월 1일 화환/부의금/답례품 정산서가 자동 집계되어 PDF로 출력됩니다. 본사 발행 세금계산서 기준으로 깔끔하게 정산 송금됩니다.
                            </p>
                        </div>

                        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>💎</div>
                            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>부의금 3.3% & 답례품 4% 쉐어</h3>
                            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
                                화환 본사 수수료 외에도 소속 지도사 부고장에서 결제된 온라인 부의금의 3.3%, 모바일 답례품 결제의 최대 4%가 본사 수익으로 귀속됩니다.
                            </p>
                        </div>
                    </div>
                )}

                {/* 탭 하단 액션 */}
                <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                    {activeTab === 'individual' ? (
                        <a 
                            href="https://bugoon.maeumbugo.co.kr/b2b/signup" 
                            className={styles.calcActionBtn}
                            style={{ minWidth: '320px' }}
                        >
                            장례지도사 파트너 무료 등록하기 →
                        </a>
                    ) : (
                        <button 
                            onClick={onOpenInquiry}
                            className={styles.calcActionBtn}
                            style={{ minWidth: '320px', border: 'none', cursor: 'pointer' }}
                        >
                            상조사 / 장례식장 제휴 문의하기 →
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
