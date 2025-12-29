'use client';

import Link from 'next/link';
import { useState } from 'react';

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const emailBody = `
이름: ${formData.name}
연락처: ${formData.phone}
회사명: ${formData.company || '(없음)'}
이메일: ${formData.email}
문의유형: ${formData.inquiry_type}

문의내용:
${formData.message}
    `.trim();

        const subject = encodeURIComponent(`[도담부고 문의] ${formData.name}님의 ${formData.inquiry_type} 문의`);
        const body = encodeURIComponent(emailBody);
        const mailtoLink = `mailto:wsh9991@gmail.com?subject=${subject}&body=${body}`;

        window.location.href = mailtoLink;
        setSubmitted(true);
    };

    return (
        <div className="legal-page">
            <header className="legal-header">
                <Link href="/" className="back-btn">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <h1>제휴/문의</h1>
            </header>

            <main className="legal-content">
                <section className="contact-intro">
                    <p>도담부고 서비스와 제휴를 원하시거나 문의사항이 있으신 경우 아래 양식을 작성해주세요.</p>
                    <p>빠른 시일 내에 답변드리겠습니다.</p>
                </section>

                {submitted ? (
                    <div className="success-message">
                        <span className="material-symbols-outlined">check_circle</span>
                        <p>문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="contact-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">이름 <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="이름을 입력해주세요"
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
                                placeholder="회사명을 입력해주세요 (선택)"
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
                            <select
                                name="inquiry_type"
                                className="form-select"
                                value={formData.inquiry_type}
                                onChange={handleChange}
                                required
                            >
                                <option value="">선택해주세요</option>
                                <option value="제휴 문의">제휴 문의</option>
                                <option value="서비스 문의">서비스 문의</option>
                                <option value="기술 지원">기술 지원</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">문의 내용 <span className="required">*</span></label>
                            <textarea
                                name="message"
                                className="form-textarea"
                                rows={6}
                                placeholder="문의하실 내용을 상세히 입력해주세요"
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
                                <span>개인정보 수집 및 이용에 동의합니다. <Link href="/privacy">(자세히 보기)</Link></span>
                            </label>
                        </div>

                        <button type="submit" className="btn-submit">
                            문의 전송
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </form>
                )}

                <div className="contact-info-box">
                    <h3>📞 연락처 정보</h3>
                    <ul>
                        <li><strong>이메일:</strong> wsh9991@gmail.com</li>
                        <li><strong>운영시간:</strong> 평일 09:00 - 18:00 (주말 및 공휴일 제외)</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
