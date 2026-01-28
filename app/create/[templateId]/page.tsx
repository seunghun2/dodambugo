'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SideMenu from '@/components/SideMenu';
import FacilitySearchModal from '@/components/FacilitySearchModal';
import { gaEvents } from '@/components/GoogleAnalytics';
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
    'IBK기업은행', 'SC제일은행', '카카오뱅크', '케이뱅크', '토스뱅크',
    '새마을금고', '신협', '우체국', '수협', '광주은행', '전북은행',
    '경남은행', '부산은행', '대구은행', '제주은행', '씨티은행',
    'KDB산업은행', '저축은행', '산림조합'
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
        } else {
            // GA: 템플릿 선택 이벤트
            gaEvents.selectTemplate(templateId);
        }
    }, [templateId, router]);

    // Side menu
    const [sideMenuOpen, setSideMenuOpen] = useState(false);

    // Form 데이터
    const [formData, setFormData] = useState({
        applicant_name: '',
        applicant_phone: '',
        deceased_name: '',
        gender: '',
        relationship: '',
        age: '',
        religion: '없음',
        religion_custom: '',
        funeral_type: '일반 장례',
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
        ilpo_date: '',
        ilpo_time: '',
        burial_place: '',
        burial_place2: '',
        message: '뜻밖의 비보에 두루 알려드리지 못하오니 넓은 마음으로 이해해 주시기 바랍니다.',
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

    // 일포일시 (제주)
    const [showIlpo, setShowIlpo] = useState(false);
    const [hideFuneral, setHideFuneral] = useState(false); // 발인일시 노출안함

    // 영정 사진
    const [showPhoto, setShowPhoto] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');

    // 클라이언트 마운트 상태 (hydration 에러 방지)
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

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



    // 초기 데이터 로드 (복제 > draft 순서)
    useEffect(() => {
        // 수정 모드에서는 draft/복제 데이터 로드하지 않음
        if (typeof window !== 'undefined' && window.location.search.includes('edit=')) return;

        // 1. 복제 데이터 먼저 확인
        const duplicateData = sessionStorage.getItem('duplicateBugo');
        if (duplicateData) {
            try {
                const parsed = JSON.parse(duplicateData);

                // 상주 정보 파싱
                let mournersData = parsed.mourners;
                if (typeof mournersData === 'string') {
                    try { mournersData = JSON.parse(mournersData); } catch { mournersData = null; }
                }

                // 대표상주 정보
                let primaryMourner = parsed.mourner_name || parsed.primary_mourner || '';
                let relationship = parsed.relationship || '';
                if (mournersData && Array.isArray(mournersData) && mournersData.length > 0) {
                    primaryMourner = primaryMourner || mournersData[0].name || '';
                    relationship = relationship || mournersData[0].relationship || '';
                }

                setFormData(prev => ({
                    ...prev,
                    deceased_name: parsed.deceased_name || '',
                    age: parsed.age?.toString() || '',
                    gender: parsed.gender || '',
                    religion: parsed.religion || '없음',
                    funeral_type: parsed.funeral_type || '일반 장례',
                    funeral_home: parsed.funeral_home || '',
                    funeral_home_tel: parsed.funeral_home_tel || '',
                    room_number: parsed.room_number || '',
                    funeral_date: parsed.funeral_date || '',
                    funeral_time: parsed.funeral_time || '',
                    funeral_hour: parsed.funeral_time?.split(':')[0] || '',
                    funeral_minute: parsed.funeral_time?.split(':')[1] || '00',
                    death_date: parsed.death_date || '',
                    death_time: parsed.death_time || '',
                    death_hour: parsed.death_time?.split(':')[0] || '',
                    death_minute: parsed.death_time?.split(':')[1] || '00',
                    encoffin_date: parsed.encoffin_date || '',
                    encoffin_time: parsed.encoffin_time || '',
                    encoffin_hour: parsed.encoffin_time?.split(':')[0] || '',
                    encoffin_minute: parsed.encoffin_time?.split(':')[1] || '00',
                    address: parsed.address || '',
                    address_detail: parsed.address_detail || '',
                    burial_place: parsed.burial_place || '',
                    burial_place2: parsed.burial_place2 || '',
                    message: parsed.message || '뜻밖의 비보에 두루 알려드리지 못하오니 넓은 마음으로 이해해 주시기 바랍니다.',
                    relationship: relationship,
                    primary_mourner: primaryMourner,
                    applicant_name: parsed.applicant_name || '',
                    applicant_phone: parsed.applicant_phone || '',
                }));

                // 추가 상주 복사
                if (mournersData && Array.isArray(mournersData) && mournersData.length > 1) {
                    setMourners(mournersData.slice(1));
                }

                // 계좌 정보 복사
                let accountData = parsed.account_info;
                if (typeof accountData === 'string') {
                    try { accountData = JSON.parse(accountData); } catch { accountData = null; }
                }
                if (accountData && Array.isArray(accountData) && accountData.length > 0) {
                    setAccounts(accountData);
                    setIsAccountSaved(true);
                }

                // 사진 복사
                if (parsed.photo_url) {
                    setPhotoUrl(parsed.photo_url);
                    setShowPhoto(true);
                }

                // 장지 복사
                if (parsed.burial_place) {
                    setShowBurial(true);
                }

                // 복제 데이터 삭제
                sessionStorage.removeItem('duplicateBugo');

                // 복제 완료 - draft는 로드하지 않음
                return;
            } catch (e) {
                console.log('Duplicate data parse error');
            }
        }

        // 2. 복제 데이터 없으면 draft 확인
        const draft = localStorage.getItem(`bugo_draft_${templateId}`);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                const savedAt = new Date(parsed.savedAt);
                const now = new Date();
                const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    if (parsed.formData) {
                        setFormData(prev => ({
                            ...prev,
                            ...parsed.formData,
                            funeral_type: parsed.formData.funeral_type || '일반 장례'
                        }));
                    }
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

    // 30초마다 자동 임시저장
    useEffect(() => {
        // 수정 모드에서는 자동저장 안 함
        if (editBugoNumber) return;

        const autoSave = () => {
            // 최소 하나 이상 입력된 경우에만 저장
            if (formData.deceased_name || formData.funeral_home || mourners[0]?.name) {
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
                console.log('자동 저장 완료:', new Date().toLocaleTimeString());
            }
        };

        const timer = setInterval(autoSave, 30000); // 30초

        return () => clearInterval(timer);
    }, [formData, mourners, accounts, showAccount, showBurial, showPhoto, photoUrl, templateId, editBugoNumber]);

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
                    applicant_phone: data.applicant_phone || data.phone_password || '',
                    deceased_name: data.deceased_name || '',
                    gender: data.gender || '',
                    relationship: data.relationship || '',
                    age: data.age?.toString() || '',
                    religion: data.religion || '없음',
                    religion_custom: data.religion_custom || '',
                    funeral_type: data.funeral_type || '일반 장례',
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
                    ilpo_date: data.ilpo_date || '',
                    ilpo_time: data.ilpo_time || '',
                    burial_place: data.burial_place || '',
                    burial_place2: data.burial_place2 || '',
                    message: data.message || '',
                    // DB에서 mourner_name 또는 primary_mourner로 저장됨
                    primary_mourner: data.mourner_name || data.primary_mourner || '',
                });

                // 상주 목록 파싱 (문자열인 경우)
                let mournersData = data.mourners;
                if (typeof mournersData === 'string') {
                    try {
                        mournersData = JSON.parse(mournersData);
                    } catch (e) {
                        mournersData = null;
                    }
                }

                // 상주 목록 (첫번째 상주가 대표상주)
                if (mournersData && Array.isArray(mournersData) && mournersData.length > 0) {
                    const firstMourner = mournersData[0];
                    // 대표상주가 아직 설정 안됐으면 첫번째 상주에서 가져옴
                    if (firstMourner && !(data.mourner_name || data.primary_mourner)) {
                        setFormData(prev => ({
                            ...prev,
                            primary_mourner: firstMourner.name || '',
                            relationship: firstMourner.relationship || '',
                        }));
                    }
                    // 추가 상주들 (첫번째 제외)
                    if (mournersData.length > 1) {
                        setMourners(mournersData.slice(1));
                    } else {
                        setMourners([{ relationship: '', name: '', contact: '' }]);
                    }
                }

                // 대표상주 계좌 정보 (문자열로 저장된 경우 파싱)
                let accountData = data.account_info;
                if (typeof accountData === 'string') {
                    try {
                        accountData = JSON.parse(accountData);
                    } catch (e) {
                        console.log('account_info 파싱 실패');
                        accountData = null;
                    }
                }
                console.log('파싱된 account_info:', accountData);
                if (accountData && Array.isArray(accountData) && accountData.length > 0) {
                    console.log('accounts 설정함:', accountData);
                    setAccounts(accountData);
                    // setShowAccount는 모달 열기용이라 여기서 설정 안함
                    setIsAccountSaved(true);
                }

                // 기타 옵션
                if (data.burial_place) setShowBurial(true);
                if (data.ilpo_date) {
                    setShowIlpo(true);
                    setHideFuneral(data.hide_funeral || false);
                }
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
            ilpo_date: formatDate(tomorrow), // 일포 = 발인 전날
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

    // 은행별 계좌번호 자동 포맷팅
    const formatAccountNumber = (bank: string, number: string): string => {
        const digits = number.replace(/[^0-9]/g, '');

        const formats: Record<string, number[]> = {
            '국민은행': [6, 2, 6],
            'KB국민은행': [6, 2, 6],
            '신한은행': [3, 3, 6],
            '우리은행': [4, 3, 6],
            '하나은행': [3, 6, 5],
            '농협': [3, 4, 4, 2],
            'NH농협': [3, 4, 4, 2],
            'NH농협은행': [3, 4, 4, 2],
            '기업은행': [3, 6, 2, 3],
            'IBK기업은행': [3, 6, 2, 3],
            'SC제일은행': [3, 2, 6],
            '카카오뱅크': [4, 2, 7],
            '케이뱅크': [3, 3, 6],
            '토스뱅크': [4, 4, 4],
            '새마을금고': [4, 2, 6],
            '신협': [3, 3, 6],
            '우체국': [6, 2, 6],
            '수협': [3, 4, 4, 2],
            '광주은행': [3, 3, 6],
            '전북은행': [3, 3, 6],
            '경남은행': [3, 4, 6],
            '부산은행': [3, 4, 6],
            '대구은행': [3, 4, 6],
            '제주은행': [3, 3, 6],
            '씨티은행': [3, 6, 3],
            'KDB산업은행': [3, 6, 4],
        };

        const pattern = formats[bank];
        if (!pattern) return digits; // 패턴 없으면 그대로

        let result = '';
        let pos = 0;
        for (let i = 0; i < pattern.length && pos < digits.length; i++) {
            const chunk = digits.slice(pos, pos + pattern[i]);
            result += (i > 0 ? '-' : '') + chunk;
            pos += pattern[i];
        }
        return result;
    };

    // 폼 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        const newErrors: Record<string, string> = {};

        if (!formData.applicant_name) newErrors.applicant_name = '신청자 성함을 입력해주세요';
        if (!formData.applicant_phone || formData.applicant_phone.replace(/-/g, '').length !== 11) newErrors.applicant_phone = '휴대번호를 정확히 입력해주세요';
        if (!formData.deceased_name) newErrors.deceased_name = '고인 성함을 입력해주세요';
        if (!formData.age) newErrors.age = '연세를 입력해주세요';
        if (formData.age && Number(formData.age) > 999) newErrors.age = '연세는 3자리까지만 입력해주세요';
        if (!formData.gender) newErrors.gender = '성별을 선택해주세요';
        if (!formData.relationship || !formData.primary_mourner) newErrors.primary_mourner = '상주를 입력해주세요';

        // 추가상주: 관계 선택 시 이름 필수, 연락처는 선택이지만 형식 검증
        mourners.forEach((mourner, index) => {
            if (mourner.relationship && !mourner.name) {
                newErrors[`mourner_${index}_name`] = '상주 성함을 입력해주세요';
            }
            // 연락처가 있고 010으로 시작하지 않으면 에러
            const cleanContact = mourner.contact?.replace(/-/g, '').trim();
            if (cleanContact && cleanContact.length > 0 && !cleanContact.startsWith('010')) {
                newErrors[`mourner_${index}_contact`] = '연락처를 잘못 입력했습니다';
            }
        });
        if (!formData.funeral_home) newErrors.funeral_home = '장례식장명을 입력해주세요';
        if (!formData.room_number) newErrors.room_number = '호실을 입력해주세요';
        if (!formData.address) newErrors.address = '주소를 입력해주세요';

        // 일포 OFF일 때만 발인일시 필수
        if (!showIlpo) {
            if (!formData.funeral_date) newErrors.funeral_date = '발인 날짜를 선택해주세요';
            if (!formData.funeral_time || formData.funeral_time === '00:00') newErrors.funeral_time = '발인 시간을 입력해주세요';
        }

        // 임종일시는 항상 필수 (알림톡 연동)
        if (!formData.death_date) newErrors.death_date = '임종 날짜를 선택해주세요';
        // death_time(임종 시간)은 선택 - 모를 수도 있음

        // 일포 토글 ON일 때 시간 필수
        if (showIlpo && (!formData.ilpo_time || formData.ilpo_time === '00:00')) {
            newErrors.ilpo_time = '일포 시간을 입력해주세요';
        }

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
                applicant_phone: formData.applicant_phone,
                phone_password: formData.applicant_phone, // 비밀번호로도 사용
                deceased_name: formData.deceased_name,
                gender: formData.gender,
                relationship: formData.relationship || '',
                mourner_name: formData.primary_mourner || '',
                contact: mourners[0]?.contact || '',
                age: formData.age ? parseInt(formData.age) : null,
                religion: formData.religion === '기타' ? formData.religion_custom : (formData.religion || null),
                funeral_type: formData.funeral_type || '일반 장례',
                funeral_home: formData.funeral_home || null,
                room_number: formData.room_number || null,
                funeral_home_tel: formData.funeral_home_tel || null,
                address: formData.address || null,
                address_detail: formData.address_detail || null,
                death_date: formData.death_date || null,
                death_time: formData.death_time || (formData.death_hour ? `${formData.death_hour}:${formData.death_minute}` : null),
                encoffin_date: formData.encoffin_date || null,
                encoffin_time: formData.encoffin_hour ? `${formData.encoffin_hour}:${formData.encoffin_minute}` : null,
                funeral_date: formData.funeral_date || null,
                funeral_time: formData.funeral_time || (formData.funeral_hour ? `${formData.funeral_hour}:${formData.funeral_minute}` : null),
                ilpo_date: formData.ilpo_date || null,
                ilpo_time: formData.ilpo_time || null,
                hide_funeral: hideFuneral || false,
                burial_place: formData.burial_place || null,
                burial_place2: formData.burial_place2?.trim() || null,
                message: formData.message || null,
                // 대표상주 + 추가상주 전체 저장
                mourners: [
                    // 대표상주
                    ...(formData.primary_mourner ? [{
                        relationship: formData.relationship || '',
                        name: formData.primary_mourner,
                        contact: '',
                    }] : []),
                    // 추가상주들 (계좌정보 포함)
                    ...mourners.filter(m => m.name).map(m => ({
                        relationship: m.relationship || '',
                        name: m.name,
                        contact: m.contact || '',
                        bank: m.bank || '',
                        accountHolder: m.accountHolder || '',
                        accountNumber: m.accountNumber || '',
                    }))
                ],
                // 대표상주 계좌 - 계좌가 입력되어 있으면 저장
                account_info: accounts.filter(a => a.bank && a.number).length > 0
                    ? accounts.filter(a => a.bank && a.number)
                    : null,
                photo_url: showPhoto ? photoUrl : null,
                status: 'active',
            };

            // 디버깅: 계좌 정보 확인
            console.log('저장할 계좌 정보:', bugoData.account_info);
            console.log('accounts state:', accounts);

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

            // GA: 부고 생성 완료 이벤트
            if (!editBugoNumber) {
                gaEvents.completeBugo(data.bugo_number);

                // 🔔 슬랙 알림 전송 (신규 생성 시에만, 비동기)
                fetch('/api/bugo-notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bugo_number: data.bugo_number,
                        deceased_name: formData.deceased_name,
                        funeral_home: formData.funeral_home,
                        room_number: formData.room_number,
                        address: formData.address,
                        funeral_date: formData.funeral_date,
                        funeral_time: formData.funeral_time,
                        mourner_name: formData.primary_mourner,
                        created_new: true,
                    }),
                }).catch(err => console.error('부고 알림 실패:', err));
            } else {
                // 📱 수정 모드: 연락처 변경 시 알림톡 발송
                fetch('/api/bugo-notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bugo_number: data.bugo_number,
                        deceased_name: formData.deceased_name,
                        funeral_home: formData.funeral_home,
                        room_number: formData.room_number,
                        address: formData.address,
                        funeral_date: formData.funeral_date,
                        funeral_time: formData.funeral_time,
                        mourner_name: formData.primary_mourner,
                        created_new: false,
                        phone_changed: true,  // 수정 시 연락처 변경 알림
                    }),
                }).catch(err => console.error('부고 수정 알림 실패:', err));
            }

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
                {/* Navigation - MainLayout에서 공통 처리 */}

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
                                                autoFocus
                                            />
                                            {errors.applicant_name && <p className="field-error">{errors.applicant_name}</p>}
                                        </div>
                                        <div className="form-group" data-field="applicant_phone">
                                            <label className="form-label required">휴대번호</label>
                                            <input
                                                type="tel"
                                                name="applicant_phone"
                                                className={`form-input ${errors.applicant_phone ? 'error' : ''}`}
                                                placeholder="010-1234-5678"
                                                maxLength={13}
                                                inputMode="numeric"
                                                value={formData.applicant_phone}
                                                onChange={(e) => {
                                                    const formatted = formatPhone(e.target.value);
                                                    setFormData(prev => ({ ...prev, applicant_phone: formatted }));
                                                    if (errors.applicant_phone) {
                                                        setErrors(prev => ({ ...prev, applicant_phone: '' }));
                                                    }
                                                }}
                                            />
                                            {errors.applicant_phone && <p className="field-error">{errors.applicant_phone}</p>}
                                            {!errors.applicant_phone && <p className="form-hint">부고장 수정 시 비밀번호로 사용됩니다</p>}
                                        </div>
                                    </div>

                                    {/* 장례식장 정보 */}
                                    <div className="form-section">
                                        <h2 className="section-title">장례식장 정보</h2>
                                        <p className="section-desc">조문객이 방문할 장례식장 정보입니다</p>

                                        {/* 장례 형식 */}
                                        <div className="form-group">
                                            <label className="form-label required">장례 형식</label>
                                            <select
                                                name="funeral_type"
                                                className="form-select"
                                                value={formData.funeral_type}
                                                onChange={handleChange}
                                            >
                                                <option value="일반 장례">일반 장례</option>
                                                <option value="가족장">가족장</option>
                                                <option value="무빈소장례">무빈소장례</option>
                                            </select>
                                        </div>

                                        {/* 일반 장례일 때만 표시 */}
                                        {(formData.funeral_type === '일반 장례' || formData.funeral_type === '') && (
                                            <>
                                                {/* 장례식장 검색 */}
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
                                                            <span className="material-symbols-outlined" style={{ color: '#9CA3AF' }}>search</span>
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
                                            </>
                                        )}
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
                                                    <option value="없음">없음</option>
                                                    {religionOptions.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* 구분선 */}
                                        <hr className="form-divider" />

                                        {/* 상주 라벨 */}
                                        <label className="form-label required" style={{ marginBottom: '8px' }}>상주</label>

                                        {/* 고인과의 관계 + 대표상주 */}
                                        <div className="mourner-row primary-mourner" data-field="primary_mourner">
                                            <select
                                                name="relationship"
                                                className={`form-select mourner-relation ${errors.primary_mourner ? 'error' : ''}`}
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
                                                <div key={index} className="mourner-card" data-field={`mourner_${index}_contact`}>
                                                    <div className="mourner-row">
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
                                                            className={`form-input mourner-name ${errors[`mourner_${index}_name`] ? 'error' : ''}`}
                                                            placeholder="성함"
                                                            value={mourner.name || ''}
                                                            onChange={(e) => updateMourner(index, 'name', e.target.value)}
                                                        />
                                                        <input
                                                            type="tel"
                                                            className={`form-input mourner-contact ${errors[`mourner_${index}_contact`] ? 'error' : ''}`}
                                                            placeholder="연락처"
                                                            value={mourner.contact || ''}
                                                            onChange={(e) => updateMourner(index, 'contact', formatPhone(e.target.value))}
                                                        />
                                                        {mourners.length > 1 && (
                                                            <button type="button" className="btn-delete-mourner" onClick={() => removeMourner(index)}>
                                                                <span className="material-symbols-outlined">close</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                    {errors[`mourner_${index}_name`] && <p className="field-error">{errors[`mourner_${index}_name`]}</p>}
                                                    {errors[`mourner_${index}_contact`] && <p className="field-error">{errors[`mourner_${index}_contact`]}</p>}
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
                                            </div>
                                        ))}
                                        <button type="button" className="btn-add-mourner" onClick={addMourner}>
                                            <span className="material-symbols-outlined">add_circle</span>
                                            상주 추가
                                        </button>
                                    </div>

                                    {/* 제주 일포일시 - 주소에 제주가 포함될 때만 표시 */}
                                    {mounted && formData.address.includes('제주') && (
                                        <div className="form-section">
                                            <div className="toggle-row" style={{ alignItems: 'center' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div className="toggle-row-label">
                                                        <span>'일포'일을 사용하시겠습니까?</span>
                                                    </div>
                                                    <span style={{ fontSize: '13px', color: '#888', marginTop: 0, display: 'block' }}>발인 전날, 조문을 집중적으로 받는 날</span>
                                                </div>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={showIlpo}
                                                        onChange={(e) => {
                                                            setShowIlpo(e.target.checked);
                                                            if (!e.target.checked) {
                                                                setHideFuneral(false);
                                                                // 일포 OFF하면 일포 날짜/시간 초기화
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    ilpo_date: '',
                                                                    ilpo_time: ''
                                                                }));
                                                            }
                                                        }}
                                                    />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                            </div>

                                            {showIlpo && (
                                                <div className="toggle-content">
                                                    <label className="form-label required" style={{ marginBottom: '8px', display: 'block' }}>일포일시</label>
                                                    <div className="datetime-row" style={{ display: 'flex', gap: '8px' }}>
                                                        <div style={{ flex: 6 }}>
                                                            <DatePickerInput
                                                                locale="ko"
                                                                placeholder="날짜 선택"
                                                                value={formData.ilpo_date || null}
                                                                onChange={(value) => setFormData(prev => ({
                                                                    ...prev,
                                                                    ilpo_date: value || ''
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
                                                        <div style={{ flex: 4 }} data-field="ilpo_time">
                                                            <input
                                                                type="text"
                                                                name="ilpo_time"
                                                                className={`form-input time-input ${errors.ilpo_time ? 'error' : ''}`}
                                                                placeholder="00:00"
                                                                maxLength={5}
                                                                inputMode="numeric"
                                                                value={formData.ilpo_time || ''}
                                                                onChange={(e) => {
                                                                    let val = e.target.value.replace(/[^0-9]/g, '');
                                                                    if (val.length >= 3) {
                                                                        val = val.slice(0, 2) + ':' + val.slice(2, 4);
                                                                    }
                                                                    setFormData(prev => ({ ...prev, ilpo_time: val }));
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '48px',
                                                                    textAlign: 'center',
                                                                    fontSize: '16px',
                                                                    borderColor: errors.ilpo_time ? '#ef4444' : undefined
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    {errors.ilpo_time && <p className="field-error" style={{ marginTop: '4px' }}>{errors.ilpo_time}</p>}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 일정 정보 */}
                                    <div className="form-section">
                                        <h2 className="section-title">발인/임종 일시</h2>
                                        <p className="section-desc">장례 일정을 입력해주세요</p>

                                        <div className="form-group" data-field="funeral_date">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <label className={`form-label ${!showIlpo ? 'required' : ''}`} style={{ marginBottom: 0 }}>발인일시</label>
                                                {showIlpo && (
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--accent)', cursor: 'pointer', fontWeight: '500' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={hideFuneral}
                                                            onChange={(e) => setHideFuneral(e.target.checked)}
                                                            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                                                        />
                                                        노출안함
                                                    </label>
                                                )}
                                            </div>
                                            {!hideFuneral && (
                                                <div className="datetime-row" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
                                            )}
                                            {errors.funeral_time && !hideFuneral && <p className="field-error" style={{ marginTop: '4px' }}>{errors.funeral_time}</p>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required">임종(별세)일시</label>
                                            <div className="datetime-row" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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


                                    {/* 장지 정보 - 가족장 제외 (일반장례, 무빈소장례) */}
                                    {formData.funeral_type !== '가족장' && (
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
                                                                    color: 'var(--accent)',
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
                                    )}

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
                                                {isSubmitting ? (editBugoNumber ? '수정 중...' : '생성 중...') : (editBugoNumber ? '수정하기' : '부고장 만들기')}
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
                    <div className="modal-overlay" style={{ zIndex: 99999 }} onClick={() => setDraftModalOpen(false)}>
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
                    <div className="modal-overlay" style={{ zIndex: 99999 }} onClick={() => setShowAccount(false)}>
                        <div className="account-modal" onClick={(e) => e.stopPropagation()}>
                            <h3 className="account-modal-title">계좌를 등록해주세요.</h3>

                            <div className="account-modal-row">
                                <select
                                    className="account-modal-select"
                                    value={tempAccount.bank}
                                    onChange={(e) => {
                                        setTempAccount({ ...tempAccount, bank: e.target.value });
                                        // 포커스 이동
                                        setTimeout(() => {
                                            const holderVal = tempAccount.holder || formData.primary_mourner;
                                            if (holderVal) {
                                                document.getElementById('account-number-input')?.focus();
                                            } else {
                                                document.getElementById('account-holder-input')?.focus();
                                            }
                                        }, 50);
                                    }}
                                    autoFocus
                                >
                                    <option value="">은행명</option>
                                    {bankOptions.map(bank => (
                                        <option key={bank} value={bank}>{bank}</option>
                                    ))}
                                </select>
                                <input
                                    id="account-holder-input"
                                    type="text"
                                    className="account-modal-input"
                                    placeholder="예금주"
                                    value={tempAccount.holder || formData.primary_mourner || ''}
                                    onChange={(e) => setTempAccount({ ...tempAccount, holder: e.target.value })}
                                />
                            </div>

                            <input
                                id="account-number-input"
                                type="text"
                                className="account-modal-input-full"
                                placeholder="계좌번호를 입력해주세요"
                                inputMode="numeric"
                                value={tempAccount.number}
                                onChange={(e) => {
                                    const formatted = formatAccountNumber(tempAccount.bank, e.target.value);
                                    setTempAccount({ ...tempAccount, number: formatted });
                                }}
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
                    <div className="modal-overlay" style={{ zIndex: 99999 }} onClick={() => setShowMournerAccountModal(false)}>
                        <div className="account-modal" onClick={(e) => e.stopPropagation()}>
                            <h3 className="account-modal-title">계좌를 등록해주세요.</h3>

                            <div className="account-modal-row">
                                <select
                                    className="account-modal-select"
                                    value={tempMournerAccount.bank}
                                    onChange={(e) => {
                                        setTempMournerAccount({ ...tempMournerAccount, bank: e.target.value });
                                        // 포커스 이동
                                        setTimeout(() => {
                                            if (tempMournerAccount.holder) {
                                                document.getElementById('mourner-account-number-input')?.focus();
                                            } else {
                                                document.getElementById('mourner-account-holder-input')?.focus();
                                            }
                                        }, 50);
                                    }}
                                    autoFocus
                                >
                                    <option value="">은행명</option>
                                    {bankOptions.map(bank => (
                                        <option key={bank} value={bank}>{bank}</option>
                                    ))}
                                </select>
                                <input
                                    id="mourner-account-holder-input"
                                    type="text"
                                    className="account-modal-input"
                                    placeholder="예금주"
                                    value={tempMournerAccount.holder}
                                    onChange={(e) => setTempMournerAccount({ ...tempMournerAccount, holder: e.target.value })}
                                />
                            </div>

                            <input
                                id="mourner-account-number-input"
                                type="text"
                                className="account-modal-input-full"
                                placeholder="계좌번호를 입력해주세요"
                                inputMode="numeric"
                                value={tempMournerAccount.number}
                                onChange={(e) => {
                                    const formatted = formatAccountNumber(tempMournerAccount.bank, e.target.value);
                                    setTempMournerAccount({ ...tempMournerAccount, number: formatted });
                                }}
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
