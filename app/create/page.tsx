'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// 관계 옵션
const relationOptions = [
    '배우자', '아들', '딸', '며느리', '사위', '손', '손자', '손녀',
    '외손', '외손자', '외손녀', '증손', '부친', '모친', '형', '오빠',
    '누나', '언니', '동생', '형수', '제수', '매형', '자제'
];

// 종교 옵션
const religionOptions = ['불교', '기독교', '천주교', '무교', '기타'];

// 은행 옵션
const bankOptions = [
    'KB국민은행', '신한은행', '우리은행', '하나은행', 'NH농협은행',
    'IBK기업은행', 'SC제일은행', '카카오뱅크', '케이뱅크', '토스뱅크'
];

interface Mourner {
    relationship: string;
    name: string;
    contact: string;
}

interface Account {
    holder: string;
    bank: string;
    number: string;
}

function CreatePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Side menu
    const [sideMenuOpen, setSideMenuOpen] = useState(false);

    // 미리보기 모달
    const [previewTemplate, setPreviewTemplate] = useState<{ id: string, name: string, image: string, preview: string } | null>(null);

    // Step 관리
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    // Form 데이터
    const [formData, setFormData] = useState({
        applicant_name: '',
        phone_password: '',
        deceased_name: '',
        gender: '',
        relationship: '',
        age: '',
        religion: '',
        religion_custom: '',
        funeral_home: '',
        room_number: '',
        funeral_home_tel: '',
        address: '',
        address_detail: '',
        death_date: '',
        death_hour: '',
        death_minute: '00',
        encoffin_date: '',
        encoffin_hour: '',
        encoffin_minute: '00',
        funeral_date: '',
        funeral_hour: '',
        funeral_minute: '00',
        burial_place: '',
        message: '',
    });

    // 상주 목록
    const [mourners, setMourners] = useState<Mourner[]>([
        { relationship: '', name: '', contact: '' }
    ]);

    // 계좌 정보
    const [showAccount, setShowAccount] = useState(false);
    const [account, setAccount] = useState<Account>({ holder: '', bank: '', number: '' });

    // 영정 사진
    const [showPhoto, setShowPhoto] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');

    // 제출 상태
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdBugo, setCreatedBugo] = useState<any>(null);

    // 날짜 초기화
    useEffect(() => {
        const today = new Date();
        const formatDate = (date: Date) => {
            return date.toISOString().split('T')[0];
        };

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        setFormData(prev => ({
            ...prev,
            death_date: formatDate(today),
            encoffin_date: formatDate(tomorrow),
            funeral_date: formatDate(dayAfter),
        }));
    }, []);

    // URL 템플릿 파라미터 확인
    useEffect(() => {
        const template = searchParams.get('template');
        if (template && ['basic', 'ribbon', 'border', 'flower'].includes(template)) {
            setSelectedTemplate(template);
            setCurrentStep(2);
        }
    }, [searchParams]);

    // 템플릿 선택
    const handleSelectTemplate = (template: string) => {
        setSelectedTemplate(template);
        setTimeout(() => setCurrentStep(2), 300);
    };

    // 폼 입력 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 전화번호 포맷
    const formatPhone = (value: string) => {
        const numbers = value.replace(/[^0-9]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return numbers.slice(0, 3) + '-' + numbers.slice(3);
        return numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
    };

    // 상주 추가
    const addMourner = () => {
        setMourners([...mourners, { relationship: '', name: '', contact: '' }]);
    };

    // 상주 삭제
    const removeMourner = (index: number) => {
        if (mourners.length > 1) {
            setMourners(mourners.filter((_, i) => i !== index));
        }
    };

    // 상주 수정
    const updateMourner = (index: number, field: keyof Mourner, value: string) => {
        const updated = [...mourners];
        updated[index][field] = value;
        setMourners(updated);
    };

    // 부고번호 생성
    const generateBugoNumber = async (): Promise<string> => {
        let bugoNumber: string;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 50) {
            bugoNumber = String(Math.floor(1000 + Math.random() * 9000));
            const { data } = await supabase
                .from('bugo')
                .select('id')
                .eq('bugo_number', bugoNumber!)
                .limit(1);

            if (!data || data.length === 0) {
                isUnique = true;
                return bugoNumber!;
            }
            attempts++;
        }
        return String(Date.now()).slice(-4);
    };

    // 폼 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        if (!formData.applicant_name || !formData.phone_password || !formData.deceased_name || !formData.gender) {
            alert('필수 항목을 모두 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const bugoNumber = await generateBugoNumber();

            // 상주 정보 문자열 변환
            const mournersText = mourners
                .filter(m => m.name)
                .map(m => `${m.relationship} ${m.name} (${m.contact})`)
                .join('\n');

            // 계좌 정보 문자열 변환
            const accountText = showAccount && account.holder
                ? `${account.bank} ${account.number} (${account.holder})`
                : null;

            // 발인 시간 조합
            const funeralTime = formData.funeral_hour && formData.funeral_minute
                ? `${formData.funeral_hour}:${formData.funeral_minute}`
                : null;

            // 종교
            const religion = formData.religion === '기타' ? formData.religion_custom : formData.religion;

            const saveData = {
                bugo_number: bugoNumber,
                template: selectedTemplate,
                applicant_name: formData.applicant_name,
                phone_password: formData.phone_password,
                deceased_name: formData.deceased_name,
                gender: formData.gender,
                relationship: formData.relationship || null,
                age: formData.age ? parseInt(formData.age) : null,
                religion: religion || null,
                mourner_name: mourners[0]?.name || '',
                contact: mourners[0]?.contact || '',
                funeral_home: formData.funeral_home,
                room_number: formData.room_number || null,
                funeral_home_tel: formData.funeral_home_tel || null,
                address: formData.address
                    ? `${formData.address} ${formData.address_detail || ''}`.trim()
                    : null,
                death_date: formData.death_date || null,
                funeral_date: formData.funeral_date || null,
                funeral_time: funeralTime,
                burial_place: formData.burial_place || null,
                message: formData.message || null,
                family_list: mournersText || null,
                account_info: accountText,
                photo_url: photoUrl || null,
            };

            const { data, error } = await supabase
                .from('bugo')
                .insert([saveData])
                .select()
                .single();

            if (error) throw error;

            setCreatedBugo(data);
            setCurrentStep(3);
        } catch (error) {
            console.error('부고장 생성 오류:', error);
            alert('부고장 생성 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 링크 복사
    const copyLink = () => {
        if (createdBugo) {
            const url = `${window.location.origin}/view/${createdBugo.id}`;
            navigator.clipboard.writeText(url);
            alert('링크가 복사되었습니다.');
        }
    };

    // 시간 옵션 생성
    const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minuteOptions = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

    return (
        <div className="create-page">
            {/* Navigation - 메인과 동일 */}
            <nav className="nav" id="nav">
                <div className="nav-container">
                    <Link href="/" className="nav-logo" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>도담부고</Link>
                    <ul className="nav-menu" id="navMenu">
                        <li><Link href="/" className="nav-link">홈</Link></li>
                        <li><Link href="/search" className="nav-link">부고검색</Link></li>
                        <li><Link href="/#templates" className="nav-link">템플릿</Link></li>
                    </ul>
                    <div className="nav-actions">
                        <button className="nav-toggle" onClick={() => setSideMenuOpen(true)}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Side Menu */}
            <div className={`side-menu ${sideMenuOpen ? 'active' : ''}`} id="sideMenu">
                <div className="side-menu-overlay" onClick={() => setSideMenuOpen(false)}></div>
                <div className="side-menu-content">
                    <div className="side-menu-header">
                        <div className="side-menu-logo">도담부고</div>
                        <button className="side-menu-close" onClick={() => setSideMenuOpen(false)}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <nav className="side-menu-nav">
                        <Link href="/create" className="side-menu-item">
                            <span className="material-symbols-outlined">add_circle</span>
                            <span>부고장 만들기</span>
                        </Link>
                        <Link href="/search" className="side-menu-item">
                            <span className="material-symbols-outlined">search</span>
                            <span>부고 검색</span>
                        </Link>
                        <Link href="/contact" className="side-menu-item">
                            <span className="material-symbols-outlined">contact_support</span>
                            <span>문의하기</span>
                        </Link>
                    </nav>
                </div>
            </div>

            <main className="create-main">
                <div className="create-container">
                    {/* Step 1: 템플릿 선택 */}
                    {currentStep === 1 && (
                        <section className="step-section active">
                            <div className="template-notice" id="templateNotice">
                                <span className="material-symbols-outlined">info</span>
                                <span>간편하게 모바일 부고장을 만들어보세요.</span>
                                <button type="button" className="notice-close" onClick={() => {
                                    const notice = document.getElementById('templateNotice');
                                    if (notice) notice.style.display = 'none';
                                }}>
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="template-carousel">
                                {[
                                    { id: 'basic', name: '부고장 기본형', image: '/images/basic.png', preview: '/templates/basic.html' },
                                    { id: 'ribbon', name: '부고장 정중형', image: '/images/ribbon.png', preview: '/templates/ribbon.html' },
                                    { id: 'border', name: '부고장 안내형', image: '/images/border.png', preview: '/templates/border.html' },
                                    { id: 'flower', name: '부고장 국화', image: '/images/flower-detail.png', preview: '/templates/flower.html' },
                                ].map(template => (
                                    <div key={template.id} className="template-slide">
                                        <div className="template-phone">
                                            <img src={template.image} alt={template.name} />
                                        </div>
                                        <div className="template-bottom">
                                            <div className="template-meta">
                                                <span className="template-name">{template.name}</span>
                                                <Link
                                                    href={`/create/preview/${template.id}`}
                                                    className="btn-preview-outline"
                                                >
                                                    미리보기
                                                </Link>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-use-template"
                                                onClick={() => handleSelectTemplate(template.id)}
                                            >
                                                이 양식으로 만들기
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Step 2: 정보 입력 */}
                    {currentStep === 2 && (
                        <section className="step-section active">
                            <form className="bugo-form" onSubmit={handleSubmit}>
                                {/* 신청자 정보 */}
                                <div className="form-section applicant-section">
                                    <h2 className="section-title">신청자 정보</h2>
                                    <p className="section-description">부고장 수정 시 필요한 정보입니다</p>

                                    <div className="form-group">
                                        <label className="form-label required">신청자명</label>
                                        <input
                                            type="text"
                                            name="applicant_name"
                                            className="form-input"
                                            placeholder="신청자 성함"
                                            value={formData.applicant_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">휴대번호 뒷자리</label>
                                        <input
                                            type="password"
                                            name="phone_password"
                                            className="form-input"
                                            placeholder="휴대번호 뒷 4자리"
                                            maxLength={4}
                                            value={formData.phone_password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <p className="form-help">부고장 수정 시 사용됩니다 (4자리 숫자)</p>
                                    </div>
                                </div>

                                {/* 고인 정보 */}
                                <div className="form-section">
                                    <h2 className="section-title">고인 정보</h2>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label required">성함</label>
                                            <input
                                                type="text"
                                                name="deceased_name"
                                                className="form-input"
                                                placeholder="고인의 성함"
                                                value={formData.deceased_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label required">성별</label>
                                            <select
                                                name="gender"
                                                className="form-select"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">선택</option>
                                                <option value="남">남</option>
                                                <option value="여">여</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label required">관계</label>
                                            <select
                                                name="relationship"
                                                className="form-select"
                                                value={formData.relationship}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">선택</option>
                                                {relationOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">연세</label>
                                            <input
                                                type="text"
                                                name="age"
                                                className="form-input"
                                                placeholder="세"
                                                maxLength={3}
                                                value={formData.age}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">종교</label>
                                        <select
                                            name="religion"
                                            className="form-select"
                                            value={formData.religion}
                                            onChange={handleChange}
                                        >
                                            <option value="">선택</option>
                                            {religionOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {formData.religion === '기타' && (
                                        <div className="form-group">
                                            <label className="form-label">종교 직접 입력</label>
                                            <input
                                                type="text"
                                                name="religion_custom"
                                                className="form-input"
                                                placeholder="종교를 입력하세요"
                                                value={formData.religion_custom}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* 상주 정보 */}
                                <div className="form-section">
                                    <h2 className="section-title">상주 정보</h2>

                                    {mourners.map((mourner, index) => (
                                        <div key={index} className="mourner-item">
                                            <div className="mourner-header">
                                                <span className="mourner-number">상주 {index + 1}</span>
                                                {mourners.length > 1 && (
                                                    <button type="button" className="btn-remove-mourner" onClick={() => removeMourner(index)}>
                                                        삭제
                                                    </button>
                                                )}
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label required">관계</label>
                                                    <select
                                                        className="form-select"
                                                        value={mourner.relationship}
                                                        onChange={(e) => updateMourner(index, 'relationship', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">선택</option>
                                                        {relationOptions.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label required">성함</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="상주 성함"
                                                        value={mourner.name}
                                                        onChange={(e) => updateMourner(index, 'name', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label required">연락처</label>
                                                <input
                                                    type="tel"
                                                    className="form-input"
                                                    placeholder="010-0000-0000"
                                                    value={mourner.contact}
                                                    onChange={(e) => updateMourner(index, 'contact', formatPhone(e.target.value))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="mourner-actions">
                                        <button type="button" className="btn-add-mourner" onClick={addMourner}>
                                            + 상주 추가
                                        </button>
                                    </div>
                                </div>

                                {/* 장례식장 정보 */}
                                <div className="form-section">
                                    <h2 className="section-title">장례식장 정보</h2>

                                    <div className="form-group">
                                        <label className="form-label required">장례식장</label>
                                        <input
                                            type="text"
                                            name="funeral_home"
                                            className="form-input"
                                            placeholder="장례식장명"
                                            value={formData.funeral_home}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">호실</label>
                                            <input
                                                type="text"
                                                name="room_number"
                                                className="form-input"
                                                placeholder="호실"
                                                value={formData.room_number}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">연락처</label>
                                            <input
                                                type="text"
                                                name="funeral_home_tel"
                                                className="form-input"
                                                placeholder="장례식장 연락처"
                                                value={formData.funeral_home_tel}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">주소</label>
                                        <input
                                            type="text"
                                            name="address"
                                            className="form-input"
                                            placeholder="장례식장 주소"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* 발인일시 */}
                                <div className="form-section">
                                    <h2 className="section-title">발인일시</h2>

                                    <div className="form-group">
                                        <label className="form-label required">발인 날짜</label>
                                        <input
                                            type="date"
                                            name="funeral_date"
                                            className="form-input"
                                            value={formData.funeral_date}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label required">시</label>
                                            <select
                                                name="funeral_hour"
                                                className="form-select"
                                                value={formData.funeral_hour}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">선택</option>
                                                {hourOptions.map(h => (
                                                    <option key={h} value={h}>{parseInt(h)}시</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">분</label>
                                            <select
                                                name="funeral_minute"
                                                className="form-select"
                                                value={formData.funeral_minute}
                                                onChange={handleChange}
                                            >
                                                {minuteOptions.map(m => (
                                                    <option key={m} value={m}>{m}분</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">장지</label>
                                        <input
                                            type="text"
                                            name="burial_place"
                                            className="form-input"
                                            placeholder="장지"
                                            value={formData.burial_place}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* 안내하는 글 */}
                                <div className="form-section">
                                    <h2 className="section-title">안내하는 글</h2>
                                    <div className="form-group">
                                        <label className="form-label">메시지</label>
                                        <textarea
                                            name="message"
                                            className="form-textarea"
                                            rows={5}
                                            placeholder="고인에 대한 추가 메시지나 안내사항을 입력하세요"
                                            value={formData.message}
                                            onChange={handleChange}
                                        ></textarea>
                                    </div>
                                </div>

                                {/* 계좌번호 정보 */}
                                <div className="form-section">
                                    <h2 className="section-title">계좌번호 정보</h2>
                                    <div className="form-group">
                                        <div className="option-item">
                                            <div className="option-info">
                                                <h4>계좌번호 입력</h4>
                                                <p>부의금 계좌 정보를 입력하시겠습니까?</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={showAccount}
                                                    onChange={(e) => setShowAccount(e.target.checked)}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    {showAccount && (
                                        <div className="account-info">
                                            <div className="account-item">
                                                <div className="account-header">계좌 1</div>
                                                <div className="form-group">
                                                    <label className="form-label">예금주</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="예금주"
                                                        value={account.holder}
                                                        onChange={(e) => setAccount({ ...account, holder: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label className="form-label">은행명</label>
                                                        <select
                                                            className="form-select"
                                                            value={account.bank}
                                                            onChange={(e) => setAccount({ ...account, bank: e.target.value })}
                                                        >
                                                            <option value="">선택</option>
                                                            {bankOptions.map(b => (
                                                                <option key={b} value={b}>{b}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">계좌번호</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="계좌번호"
                                                            value={account.number}
                                                            onChange={(e) => setAccount({ ...account, number: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 제출 버튼 */}
                                <div className="form-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)}>이전</button>
                                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? '처리 중...' : '작성 완료'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    {/* Step 3: 공유하기 */}
                    {currentStep === 3 && createdBugo && (
                        <section className="step-section active">
                            <div className="share-container">
                                <div className="completion-icon">
                                    <span className="material-symbols-outlined">check_circle</span>
                                </div>
                                <h1 className="share-title">부고장이 완성되었습니다</h1>
                                <p className="share-description">아래 링크를 복사하여 지인들에게 공유해주세요</p>

                                <div className="share-link-box">
                                    <input
                                        type="text"
                                        className="share-link-input"
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/view/${createdBugo.id}`}
                                        readOnly
                                    />
                                    <button type="button" className="btn-copy" onClick={copyLink}>복사</button>
                                </div>

                                <div className="share-buttons">
                                    <button type="button" className="btn-share kakao">
                                        카카오톡 공유
                                    </button>
                                    <button type="button" className="btn-share sms">
                                        문자 공유
                                    </button>
                                    <button type="button" className="btn-share link" onClick={copyLink}>
                                        링크 공유
                                    </button>
                                </div>

                                <div className="share-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setCurrentStep(2)}>수정하기</button>
                                    <Link href="/" className="btn-primary">메인으로</Link>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* 로딩 오버레이 */}
            {isSubmitting && (
                <div className="loading-overlay">
                    <div className="loading-content">
                        <span className="material-symbols-outlined spinning">progress_activity</span>
                        <p>부고장을 생성하고 있습니다...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CreatePage() {
    return (
        <Suspense fallback={<div className="create-page"><div className="create-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><span className="material-symbols-outlined spinning">progress_activity</span></div></div>}>
            <CreatePageContent />
        </Suspense>
    );
}
