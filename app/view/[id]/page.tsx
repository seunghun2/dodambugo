'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, Bugo } from '@/lib/supabase';
import Link from 'next/link';
import './view.css';

export default function ViewPage() {
    const params = useParams();
    const [bugo, setBugo] = useState<Bugo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBugo = async () => {
            try {
                const { data, error } = await supabase
                    .from('bugo')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (error) throw error;
                setBugo(data);
            } catch (err: any) {
                setError('부고장을 찾을 수 없습니다.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchBugo();
        }
    }, [params.id]);

    const copyShareUrl = async () => {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 복사되었습니다.');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>부고장을 불러오는 중...</p>
            </div>
        );
    }

    if (error || !bugo) {
        return (
            <div className="error-container">
                <div className="error-content">
                    <div className="error-icon">😢</div>
                    <h2>부고장을 찾을 수 없습니다</h2>
                    <p>요청하신 부고장이 존재하지 않거나 삭제되었습니다.</p>
                    <div className="error-actions">
                        <Link href="/" className="btn-primary">홈으로</Link>
                    </div>
                </div>
            </div>
        );
    }

    // 템플릿 이미지 추가
    const templateImages: Record<string, string> = {
        basic: '/images/template-basic.png',
        ribbon: '/images/template-ribbon.png',
        border: '/images/template-border.png',
        flower: '/images/template-flower.png',
    };

    return (
        <main className="bugo-view">
            {/* 템플릿 헤더 이미지 */}
            <div className="bugo-header">
                <img
                    src={templateImages[bugo.template] || templateImages.basic}
                    alt="부고장"
                />
            </div>

            <div className="bugo-content">
                {/* 고인 정보 */}
                <section className="content-section">
                    <h3 className="content-title">고인</h3>
                    <div className="info-list">
                        <div className="info-row">
                            <span className="info-label">고인</span>
                            <span className="info-value">故 {bugo.deceased_name}</span>
                        </div>
                        {bugo.age && (
                            <div className="info-row">
                                <span className="info-label">향년</span>
                                <span className="info-value">{bugo.age}세</span>
                            </div>
                        )}
                        {bugo.gender && (
                            <div className="info-row">
                                <span className="info-label">성별</span>
                                <span className="info-value">{bugo.gender}</span>
                            </div>
                        )}
                        {bugo.religion && (
                            <div className="info-row">
                                <span className="info-label">종교</span>
                                <span className="info-value">{bugo.religion}</span>
                            </div>
                        )}
                        {bugo.death_date && (
                            <div className="info-row">
                                <span className="info-label">별세일</span>
                                <span className="info-value">{bugo.death_date}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* 상주 정보 */}
                <section className="content-section">
                    <h3 className="content-title">상주</h3>
                    <div className="mourners-list">
                        {bugo.family_list ? (
                            bugo.family_list.split('\n').filter(Boolean).map((line, index) => {
                                const parts = line.match(/^(\S+)\s+(\S+)\s+\(([^)]+)\)$/);
                                if (parts) {
                                    return (
                                        <div key={index} className="mourner-card">
                                            <div className="mourner-main">
                                                <span className="mourner-relation">{parts[1]}</span>
                                                <span className="mourner-name">{parts[2]}</span>
                                            </div>
                                            <div className="mourner-contact">
                                                <a href={`tel:${parts[3]}`}>{parts[3]}</a>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={index} className="mourner-card">
                                        <div className="mourner-main">
                                            <span className="mourner-name">{line}</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="mourner-card">
                                <div className="mourner-main">
                                    <span className="mourner-name">{bugo.mourner_name}</span>
                                </div>
                                {bugo.contact && (
                                    <div className="mourner-contact">
                                        <a href={`tel:${bugo.contact}`}>{bugo.contact}</a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* 빈소 정보 */}
                <section className="content-section">
                    <h3 className="content-title">빈소</h3>
                    <div className="info-list">
                        <div className="info-row">
                            <span className="info-label">장례식장</span>
                            <span className="info-value">{bugo.funeral_home}</span>
                        </div>
                        {bugo.room_number && (
                            <div className="info-row">
                                <span className="info-label">호실</span>
                                <span className="info-value">{bugo.room_number}</span>
                            </div>
                        )}
                        {bugo.funeral_home_tel && (
                            <div className="info-row">
                                <span className="info-label">연락처</span>
                                <span className="info-value">
                                    <a href={`tel:${bugo.funeral_home_tel}`}>{bugo.funeral_home_tel}</a>
                                </span>
                            </div>
                        )}
                        {bugo.address && (
                            <div className="info-row">
                                <span className="info-label">주소</span>
                                <span className="info-value">{bugo.address}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* 일정 정보 */}
                {(bugo.funeral_date || bugo.burial_place) && (
                    <section className="content-section">
                        <h3 className="content-title">일정</h3>
                        <div className="info-list">
                            {bugo.funeral_date && (
                                <div className="info-row">
                                    <span className="info-label">발인</span>
                                    <span className="info-value">
                                        {bugo.funeral_date} {bugo.funeral_time || ''}
                                    </span>
                                </div>
                            )}
                            {bugo.burial_place && (
                                <div className="info-row">
                                    <span className="info-label">장지</span>
                                    <span className="info-value">{bugo.burial_place}</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* 인사말 */}
                {bugo.message && (
                    <section className="content-section">
                        <div className="condolence-message">
                            <p className="condolence-text">{bugo.message}</p>
                        </div>
                    </section>
                )}
            </div>

            {/* 하단 공유 버튼 */}
            <div className="bugo-actions">
                <button className="action-btn btn-primary" onClick={copyShareUrl}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16,6 12,2 8,6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    부고장 공유하기
                </button>
            </div>
        </main>
    );
}
