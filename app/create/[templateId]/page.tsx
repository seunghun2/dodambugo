'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useParams } from 'next/navigation';
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

// 템플릿 정보
const templateInfo: Record<string, { name: string; image: string }> = {
    basic: { name: '기본형', image: '/images/template-basic.png' },
    ribbon: { name: '정중형', image: '/images/template-ribbon.png' },
    border: { name: '안내형', image: '/images/template-border.png' },
    flower: { name: '국화', image: '/images/template-flower.png' },
};

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

export default function WriteFormPage() {
    const router = useRouter();
    const params = useParams();
    const templateId = params.templateId as string;

    // 유효한 템플릿인지 확인
    useEffect(() => {
        if (!['basic', 'ribbon', 'border', 'flower'].includes(templateId)) {
            router.push('/create');
        }
    }, [templateId, router]);

    // Side menu
    const [sideMenuOpen, setSideMenuOpen] = useState(false);

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

    // 계좌 정보 (복수)
    const [showAccount, setShowAccount] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([
        { holder: '', bank: '', number: '' }
    ]);

    // 영정 사진
    const [showPhoto, setShowPhoto] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');

    // 제출 상태
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdBugo, setCreatedBugo] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(1); // 1: 입력, 2: 완료

    // 날짜 초기화
    useEffect(() => {
        const today = new Date();
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
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

    // 계좌 추가
    const addAccount = () => {
        if (accounts.length < 5) {
            setAccounts([...accounts, { holder: '', bank: '', number: '' }]);
        }
    };

    // 계좌 삭제
    const removeAccount = (index: number) => {
        if (accounts.length > 1) {
            setAccounts(accounts.filter((_, i) => i !== index));
        }
    };

    // 계좌 수정
    const updateAccount = (index: number, field: keyof Account, value: string) => {
        const updated = [...accounts];
        updated[index][field] = value;
        setAccounts(updated);
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

    // 주소 검색
    const handleAddressSearch = () => {
        if (typeof window === 'undefined' || !(window as any).daum) {
            alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        new (window as any).daum.Postcode({
            oncomplete: function (data: any) {
                // 기본 주소
                let fullAddress = data.address;
                // 건물명이 있을 경우 추가
                if (data.buildingName) {
                    fullAddress += ` (${data.buildingName})`;
                }
                setFormData(prev => ({
                    ...prev,
                    address: fullAddress
                }));
            }
        }).open();
    };

    // 폼 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.applicant_name || !formData.phone_password || !formData.deceased_name || !formData.gender) {
            alert('필수 항목을 모두 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const bugoNumber = await generateBugoNumber();

            const deathDateTime = formData.death_date && formData.death_hour
                ? new Date(`${formData.death_date}T${formData.death_hour.padStart(2, '0')}:${formData.death_minute}:00`).toISOString()
                : null;

            const encoffinDateTime = formData.encoffin_date && formData.encoffin_hour
                ? new Date(`${formData.encoffin_date}T${formData.encoffin_hour.padStart(2, '0')}:${formData.encoffin_minute}:00`).toISOString()
                : null;

            const funeralDateTime = formData.funeral_date && formData.funeral_hour
                ? new Date(`${formData.funeral_date}T${formData.funeral_hour.padStart(2, '0')}:${formData.funeral_minute}:00`).toISOString()
                : null;

            const bugoData = {
                bugo_number: bugoNumber,
                template_id: templateId,
                applicant_name: formData.applicant_name,
                phone_password: formData.phone_password,
                deceased_name: formData.deceased_name,
                gender: formData.gender,
                relationship: formData.relationship || null,
                age: formData.age ? parseInt(formData.age) : null,
                religion: formData.religion || null,
                funeral_home: formData.funeral_home || null,
                room_number: formData.room_number || null,
                funeral_home_tel: formData.funeral_home_tel || null,
                address: formData.address || null,
                address_detail: formData.address_detail || null,
                death_datetime: deathDateTime,
                encoffin_datetime: encoffinDateTime,
                funeral_datetime: funeralDateTime,
                burial_place: formData.burial_place || null,
                message: formData.message || null,
                mourners: mourners.filter(m => m.name),
                account_info: showAccount && accounts.some(a => a.bank || a.holder || a.number) ? accounts.filter(a => a.bank && a.holder && a.number) : null,
                photo_url: showPhoto ? photoUrl : null,
                status: 'active',
            };

            const { data, error } = await supabase
                .from('bugo')
                .insert([bugoData])
                .select()
                .single();

            if (error) throw error;

            // 완료 페이지로 리다이렉트
            router.push(`/create/complete/${data.bugo_number}`);
        } catch (error) {
            console.error('Error:', error);
            alert('부고장 생성 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 링크 복사
    const copyLink = () => {
        if (createdBugo) {
            const link = `${window.location.origin}/view/${createdBugo.id}`;
            navigator.clipboard.writeText(link);
            alert('링크가 복사되었습니다.');
        }
    };

    const template = templateInfo[templateId] || templateInfo.basic;

    return (
        <>
            {/* Daum Postcode Script */}
            <Script
                src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="lazyOnload"
            />

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
                        {/* Step 1: 정보 입력 */}
                        {currentStep === 1 && (
                            <section className="step-section active">
                                {/* 선택된 템플릿 표시 */}
                                <div className="selected-template-banner">
                                    <span>선택된 양식: <strong>{template.name}</strong></span>
                                    <Link href="/create" className="btn-change-template">변경</Link>
                                </div>

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
                                                type="text"
                                                name="phone_password"
                                                className="form-input"
                                                placeholder="휴대번호 뒷 4자리"
                                                maxLength={4}
                                                value={formData.phone_password}
                                                onChange={handleChange}
                                                required
                                            />
                                            <p className="form-hint">부고장 수정 시 사용됩니다 (4자리 숫자)</p>
                                        </div>
                                    </div>

                                    {/* 고인 정보 */}
                                    <div className="form-section">
                                        <h2 className="section-title">고인 정보</h2>

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

                                        <div className="form-group">
                                            <label className="form-label">관계</label>
                                            <select
                                                name="relationship"
                                                className="form-select"
                                                value={formData.relationship}
                                                onChange={handleChange}
                                            >
                                                <option value="">선택</option>
                                                {relationOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">향년</label>
                                                <input
                                                    type="number"
                                                    name="age"
                                                    className="form-input"
                                                    placeholder="나이"
                                                    value={formData.age}
                                                    onChange={handleChange}
                                                />
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
                                        </div>
                                    </div>

                                    {/* 상주 정보 */}
                                    <div className="form-section">
                                        <h2 className="section-title">상주 정보</h2>

                                        {mourners.map((mourner, index) => (
                                            <div key={index} className="mourner-row">
                                                <select
                                                    className="form-select mourner-relation"
                                                    value={mourner.relationship}
                                                    onChange={(e) => updateMourner(index, 'relationship', e.target.value)}
                                                >
                                                    <option value="">관계</option>
                                                    {relationOptions.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    className="form-input mourner-name"
                                                    placeholder="성함"
                                                    value={mourner.name}
                                                    onChange={(e) => updateMourner(index, 'name', e.target.value)}
                                                />
                                                <input
                                                    type="tel"
                                                    className="form-input mourner-contact"
                                                    placeholder="연락처"
                                                    value={mourner.contact}
                                                    onChange={(e) => updateMourner(index, 'contact', formatPhone(e.target.value))}
                                                />
                                                {mourners.length > 1 && (
                                                    <button type="button" className="btn-remove-mourner" onClick={() => removeMourner(index)}>
                                                        <span className="material-symbols-outlined">remove_circle</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="btn-add-mourner" onClick={addMourner}>
                                            <span className="material-symbols-outlined">add_circle</span>
                                            상주 추가
                                        </button>
                                    </div>

                                    {/* 빈소 정보 */}
                                    <div className="form-section">
                                        <h2 className="section-title">빈소 정보</h2>

                                        <div className="form-group">
                                            <label className="form-label">장례식장</label>
                                            <input
                                                type="text"
                                                name="funeral_home"
                                                className="form-input"
                                                placeholder="장례식장명"
                                                value={formData.funeral_home}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">호실</label>
                                            <input
                                                type="text"
                                                name="room_number"
                                                className="form-input"
                                                placeholder="호실 (예: 특1호)"
                                                value={formData.room_number}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">연락처</label>
                                            <input
                                                type="tel"
                                                name="funeral_home_tel"
                                                className="form-input"
                                                placeholder="장례식장 연락처"
                                                value={formData.funeral_home_tel}
                                                onChange={(e) => setFormData(prev => ({ ...prev, funeral_home_tel: formatPhone(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">주소</label>
                                            <div className="address-search-row">
                                                <input
                                                    type="text"
                                                    name="address"
                                                    className="form-input"
                                                    placeholder="주소"
                                                    value={formData.address}
                                                    readOnly
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-address-search"
                                                    onClick={handleAddressSearch}
                                                >
                                                    주소 찾기
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">상세주소</label>
                                            <input
                                                type="text"
                                                name="address_detail"
                                                className="form-input"
                                                placeholder="상세주소 (예: 101동 201호)"
                                                value={formData.address_detail}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    {/* 일정 정보 */}
                                    <div className="form-section">
                                        <h2 className="section-title">일정</h2>

                                        <div className="form-group">
                                            <label className="form-label">별세일</label>
                                            <div className="datetime-row">
                                                <input
                                                    type="date"
                                                    name="death_date"
                                                    className="form-input"
                                                    value={formData.death_date}
                                                    onChange={handleChange}
                                                />
                                                <select
                                                    name="death_hour"
                                                    className="form-select time-select"
                                                    value={formData.death_hour}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">시</option>
                                                    {Array.from({ length: 24 }, (_, i) => (
                                                        <option key={i} value={i}>{i}시</option>
                                                    ))}
                                                </select>
                                                <select
                                                    name="death_minute"
                                                    className="form-select time-select"
                                                    value={formData.death_minute}
                                                    onChange={handleChange}
                                                >
                                                    {['00', '10', '20', '30', '40', '50'].map(m => (
                                                        <option key={m} value={m}>{m}분</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">발인일</label>
                                            <div className="datetime-row">
                                                <input
                                                    type="date"
                                                    name="funeral_date"
                                                    className="form-input"
                                                    value={formData.funeral_date}
                                                    onChange={handleChange}
                                                />
                                                <select
                                                    name="funeral_hour"
                                                    className="form-select time-select"
                                                    value={formData.funeral_hour}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">시</option>
                                                    {Array.from({ length: 24 }, (_, i) => (
                                                        <option key={i} value={i}>{i}시</option>
                                                    ))}
                                                </select>
                                                <select
                                                    name="funeral_minute"
                                                    className="form-select time-select"
                                                    value={formData.funeral_minute}
                                                    onChange={handleChange}
                                                >
                                                    {['00', '10', '20', '30', '40', '50'].map(m => (
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
                                                placeholder="장지 (예: OO공원묘지)"
                                                value={formData.burial_place}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    {/* 추가 옵션 */}
                                    <div className="form-section">
                                        <h2 className="section-title">추가 옵션</h2>

                                        <div className="form-group">
                                            <label className="form-label">인사말</label>
                                            <textarea
                                                name="message"
                                                className="form-textarea"
                                                placeholder="조문객들에게 전할 인사말"
                                                rows={4}
                                                value={formData.message}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="option-toggle">
                                            <label className="toggle-label">
                                                <input
                                                    type="checkbox"
                                                    checked={showAccount}
                                                    onChange={(e) => setShowAccount(e.target.checked)}
                                                />
                                                <span>부의금 계좌 추가</span>
                                            </label>
                                        </div>

                                        {showAccount && (
                                            <div className="account-fields">
                                                {accounts.map((acc, index) => (
                                                    <div key={index} className="account-row">
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="예금주"
                                                            value={acc.holder}
                                                            onChange={(e) => updateAccount(index, 'holder', e.target.value)}
                                                        />
                                                        <select
                                                            className="form-select"
                                                            value={acc.bank}
                                                            onChange={(e) => updateAccount(index, 'bank', e.target.value)}
                                                        >
                                                            <option value="">은행 선택</option>
                                                            {bankOptions.map(bank => (
                                                                <option key={bank} value={bank}>{bank}</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="계좌번호"
                                                            value={acc.number}
                                                            onChange={(e) => updateAccount(index, 'number', e.target.value)}
                                                        />
                                                        {accounts.length > 1 && (
                                                            <button type="button" className="btn-remove-account" onClick={() => removeAccount(index)}>
                                                                <span className="material-symbols-outlined">remove_circle</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {accounts.length < 5 && (
                                                    <button type="button" className="btn-add-account" onClick={addAccount}>
                                                        <span className="material-symbols-outlined">add_circle</span>
                                                        계좌 추가 ({accounts.length}/5)
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* 제출 버튼 */}
                                    <div className="form-actions">
                                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                            {isSubmitting ? '생성 중...' : '부고장 만들기'}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        )}

                        {/* Step 2: 완료 */}
                        {currentStep === 2 && createdBugo && (
                            <section className="step-section active">
                                <div className="share-container">
                                    <div className="share-icon success">
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
                                        <button type="button" className="btn-share kakao">카카오톡 공유</button>
                                        <button type="button" className="btn-share sms">문자 공유</button>
                                        <button type="button" className="btn-share link" onClick={copyLink}>링크 공유</button>
                                    </div>

                                    <div className="share-actions">
                                        <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)}>수정하기</button>
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
        </>
    );
}
