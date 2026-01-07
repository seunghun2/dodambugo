'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import SideMenu from '@/components/SideMenu';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        company: '',
        email: '',
        inquiry_type: '',
        message: '',
        privacyAgree: false
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSelectSheet, setShowSelectSheet] = useState(false);

    const inquiryOptions = [
        { value: '제휴 문의', label: '제휴 문의' },
        { value: '서비스 문의', label: '서비스 문의' },
        { value: '기술 지원', label: '기술 지원' },
        { value: '기타', label: '기타' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const formatPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 3 && value.length <= 7) {
            value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
        } else if (value.length > 7) {
            value = value.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
        }
        setFormData(prev => ({ ...prev, phone: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('inquiries')
                .insert([{
                    name: formData.name,
                    phone: formData.phone,
                    company: formData.company || null,
                    email: formData.email,
                    inquiry_type: formData.inquiry_type,
                    message: formData.message
                }]);

            if (error) throw error;
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            alert('문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const [sideMenuOpen, setSideMenuOpen] = useState(false);

    return (
        <>
            {/* Navigation - 다른 페이지와 동일 */}
            <nav className="nav" id="nav">
                <div className="nav-container">
                    <Link href="/" className="nav-logo" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}><img src="/images/logo.png" alt="마음부고" className="nav-logo-img" /></Link>
                    <ul className="nav-menu" id="navMenu">
                        <li><Link href="/search" className="nav-link">부고검색</Link></li>
                        <li><Link href="/faq" className="nav-link">자주묻는 질문</Link></li>
                    </ul>
                    <div className="nav-actions">
                        <Link href="/create" className="nav-cta">부고장 만들기</Link>
                        <button className="nav-toggle" onClick={() => setSideMenuOpen(true)}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>

            <SideMenu isOpen={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />

            <section className="faq" style={{ paddingTop: '100px', minHeight: '100vh', background: '#f8f9fa' }}>
                <div className="container">
                    {submitted ? (
                        <div className="success-container">
                            <div className="success-icon">
                                <span className="material-symbols-outlined">done</span>
                            </div>
                            <h2>문의가 접수되었습니다</h2>
                            <p>빠른 시일 내에 답변드리겠습니다.<br />감사합니다.</p>
                            <Link href="/" className="btn-home">
                                홈으로 돌아가기
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="section-header" style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <h2 className="section-title" style={{ marginBottom: '4px' }}>제휴/문의</h2>
                                <p className="section-subtitle" style={{ color: '#666', marginTop: '0' }}>
                                    마음부고 서비스 제휴 및 문의사항을 남겨주세요
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">이름 <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            placeholder="이름"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">연락처 <span className="required">*</span></label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            placeholder="010-0000-0000"
                                            value={formData.phone}
                                            onChange={formatPhone}
                                            maxLength={13}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">회사명</label>
                                    <input
                                        type="text"
                                        name="company"
                                        className="form-input"
                                        placeholder="회사명 (선택)"
                                        value={formData.company}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">이메일 <span className="required">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        placeholder="example@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">문의 유형 <span className="required">*</span></label>
                                    {/* PC: 기본 select */}
                                    <select
                                        name="inquiry_type"
                                        className="form-select desktop-only"
                                        value={formData.inquiry_type}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">선택해주세요</option>
                                        {inquiryOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {/* Mobile: 바텀시트 트리거 */}
                                    <button
                                        type="button"
                                        className="form-select-trigger mobile-only"
                                        onClick={() => setShowSelectSheet(true)}
                                    >
                                        <span className={formData.inquiry_type ? '' : 'placeholder'}>
                                            {formData.inquiry_type || '선택해주세요'}
                                        </span>
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </button>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">문의 내용 <span className="required">*</span></label>
                                    <textarea
                                        name="message"
                                        className="form-textarea"
                                        rows={5}
                                        placeholder="문의 내용을 입력해주세요"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-privacy">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="privacyAgree"
                                            checked={formData.privacyAgree}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span>개인정보 수집 및 이용에 동의합니다. <Link href="/privacy" style={{ color: 'var(--accent)' }}>(자세히 보기)</Link></span>
                                    </label>
                                </div>

                                <button type="submit" className="btn-submit" disabled={loading}>
                                    {loading ? '접수 중...' : '문의 접수'}
                                    {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </section>

            {/* 모바일 바텀시트 */}
            {showSelectSheet && (
                <>
                    <div className="bottom-sheet-overlay" onClick={() => setShowSelectSheet(false)} />
                    <div className="bottom-sheet">
                        <div className="bottom-sheet-header">
                            <span>문의 유형 선택</span>
                            <button onClick={() => setShowSelectSheet(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="bottom-sheet-options">
                            {inquiryOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`bottom-sheet-option ${formData.inquiry_type === opt.value ? 'active' : ''}`}
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, inquiry_type: opt.value }));
                                        setShowSelectSheet(false);
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
