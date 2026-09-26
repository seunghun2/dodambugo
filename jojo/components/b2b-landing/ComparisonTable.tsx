'use client';

import React from 'react';
import styles from './landing.module.css';

export default function ComparisonTable() {
    return (
        <section id="comparison" className={styles.compareSection}>
            <div className={styles.compareContainer}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionTag}>투명한 팩트 비교</span>
                    <h2 className={styles.sectionTitle}>왜 수많은 지도사들이 부고온플러스로 갈아탈까요?</h2>
                    <p className={styles.sectionDesc}>
                        기존 레거시 부고 앱들과 부고온플러스의 실제 수당 및 정산 조건을 직접 비교해 보세요.
                    </p>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.compareTable}>
                        <thead>
                            <tr>
                                <th>비교 항목</th>
                                <th>기존 부고 앱 (타사)</th>
                                <th className={styles.highlightCol}>부고온플러스 (B2B)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>화환 지도사 수당</td>
                                <td>건당 20,000원 ~ 30,000원 선</td>
                                <td className={styles.highlightCol}>건당 50,000원 ~ 65,000원 (업계 최고)</td>
                            </tr>
                            <tr>
                                <td>추천인 보너스</td>
                                <td>일회성 포인트 또는 없음</td>
                                <td className={styles.highlightCol}>동료 판매 1건당 3,500원 평생 지급</td>
                            </tr>
                            <tr>
                                <td>시작 및 사용 방식</td>
                                <td>무거운 앱 다운로드 필수 (설치 번거로움)</td>
                                <td className={styles.highlightCol}>앱 설치 0초, 웹 바로가기 즉시 사용</td>
                            </tr>
                            <tr>
                                <td>상조회사 본사 연동</td>
                                <td>미지원 (지도사 개인 푼돈 앱)</td>
                                <td className={styles.highlightCol}>본사 통합 어드민 & 세금계산서 정산 연동</td>
                            </tr>
                            <tr>
                                <td>부가서비스 연계</td>
                                <td>화환만 단독 지원</td>
                                <td className={styles.highlightCol}>온라인 부의금(3.3%) + 모바일 답례품(4%)</td>
                            </tr>
                            <tr>
                                <td>정산 및 출금 속도</td>
                                <td>월 1~2회 수동 정산 (지연 빈번)</td>
                                <td className={styles.highlightCol}>주문 즉시 지갑 적립 & 실시간 출금</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ textAlign: 'center', marginTop: '36px' }}>
                    <a 
                        href="https://bugoon.maeumbugo.co.kr/b2b/signup" 
                        className={styles.heroCtaBtn}
                        style={{ display: 'inline-flex' }}
                    >
                        지금 바로 부고온플러스 시작하기 →
                    </a>
                </div>
            </div>
        </section>
    );
}
