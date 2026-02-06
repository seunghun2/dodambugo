'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Bugo } from '@/lib/supabase';
// supabase는 동적 로드

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Bugo[]>([]);
    const [recentBugo, setRecentBugo] = useState<Bugo[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 비밀번호 모달
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedBugo, setSelectedBugo] = useState<Bugo | null>(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // 1달 전 날짜 계산
    const getOneMonthAgo = () => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    };

    // 최근 부고 목록 불러오기 (1달 이내만)
    useEffect(() => {
        const fetchRecentBugo = async () => {
            try {
                const { supabase } = await import('@/lib/supabase');
                const { data, error } = await supabase
                    .from('bugo')
                    .select('*')
                    .is('deleted_at', null)
                    .gte('funeral_date', getOneMonthAgo())
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;
                setRecentBugo(data || []);
            } catch (err) {
                console.error('최근 부고 로딩 오류:', err);
            }
        };

        fetchRecentBugo();
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        setCurrentPage(1);

        try {
            const { supabase } = await import('@/lib/supabase');
            const { data, error } = await supabase
                .from('bugo')
                .select('*')
                .is('deleted_at', null)
                .or(`bugo_number.eq.${query},deceased_name.ilike.%${query}%,mourner_name.ilike.%${query}%`)
                .gte('funeral_date', getOneMonthAgo())
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error('검색 오류:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 부고 카드 클릭 → 비밀번호 모달
    const handleBugoClick = (bugo: Bugo) => {
        setSelectedBugo(bugo);
        setPasswordInput('');
        setPasswordError('');
        setShowPasswordModal(true);
    };

    // 비밀번호 확인
    const handlePasswordSubmit = () => {
        if (!selectedBugo) return;

        // phone_password 또는 applicant_phone 뒤 4자리와 비교
        const phonePassword = (selectedBugo as any).phone_password || (selectedBugo as any).applicant_phone || '';
        const cleanPhone = phonePassword.replace(/-/g, '');
        const last4 = cleanPhone.slice(-4);

        if (passwordInput === last4) {
            setShowPasswordModal(false);
            router.push(`/create/complete/${selectedBugo.bugo_number}`);
        } else {
            setPasswordError('비밀번호가 일치하지 않습니다');
        }
    };

    // 날짜 포맷 (MM/DD)
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    };

    // 표시할 목록 (검색 결과 또는 최근 부고)
    const fullList = searched ? results : recentBugo;
    const totalPages = Math.ceil(fullList.length / itemsPerPage);
    const displayList = fullList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            {/* 검색 섹션 */}
            <section className="faq" id="search" style={{ paddingTop: '100px', minHeight: '100vh', background: '#f8f9fa' }}>
                <div className="container">
                    {/* 검색 헤더 */}
                    <div className="section-header" style={{ marginBottom: '16px' }}>
                        <h2 className="section-title" style={{ marginBottom: '4px' }}>부고 검색</h2>
                        <p className="section-subtitle" style={{ color: '#666', marginTop: '0' }}>
                            부고를 확인하거나 수정하세요
                        </p>
                    </div>

                    {/* 검색 입력 */}
                    <div style={{
                        maxWidth: '700px',
                        margin: '0 auto 40px',
                        display: 'flex',
                        alignItems: 'center',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px 16px'
                    }}>
                        <input
                            type="text"
                            placeholder="상주 또는 고인명"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyPress}
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                fontSize: '15px',
                                background: 'transparent',
                                color: '#374151'
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                fontSize: '14px',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
                        </button>
                    </div>

                    {/* 부고 목록 - 카드 형태로 띄워서 */}
                    <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {displayList.length > 0 ? (
                            <>
                                {displayList.map((bugo) => (
                                    <div
                                        key={bugo.id}
                                        onClick={() => handleBugoClick(bugo)}
                                        style={{
                                            display: 'block',
                                            padding: '16px',
                                            background: 'white',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            transition: 'box-shadow 0.15s',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                    >
                                        {/* 첫 줄: 부고번호 + 발인일 */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ color: '#9ca3af', fontWeight: 500, fontSize: '13px' }}>#{bugo.bugo_number}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af', fontSize: '13px' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>event</span>
                                                발인: {formatDate(bugo.funeral_date ?? null)}
                                            </span>
                                        </div>
                                        {/* 둘째 줄: 상주 이름(故고인명) */}
                                        <div style={{ marginBottom: '6px' }}>
                                            <span style={{ color: '#9ca3af', fontSize: '13px', marginRight: '4px' }}>상주</span>
                                            <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '16px' }}>{bugo.mourner_name || bugo.applicant_name}</span>
                                            <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: '4px' }}>(故{bugo.deceased_name})</span>
                                        </div>
                                        {/* 셋째 줄: 장례유형 | 장례식장명 */}
                                        <div style={{ color: '#6b7280', fontSize: '14px' }}>
                                            {(bugo as any).funeral_type || '일반 장례'}
                                            {((bugo as any).funeral_type === '일반 장례' || !(bugo as any).funeral_type) && bugo.funeral_home && ` | ${bugo.funeral_home}${bugo.room_number ? ` ${bugo.room_number}` : ''}`}
                                        </div>
                                    </div>
                                ))}

                                {/* 페이지네이션 */}
                                {totalPages > 1 && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginTop: '24px'
                                    }}>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                background: 'white',
                                                color: currentPage === 1 ? '#d1d5db' : '#374151',
                                                cursor: currentPage === 1 ? 'default' : 'pointer'
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    border: currentPage === page ? 'none' : '1px solid #e5e7eb',
                                                    borderRadius: '6px',
                                                    background: currentPage === page ? '#FFCC45' : 'white',
                                                    color: currentPage === page ? '#191919' : '#374151',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: currentPage === page ? 600 : 400
                                                }}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                background: 'white',
                                                color: currentPage === totalPages ? '#d1d5db' : '#374151',
                                                cursor: currentPage === totalPages ? 'default' : 'pointer'
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : searched ? (
                            <div style={{
                                background: 'white',
                                borderRadius: '8px',
                                padding: '60px 20px',
                                textAlign: 'center',
                                border: '1px solid #e5e7eb'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#d1d5db' }}>search_off</span>
                                <p style={{ marginTop: '16px', color: '#6b7280' }}>검색 결과가 없습니다</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            {/* 비밀번호 모달 */}
            {showPasswordModal && (
                <div
                    onClick={() => setShowPasswordModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '32px 24px',
                            width: '100%',
                            maxWidth: '340px',
                            textAlign: 'center'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#9ca3af', marginBottom: '12px' }}>lock</span>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>비밀번호 입력</h3>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                            신청 시 입력한 휴대전화번호<br />뒷자리 4자리를 입력해주세요
                        </p>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="●●●●"
                            value={passwordInput}
                            onChange={(e) => {
                                setPasswordInput(e.target.value.replace(/[^0-9]/g, ''));
                                setPasswordError('');
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                            autoFocus
                            style={{
                                width: '100%',
                                height: '52px',
                                border: passwordError ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                borderRadius: '10px',
                                fontSize: '24px',
                                textAlign: 'center',
                                letterSpacing: '8px',
                                outline: 'none',
                                marginBottom: '8px',
                                boxSizing: 'border-box'
                            }}
                        />
                        {passwordError && (
                            <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{passwordError}</p>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                style={{
                                    flex: 1,
                                    height: '48px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    background: 'white',
                                    color: '#6b7280',
                                    fontSize: '15px',
                                    cursor: 'pointer'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handlePasswordSubmit}
                                style={{
                                    flex: 1,
                                    height: '48px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: '#FFCC45',
                                    color: '#191919',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
