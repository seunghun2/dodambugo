'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SideMenu from '@/components/SideMenu';
import FacilitySearchModal from '@/components/FacilitySearchModal';
import { DatePickerInput } from '@mantine/dates';
import '@mantine/dates/styles.css';
import 'dayjs/locale/ko';

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
    bank?: string;
    accountHolder?: string;
    accountNumber?: string;
}

interface Account {
    holder: string;
    bank: string;
    number: string;
}

export default function WriteFormPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const templateId = params.templateId as string;
    const editBugoNumber = searchParams.get('edit');

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
        death_time: '',
        death_hour: '',
        death_minute: '00',
        encoffin_date: '',
        encoffin_hour: '',
        encoffin_minute: '00',
        funeral_date: '',
        funeral_time: '',
        funeral_hour: '',
        funeral_minute: '00',
        burial_place: '',
        burial_place2: '',
        message: '',
        primary_mourner: '',
    });

    // 상주 목록
    const [mourners, setMourners] = useState<Mourner[]>([
        { relationship: '', name: '', contact: '' }
    ]);
    const [showMournerAccountModal, setShowMournerAccountModal] = useState(false);
    const [editingMournerIndex, setEditingMournerIndex] = useState<number | null>(null);
    const [tempMournerAccount, setTempMournerAccount] = useState({ bank: '', holder: '', number: '' });

    // 계좌 정보 (복수)
    const [showAccount, setShowAccount] = useState(false);
    const [isAccountSaved, setIsAccountSaved] = useState(false);
    const [tempAccount, setTempAccount] = useState<Account>({ holder: '', bank: '', number: '' });
    const [accounts, setAccounts] = useState<Account[]>([
        { holder: '', bank: '', number: '' }
    ]);

    // 장지 정보
    const [showBurial, setShowBurial] = useState(false);

    // 영정 사진
    const [showPhoto, setShowPhoto] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');

    // 제출 상태
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdBugo, setCreatedBugo] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(1); // 1: 입력, 2: 완료
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [privacyAgreed, setPrivacyAgreed] = useState(false);
    const [privacyOpen, setPrivacyOpen] = useState(false);

    // 임시저장 모달
    const [draftModalOpen, setDraftModalOpen] = useState(false);

    const handleDraftClick = () => {
        setDraftModalOpen(true);
    };

    const saveDraftAndGoHome = () => {
        const draftData = {
            formData,
            mourners,
            accounts,
            showAccount,
            showBurial,
            showPhoto,
            photoUrl,
            templateId,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(`bugo_draft_${templateId}`, JSON.stringify(draftData));
        setDraftModalOpen(false);
        router.push('/');
    };

    // 임시저장 자동 불러오기 (메인에서 "예" 선택 시 바로 복원)
    useEffect(() => {
        const draft = localStorage.getItem(`bugo_draft_${templateId}`);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                const savedAt = new Date(parsed.savedAt);
                const now = new Date();
                const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    // 자동 복원
                    if (parsed.formData) setFormData(parsed.formData);
                    if (parsed.mourners) setMourners(parsed.mourners);
                    if (parsed.accounts) setAccounts(parsed.accounts);
                    if (parsed.showAccount !== undefined) setShowAccount(parsed.showAccount);
                    if (parsed.showBurial !== undefined) setShowBurial(parsed.showBurial);
                    if (parsed.showPhoto !== undefined) setShowPhoto(parsed.showPhoto);
                    if (parsed.photoUrl) setPhotoUrl(parsed.photoUrl);
                }
            } catch (e) {
                console.log('Draft parse error');
            }
        }
    }, [templateId]);

    // 수정 모드: 기존 부고장 데이터 불러오기
    useEffect(() => {
        if (!editBugoNumber) return;

        const loadBugoData = async () => {
            try {
                const { data, error } = await supabase
                    .from('bugo')
                    .select('*')
                    .eq('bugo_number', editBugoNumber)
                    .single();

                if (error) throw error;
                if (!data) return;

                // formData 설정
                setFormData({
                    applicant_name: data.applicant_name || '',
                    phone_password: data.phone_password || '',
                    deceased_name: data.deceased_name || '',
                    gender: data.gender || '',
                    relationship: data.relationship || '',
                    age: data.age?.toString() || '',
                    religion: data.religion || '',
                    religion_custom: data.religion_custom || '',
                    funeral_home: data.funeral_home || '',
                    room_number: data.room_number || '',
                    funeral_home_tel: data.funeral_home_tel || '',
                    address: data.address || '',
                    address_detail: data.address_detail || '',
                    death_date: data.death_date || '',
                    death_time: data.death_time || '',
                    death_hour: data.death_time?.split(':')[0] || '',
                    death_minute: data.death_time?.split(':')[1] || '00',
                    encoffin_date: data.encoffin_date || '',
                    encoffin_hour: data.encoffin_time?.split(':')[0] || '',
                    encoffin_minute: data.encoffin_time?.split(':')[1] || '00',
                    funeral_date: data.funeral_date || '',
                    funeral_time: data.funeral_time || '',
                    funeral_hour: data.funeral_time?.split(':')[0] || '',
                    funeral_minute: data.funeral_time?.split(':')[1] || '00',
                    burial_place: data.burial_place || '',
                    burial_place2: data.burial_place2 || '',
                    message: data.message || '',
                    primary_mourner: data.primary_mourner || '',
                });

                // 상주 목록
                if (data.mourners && Array.isArray(data.mourners)) {
                    setMourners(data.mourners);
                }

                // 계좌 정보
                if (data.accounts && Array.isArray(data.accounts)) {
                    setAccounts(data.accounts);
                    setShowAccount(data.accounts.length > 0);
                }

                // 기타 옵션
                if (data.burial_place) setShowBurial(true);
                if (data.photo_url) {
                    setPhotoUrl(data.photo_url);
                    setShowPhoto(true);
                }
            } catch (err) {
                console.error('Error loading bugo:', err);
            }
        };

        loadBugoData();
    }, [editBugoNumber]);

    // 장례식장 검색 모달
    const [facilityModalOpen, setFacilityModalOpen] = useState(false);
    const roomNumberRef = useRef<HTMLInputElement>(null);
    const funeralHomeRef = useRef<HTMLInputElement>(null);

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

        // 연세는 3자리까지만
        if (name === 'age' && value.length > 3) {
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        // 입력 시 해당 필드 에러 클리어
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
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

        // 에러 클리어 (첫번째 상주의 name/contact 필드)
        if (index === 0) {
            if (field === 'name' && errors.mourner_name) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.mourner_name;
                    return newErrors;
                });
            }
            if (field === 'contact' && errors.mourner_contact) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.mourner_contact;
                    return newErrors;
                });
            }
        }
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

        // 유효성 검사
        const newErrors: Record<string, string> = {};

        if (!formData.applicant_name) newErrors.applicant_name = '신청자 성함을 입력해주세요';
        if (!formData.phone_password) newErrors.phone_password = '휴대번호 뒷자리를 입력해주세요';
        if (!formData.deceased_name) newErrors.deceased_name = '고인 성함을 입력해주세요';
        if (!formData.age) newErrors.age = '연세를 입력해주세요';
        if (formData.age && Number(formData.age) > 999) newErrors.age = '연세는 3자리까지만 입력해주세요';
        if (!formData.gender) newErrors.gender = '성별을 선택해주세요';
        if (!formData.relationship) newErrors.relationship = '관계를 선택해주세요';
        if (!mourners[0].name) newErrors.mourner_name = '상주 성함을 입력해주세요';
        if (!mourners[0].contact) newErrors.mourner_contact = '상주 연락처를 입력해주세요';
        if (!formData.funeral_home) newErrors.funeral_home = '장례식장명을 입력해주세요';
        if (!formData.room_number) newErrors.room_number = '호실을 입력해주세요';
        if (!formData.address) newErrors.address = '주소를 입력해주세요';
        if (!formData.funeral_date) newErrors.funeral_date = '발인 날짜를 선택해주세요';
        if (!formData.funeral_time || formData.funeral_time === '00:00') newErrors.funeral_time = '발인 시간을 입력해주세요';

        // 시간 유효성 검사 (24시간 이상 불가)
        if (formData.funeral_time && formData.funeral_time !== '00:00') {
            const [hours] = formData.funeral_time.split(':');
            if (parseInt(hours) >= 24) newErrors.funeral_time = '시간을 잘못 입력했습니다';
        }
        if (formData.death_time) {
            const [hours] = formData.death_time.split(':');
            if (parseInt(hours) >= 24) newErrors.death_time = '시간을 잘못 입력했습니다';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            // 첫 번째 에러 필드로 스크롤
            const firstErrorKey = Object.keys(newErrors)[0];
            const errorElement = document.querySelector(`[data-field="${firstErrorKey}"]`);
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setIsSubmitting(true);

        try {
            // 수정 모드면 기존 번호 사용, 아니면 새 번호 생성
            const bugoNumber = editBugoNumber || await generateBugoNumber();

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
                relationship: formData.relationship || mourners[0]?.relationship || null,
                mourner_name: mourners[0]?.name || null,
                contact: mourners[0]?.contact || null,
                age: formData.age ? parseInt(formData.age) : null,
                religion: formData.religion || null,
                funeral_home: formData.funeral_home || null,
                room_number: formData.room_number || null,
                funeral_home_tel: formData.funeral_home_tel || null,
                address: formData.address || null,
                address_detail: formData.address_detail || null,
                death_date: formData.death_date || null,
                death_time: formData.death_hour ? `${formData.death_hour}:${formData.death_minute}` : null,
                encoffin_date: formData.encoffin_date || null,
                encoffin_time: formData.encoffin_hour ? `${formData.encoffin_hour}:${formData.encoffin_minute}` : null,
                funeral_date: formData.funeral_date || null,
                funeral_time: formData.funeral_hour ? `${formData.funeral_hour}:${formData.funeral_minute}` : null,
                burial_place: formData.burial_place || null,
                burial_place2: formData.burial_place2?.trim() || null,
                message: formData.message || null,
                mourners: mourners.filter(m => m.name),
                account_info: showAccount && accounts.some(a => a.bank || a.holder || a.number) ? accounts.filter(a => a.bank && a.holder && a.number) : null,
                photo_url: showPhoto ? photoUrl : null,
                status: 'active',
            };

            let data, error;

            if (editBugoNumber) {
                // 수정 모드: update
                const result = await supabase
                    .from('bugo')
                    .update(bugoData)
                    .eq('bugo_number', editBugoNumber)
                    .select()
                    .single();
                data = result.data;
                error = result.error;
            } else {
                // 신규 생성: insert
                const result = await supabase
                    .from('bugo')
                    .insert([bugoData])
                    .select()
                    .single();
                data = result.data;
                error = result.error;
            }

            if (error) throw error;

            // 완료 페이지로 리다이렉트
            router.push(`/create/complete/${data.bugo_number}`);
        } catch (error) {
            console.error('Error:', error);
            alert(editBugoNumber ? '부고장 수정 중 오류가 발생했습니다.' : '부고장 생성 중 오류가 발생했습니다.');
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

                {/* Side Menu - 공통 컴포넌트 */}
                <SideMenu isOpen={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />

                <main className="create-main">
                    <div className="create-container">
                        {/* Step 1: 정보 입력 */}
                        {currentStep === 1 && (
                            <section className="step-section active">
                                {/* 선택된 템플릿 표시 */}
                                <div className="selected-template-banner">
                                    <span>선택된 양식: <strong>{template.name}</strong></span>
                                    <Link href={`/create?change=${templateId}`} className="btn-change-template">변경</Link>
                                </div>

                                <form className="bugo-form" onSubmit={handleSubmit}>
                                    {/* 신청자 정보 */}
                                    <div className="form-section applicant-section">
                                        <h2 className="section-title">신청자 정보</h2>
                                        <p className="section-description">부고장 수정 시 필요한 정보입니다</p>

                                        <div className="form-group" data-field="applicant_name">
                                            <label className="form-label required">신청자명</label>
                                            <input
                                                type="text"
                                                name="applicant_name"
                                                className={`form-input ${errors.applicant_name ? 'error' : ''}`}
                                                placeholder="신청자 성함"
                                                value={formData.applicant_name}
                                                onChange={handleChange}
                                            />
                                            {errors.applicant_name && <p className="field-error">{errors.applicant_name}</p>}
                                        </div>
                                        <div className="form-group" data-field="phone_password">
                                            <label className="form-label required">휴대번호 뒷자리</label>
                                            <input
                                                type="text"
                                                name="phone_password"
                                                className={`form-input ${errors.phone_password ? 'error' : ''}`}
                                                placeholder="휴대번호 뒷 4자리"
                                                maxLength={4}
                                                inputMode="numeric"
                                                value={formData.phone_password}
                                                onChange={handleChange}
                                            />
                                            {errors.phone_password && <p className="field-error">{errors.phone_password}</p>}
                                            {!errors.phone_password && <p className="form-hint">부고장 수정 시 사용됩니다 (4자리 숫자)</p>}
                                        </div>
                                    </div>

                                    {/* 장례식장 정보 */}
                                    <div className="form-section">
                                        <h2 className="section-title">장례식장 정보</h2>
                                        <p className="section-desc">조문객이 방문할 장례식장 정보입니다</p>

                                        {/* 장례식장 검색 입력 */}
                                        <div className="form-group">
                                            <div
                                                className="input-with-button"
                                                style={{ position: 'relative', cursor: 'pointer' }}
                                                onClick={() => setFacilityModalOpen(true)}
                                            >
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="장례식장을 검색해주세요"
                                                    style={{ paddingRight: '50px', cursor: 'pointer' }}
                                                    value={formData.address || ''}
                                                    readOnly
                                                />
                                                <button
                                                    type="button"
                                                    style={{
                                                        position: 'absolute',
                                                        right: '12px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        padding: '0',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined">search</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* 장례식장명 + 호실 */}
                                        <div className="form-row">
                                            <div className="form-group" data-field="funeral_home">
                                                <input
                                                    ref={funeralHomeRef}
                                                    type="text"
                                                    name="funeral_home"
                                                    className={`form-input ${errors.funeral_home ? 'error' : ''}`}
                                                    placeholder="장례식장명"
                                                    value={formData.funeral_home}
                                                    onChange={handleChange}
                                                />
                                                {errors.funeral_home && <p className="field-error">{errors.funeral_home}</p>}
                                            </div>

                                            <div className="form-group" data-field="room_number">
                                                <input
                                                    ref={roomNumberRef}
                                                    type="text"
                                                    name="room_number"
                                                    className={`form-input ${errors.room_number ? 'error' : ''}`}
                                                    placeholder="호실(예시:102호)"
                                                    value={formData.room_number}
                                                    onChange={handleChange}
                                                />
                                                {errors.room_number && <p className="field-error">{errors.room_number}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 부고 정보 */}
                                    <div className="form-section">
                                        <h2 className="section-title">부고 정보</h2>
                                        <p className="section-desc">고인 및 유가족 정보를 입력해주세요</p>

                                        <div className="form-group" data-field="deceased_name">
                                            <label className="form-label required">고인명</label>
                                            <input
                                                type="text"
                                                name="deceased_name"
                                                className={`form-input ${errors.deceased_name ? 'error' : ''}`}
                                                placeholder="고인명"
                                                value={formData.deceased_name}
                                                onChange={handleChange}
                                            />
                                            {errors.deceased_name && <p className="field-error">{errors.deceased_name}</p>}
                                        </div>

                                        {/* 연세 + 성별 + 종교 */}
                                        <div className="form-row form-row-3">
                                            <div className="form-group" data-field="age">
                                                <label className="form-label required">연세</label>
                                                <input
                                                    type="text"
                                                    name="age"
                                                    className={`form-input ${errors.age ? 'error' : ''}`}
                                                    placeholder="연세"
                                                    maxLength={3}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    value={formData.age}
                                                    onChange={handleChange}
                                                />
                                                {errors.age && <p className="field-error">{errors.age}</p>}
                                            </div>

                                            <div className="form-group" data-field="gender">
                                                <label className="form-label required">성별</label>
                                                <select
                                                    name="gender"
                                                    className={`form-select ${errors.gender ? 'error' : ''}`}
                                                    value={formData.gender}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">선택</option>
                                                    <option value="남">남</option>
                                                    <option value="여">여</option>
                                                </select>
                                                {errors.gender && <p className="field-error">{errors.gender}</p>}
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

                                        {/* 구분선 */}
                                        <hr className="form-divider" />

                                        {/* 상주 라벨 */}
                                        <label className="form-label required">상주</label>

                                        {/* 고인과의 관계 + 대표상주 */}
                                        <div className="mourner-row primary-mourner" data-field="relationship">
                                            <select
                                                name="relationship"
                                                className={`form-select mourner-relation ${errors.relationship ? 'error' : ''}`}
                                                value={formData.relationship}
                                                onChange={handleChange}
                                            >
                                                <option value="">관계</option>
                                                {relationOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                name="primary_mourner"
                                                className={`form-input mourner-name ${errors.primary_mourner ? 'error' : ''}`}
                                                placeholder="대표상주"
                                                value={formData.primary_mourner || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        {errors.relationship && <p className="field-error">{errors.relationship}</p>}
                                        {errors.primary_mourner && <p className="field-error">{errors.primary_mourner}</p>}

                                        {/* 계좌 입력 */}
                                        <div className="account-input-row">
                                            <span className="material-symbols-outlined">account_balance</span>
                                            <input
                                                type="text"
                                                className={`account-input-field ${accounts[0]?.bank && accounts[0]?.number ? 'filled' : ''}`}
                                                placeholder="계좌를 입력해주세요."
                                                value={accounts[0]?.bank && accounts[0]?.number ? `${accounts[0].bank} : ${accounts[0].number}` : ''}
                                                readOnly
                                                onClick={() => {
                                                    setTempAccount({ ...accounts[0] });
                                                    setShowAccount(true);
                                                }}
                                            />
                                            <button type="button" className="btn-account-edit" onClick={() => {
                                                setTempAccount({ ...accounts[0] });
                                                setShowAccount(true);
                                            }}>
                                                {isAccountSaved ? '변경하기' : '추가하기'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 추가 상주 */}
                                    <div className="form-section">
                                        <h2 className="section-title">추가 상주</h2>
                                        <p className="section-desc">함께 상을 치르는 유가족을 추가해주세요</p>

                                        {mourners.map((mourner, index) => (
                                            <div key={index} className="mourner-block">
                                                <div className={`mourner-row ${mourners.length > 1 ? 'has-delete' : ''}`} data-field={index === 0 ? 'mourner_name' : undefined}>
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
                                                        className={`form-input mourner-name ${index === 0 && errors.mourner_name ? 'error' : ''}`}
                                                        placeholder="성함"
                                                        value={mourner.name}
                                                        onChange={(e) => updateMourner(index, 'name', e.target.value)}
                                                    />
                                                    <input
                                                        type="tel"
                                                        className={`form-input mourner-contact ${index === 0 && errors.mourner_contact ? 'error' : ''}`}
                                                        placeholder="연락처"
                                                        value={mourner.contact}
                                                        onChange={(e) => updateMourner(index, 'contact', formatPhone(e.target.value))}
                                                    />
                                                    {mourners.length > 1 && (
                                                        <button type="button" className="btn-delete-mourner" onClick={() => removeMourner(index)}>
                                                            <span className="material-symbols-outlined">close</span>
                                                        </button>
                                                    )}
                                                </div>
                                                {/* 상주별 계좌 입력 (선택) */}
                                                <div className="account-input-row mourner-account">
                                                    <span className="material-symbols-outlined">account_balance</span>
                                                    <input
                                                        type="text"
                                                        className={`account-input-field ${mourner.bank && mourner.accountNumber ? 'filled' : ''}`}
                                                        placeholder="계좌를 입력해주세요."
                                                        value={mourner.bank && mourner.accountNumber ? `${mourner.bank} : ${mourner.accountNumber}` : ''}
                                                        readOnly
                                                        onClick={() => {
                                                            setTempMournerAccount({
                                                                bank: mourner.bank || '',
                                                                holder: mourner.accountHolder || mourner.name || '',
                                                                number: mourner.accountNumber || ''
                                                            });
                                                            setEditingMournerIndex(index);
                                                            setShowMournerAccountModal(true);
                                                        }}
                                                    />
                                                    <button type="button" className="btn-account-edit" onClick={() => {
                                                        setTempMournerAccount({
                                                            bank: mourner.bank || '',
                                                            holder: mourner.accountHolder || mourner.name || '',
                                                            number: mourner.accountNumber || ''
                                                        });
                                                        setEditingMournerIndex(index);
                                                        setShowMournerAccountModal(true);
                                                    }}>
                                                        {mourner.bank && mourner.accountNumber ? '변경하기' : '추가하기'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(errors.mourner_name || errors.mourner_contact) && (
                                            <p className="field-error">{errors.mourner_name || errors.mourner_contact}</p>
                                        )}
                                        <button type="button" className="btn-add-mourner" onClick={addMourner}>
                                            <span className="material-symbols-outlined">add_circle</span>
                                            상주 추가
                                        </button>
                                    </div>

                                    {/* 일정 정보 */}
                                    <div className="form-section">
                                        <h2 className="section-title">발인/임종 일시</h2>
                                        <p className="section-desc">장례 일정을 입력해주세요</p>

                                        <div className="form-group" data-field="funeral_date">
                                            <label className="form-label required">발인일시</label>
                                            <div className="datetime-row" style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ flex: 6 }}>
                                                    <DatePickerInput
                                                        locale="ko"
                                                        placeholder="날짜 선택"
                                                        value={formData.funeral_date || null}
                                                        onChange={(value) => setFormData(prev => ({
                                                            ...prev,
                                                            funeral_date: value || ''
                                                        }))}
                                                        valueFormat="YYYY년 MM월 DD일"
                                                        rightSection={<span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#9ca3af' }}>calendar_today</span>}
                                                        styles={{
                                                            input: {
                                                                height: '48px',
                                                                borderRadius: '8px',
                                                                border: errors.funeral_date ? '1px solid #ef4444' : '1px solid var(--gray-200)',
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ flex: 4 }} data-field="funeral_time">
                                                    <input
                                                        type="text"
                                                        name="funeral_time"
                                                        className={`form-input time-input ${errors.funeral_time ? 'error' : ''}`}
                                                        placeholder="00:00"
                                                        maxLength={5}
                                                        inputMode="numeric"
                                                        value={formData.funeral_time || ''}
                                                        onChange={(e) => {
                                                            let val = e.target.value.replace(/[^0-9]/g, '');
                                                            if (val.length >= 3) {
                                                                val = val.slice(0, 2) + ':' + val.slice(2, 4);
                                                            }
                                                            setFormData(prev => ({ ...prev, funeral_time: val }));
                                                            if (errors.funeral_time) setErrors(prev => ({ ...prev, funeral_time: '' }));
                                                        }}
                                                        style={{ width: '100%', height: '48px', textAlign: 'center', fontSize: '16px' }}
                                                    />
                                                </div>
                                            </div>
                                            {errors.funeral_time && <p className="field-error" style={{ marginTop: '4px' }}>{errors.funeral_time}</p>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">임종일시</label>
                                            <div className="datetime-row" style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ flex: 6 }}>
                                                    <DatePickerInput
                                                        locale="ko"
                                                        placeholder="날짜 선택"
                                                        value={formData.death_date || null}
                                                        onChange={(value) => setFormData(prev => ({
                                                            ...prev,
                                                            death_date: value || ''
                                                        }))}
                                                        valueFormat="YYYY년 MM월 DD일"
                                                        rightSection={<span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#9ca3af' }}>calendar_today</span>}
                                                        styles={{
                                                            input: {
                                                                height: '48px',
                                                                borderRadius: '8px',
                                                                border: '1px solid var(--gray-200)',
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ flex: 4 }} data-field="death_time">
                                                    <input
                                                        type="text"
                                                        name="death_time"
                                                        className={`form-input time-input ${errors.death_time ? 'error' : ''}`}
                                                        placeholder="00:00"
                                                        maxLength={5}
                                                        inputMode="numeric"
                                                        value={formData.death_time || ''}
                                                        onChange={(e) => {
                                                            let val = e.target.value.replace(/[^0-9]/g, '');
                                                            if (val.length >= 3) {
                                                                val = val.slice(0, 2) + ':' + val.slice(2, 4);
                                                            }
                                                            setFormData(prev => ({ ...prev, death_time: val }));
                                                            if (errors.death_time) setErrors(prev => ({ ...prev, death_time: '' }));
                                                        }}
                                                        style={{ width: '100%', height: '48px', textAlign: 'center', fontSize: '16px' }}
                                                    />
                                                </div>
                                            </div>
                                            {errors.death_time && <p className="field-error" style={{ marginTop: '4px' }}>{errors.death_time}</p>}
                                        </div>
                                    </div>

                                    {/* 조문객에게 안내사항 */}
                                    <div className="form-section">
                                        <h2 className="section-title">조문객에게 안내사항</h2>
                                        <p className="section-desc">조문객에게 전달할 메시지를 작성해주세요</p>

                                        <div className="form-group">
                                            <label className="form-label">안내사항</label>
                                            <textarea
                                                name="message"
                                                className="form-textarea"
                                                placeholder="뜻밖의 비보에 두루 알려드리지 못하오니 넓은 마음으로 이해해 주시기 바랍니다."
                                                rows={4}
                                                value={formData.message}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    {/* 장지 정보 */}
                                    <div className="form-section">
                                        <div className="toggle-row">
                                            <div className="toggle-row-label">
                                                <span className="material-symbols-outlined">park</span>
                                                <span>장지 정보</span>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={showBurial}
                                                    onChange={(e) => setShowBurial(e.target.checked)}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>

                                        {showBurial && (
                                            <div className="toggle-content">
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '13px', color: '#666' }}>1차 장지</span>
                                                    {!formData.burial_place2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, burial_place2: ' ' }))}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'var(--primary)',
                                                                fontSize: '13px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                                                            장지 추가
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    name="burial_place"
                                                    className="form-input"
                                                    placeholder="1차 장지 (예: OO공원묘지)"
                                                    value={formData.burial_place}
                                                    onChange={handleChange}
                                                />

                                                {formData.burial_place2 && (
                                                    <>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '13px', color: '#666' }}>2차 장지</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, burial_place2: '' }))}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    color: '#999',
                                                                    fontSize: '13px',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                삭제
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            name="burial_place2"
                                                            className="form-input"
                                                            placeholder="2차 장지"
                                                            value={formData.burial_place2.trim()}
                                                            onChange={handleChange}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* 개인정보 동의 안내 + 제출 버튼 */}
                                    <div className="form-submit-area">
                                        <button
                                            type="button"
                                            className="privacy-text-btn"
                                            onClick={() => setPrivacyOpen(true)}
                                        >
                                            개인정보 수집/제공에 동의합니다.
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                        <div className="submit-buttons">
                                            <button
                                                type="button"
                                                className="btn-draft"
                                                onClick={handleDraftClick}
                                            >
                                                임시저장
                                            </button>
                                            <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                                {isSubmitting ? '생성 중...' : '부고장 만들기'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 개인정보 동의 모달 */}
                                    {privacyOpen && (
                                        <div className="privacy-modal-overlay" onClick={() => setPrivacyOpen(false)}>
                                            <div className="privacy-modal" onClick={(e) => e.stopPropagation()}>
                                                <div className="privacy-modal-header">
                                                    <h3>개인정보 수집/제공 동의</h3>
                                                    <button type="button" className="modal-close" onClick={() => setPrivacyOpen(false)}>
                                                        <span className="material-symbols-outlined">close</span>
                                                    </button>
                                                </div>
                                                <div className="privacy-modal-content">
                                                    <ul>
                                                        <li>
                                                            신청 및 수정 과정 중 본인식별 및 부정이용방지를 위해 개인정보를 수집 이용합니다.
                                                            <Link href="/privacy" target="_blank" className="privacy-link">전문보기</Link>
                                                        </li>
                                                        <li>
                                                            부고 수신자에게 계좌정보를 제공합니다.
                                                            <a href="https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lsJoLnkSeq=1020398517&chrClsCd=010202&ancYnChk=" target="_blank" className="law-reference">(개인정보 보호법 제17조 의거)</a>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <button type="button" className="privacy-modal-confirm" onClick={() => setPrivacyOpen(false)}>
                                                    확인
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
                    </div >
                </main >

                {/* 로딩 오버레이 */}
                {
                    isSubmitting && (
                        <div className="loading-overlay">
                            <div className="loading-content">
                                <span className="material-symbols-outlined spinning">progress_activity</span>
                                <p>부고장을 생성하고 있습니다...</p>
                            </div>
                        </div>
                    )
                }

                {/* 장례식장 검색 모달 */}
                <FacilitySearchModal
                    isOpen={facilityModalOpen}
                    onClose={() => setFacilityModalOpen(false)}
                    onSelect={(facility, source) => {
                        setFormData(prev => ({
                            ...prev,
                            funeral_home: facility.name,
                            address: facility.address
                        }));
                        // 에러 클리어
                        setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.funeral_home;
                            delete newErrors.address;
                            return newErrors;
                        });
                        setFacilityModalOpen(false);
                        // source에 따라 포커스 다르게
                        if (source === 'address') {
                            setTimeout(() => funeralHomeRef.current?.focus(), 100);
                        } else {
                            setTimeout(() => roomNumberRef.current?.focus(), 100);
                        }
                    }}
                />

                {/* 임시저장 확인 모달 */}
                {draftModalOpen && (
                    <div className="modal-overlay" onClick={() => setDraftModalOpen(false)}>
                        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                            <h3>임시저장</h3>
                            <p>작성 중인 내용을 임시저장하시겠습니까?</p>
                            <div className="modal-buttons">
                                <button className="modal-btn secondary" onClick={() => setDraftModalOpen(false)}>아니오</button>
                                <button className="modal-btn primary" onClick={saveDraftAndGoHome}>예</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 대표상주 계좌 등록 모달 */}
                {showAccount && (
                    <div className="modal-overlay" onClick={() => setShowAccount(false)}>
                        <div className="account-modal" onClick={(e) => e.stopPropagation()}>
                            <h3 className="account-modal-title">계좌를 등록해주세요.</h3>

                            <div className="account-modal-row">
                                <select
                                    className="account-modal-select"
                                    value={tempAccount.bank}
                                    onChange={(e) => setTempAccount({ ...tempAccount, bank: e.target.value })}
                                >
                                    <option value="">은행명</option>
                                    {bankOptions.map(bank => (
                                        <option key={bank} value={bank}>{bank}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    className="account-modal-input"
                                    placeholder="예금주"
                                    value={tempAccount.holder || formData.primary_mourner || ''}
                                    onChange={(e) => setTempAccount({ ...tempAccount, holder: e.target.value })}
                                />
                            </div>

                            <input
                                type="text"
                                className="account-modal-input-full"
                                placeholder="계좌번호를 입력해주세요"
                                inputMode="numeric"
                                value={tempAccount.number}
                                onChange={(e) => setTempAccount({ ...tempAccount, number: e.target.value })}
                            />

                            <div className="account-modal-buttons">
                                <button
                                    type="button"
                                    className="account-modal-submit"
                                    onClick={() => {
                                        if (!tempAccount.bank) {
                                            alert('은행명을 선택해주세요.');
                                            return;
                                        }
                                        if (!tempAccount.number) {
                                            alert('계좌번호를 입력해주세요.');
                                            return;
                                        }
                                        const updated = [...accounts];
                                        updated[0] = { ...tempAccount, holder: tempAccount.holder || formData.primary_mourner || '' };
                                        setAccounts(updated);
                                        setIsAccountSaved(true);
                                        setShowAccount(false);
                                    }}
                                >
                                    {isAccountSaved ? '변경하기' : '등록하기'}
                                </button>
                                {isAccountSaved && (
                                    <button
                                        type="button"
                                        className="account-modal-delete"
                                        onClick={() => {
                                            updateAccount(0, 'bank', '');
                                            updateAccount(0, 'holder', '');
                                            updateAccount(0, 'number', '');
                                            setTempAccount({ holder: '', bank: '', number: '' });
                                            setIsAccountSaved(false);
                                            setShowAccount(false);
                                        }}
                                    >
                                        지우기
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 상주별 계좌 등록 모달 */}
                {showMournerAccountModal && editingMournerIndex !== null && (
                    <div className="modal-overlay" onClick={() => setShowMournerAccountModal(false)}>
                        <div className="account-modal" onClick={(e) => e.stopPropagation()}>
                            <h3 className="account-modal-title">계좌를 등록해주세요.</h3>

                            <div className="account-modal-row">
                                <select
                                    className="account-modal-select"
                                    value={tempMournerAccount.bank}
                                    onChange={(e) => setTempMournerAccount({ ...tempMournerAccount, bank: e.target.value })}
                                >
                                    <option value="">은행명</option>
                                    {bankOptions.map(bank => (
                                        <option key={bank} value={bank}>{bank}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    className="account-modal-input"
                                    placeholder="예금주"
                                    value={tempMournerAccount.holder}
                                    onChange={(e) => setTempMournerAccount({ ...tempMournerAccount, holder: e.target.value })}
                                />
                            </div>

                            <input
                                type="text"
                                className="account-modal-input-full"
                                placeholder="계좌번호를 입력해주세요"
                                inputMode="numeric"
                                value={tempMournerAccount.number}
                                onChange={(e) => setTempMournerAccount({ ...tempMournerAccount, number: e.target.value })}
                            />

                            <div className="account-modal-buttons">
                                <button
                                    type="button"
                                    className="account-modal-submit"
                                    onClick={() => {
                                        if (tempMournerAccount.bank && tempMournerAccount.number) {
                                            const updated = [...mourners];
                                            updated[editingMournerIndex] = {
                                                ...updated[editingMournerIndex],
                                                bank: tempMournerAccount.bank,
                                                accountHolder: tempMournerAccount.holder,
                                                accountNumber: tempMournerAccount.number
                                            };
                                            setMourners(updated);
                                        }
                                        setShowMournerAccountModal(false);
                                    }}
                                >
                                    {mourners[editingMournerIndex]?.bank ? '변경하기' : '등록하기'}
                                </button>
                                {mourners[editingMournerIndex]?.bank && mourners[editingMournerIndex]?.accountNumber && (
                                    <button
                                        type="button"
                                        className="account-modal-delete"
                                        onClick={() => {
                                            const updated = [...mourners];
                                            updated[editingMournerIndex] = {
                                                ...updated[editingMournerIndex],
                                                bank: undefined,
                                                accountHolder: undefined,
                                                accountNumber: undefined
                                            };
                                            setMourners(updated);
                                            setShowMournerAccountModal(false);
                                        }}
                                    >
                                        지우기
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </>
    );
}
