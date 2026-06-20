'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { IconArrowLeft } from '@tabler/icons-react';
import FuneralHomeSection from './sections/FuneralHomeSection';
import DeceasedSection from './sections/DeceasedSection';
import DateTimeSection from './sections/DateTimeSection';
import MournerSection from './sections/MournerSection';
import PhotoSection from './sections/PhotoSection';
import OptionsSection from './sections/OptionsSection';
import styles from './create.module.css';

// === 타입 ===
export interface Mourner {
  relationship: string;
  name: string;
  contact: string;
  bank?: string;
  accountHolder?: string;
  accountNumber?: string;
}

export interface BugoFormData {
  // 장례식장
  funeral_type: string;
  funeral_home: string;
  room_number: string;
  funeral_home_tel: string;
  address: string;
  address_detail: string;
  // 고인
  deceased_name: string;
  age: string;
  gender: string;
  hide_gender: boolean;
  religion: string;
  religion_custom: string;
  religious_title: string;
  show_religious_title: boolean;
  // 영정
  photo_url: string;
  show_photo: boolean;
  // 일시
  death_date: string;
  death_time: string;
  checkin_date: string;
  checkin_time: string;
  encoffin_date: string;
  encoffin_time: string;
  funeral_date: string;
  funeral_time: string;
  ilpo_date: string;
  ilpo_time: string;
  // 장지
  burial_place: string;
  burial_place2: string;
  // 옵션
  message: string;
  show_message: boolean;
  death_term: string;
  partner_logo_url: string;
  no_wreath: boolean;
  auto_reply: boolean;
}

const initialFormData: BugoFormData = {
  funeral_type: '일반 장례',
  funeral_home: '',
  room_number: '',
  funeral_home_tel: '',
  address: '',
  address_detail: '',
  deceased_name: '',
  age: '',
  gender: '',
  hide_gender: false,
  religion: '없음',
  religion_custom: '',
  religious_title: '',
  show_religious_title: false,
  photo_url: '',
  show_photo: false,
  death_date: '',
  death_time: '',
  checkin_date: '',
  checkin_time: '',
  encoffin_date: '',
  encoffin_time: '',
  funeral_date: '',
  funeral_time: '',
  ilpo_date: '',
  ilpo_time: '',
  burial_place: '',
  burial_place2: '',
  message: '',
  show_message: false,
  death_term: '별세',
  partner_logo_url: '',
  no_wreath: false,
  auto_reply: true,
};

// 부고번호 생성 (4자리 유니크)
async function generateBugoNumber(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const num = Math.floor(1000 + Math.random() * 9000).toString();
    const { data } = await supabase
      .from('bugo')
      .select('bugo_number')
      .eq('bugo_number', num)
      .single();
    if (!data) return num;
  }
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// 상주 토큰 생성
function generateOwnerToken(): string {
  return 'xxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

export default function B2BCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<BugoFormData>(initialFormData);
  const [mourners, setMourners] = useState<Mourner[]>([
    { relationship: '', name: '', contact: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFacilitySearch, setShowFacilitySearch] = useState(false);
  const [showAiCapture, setShowAiCapture] = useState(false);

  // 로그인 확인
  useEffect(() => {
    const token = localStorage.getItem('b2b_token');
    if (!token) {
      router.push('/b2b/login');
    }
  }, [router]);

  // 폼 필드 업데이트
  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 클리어
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // 일시 필드 지우기
  const handleClearFields = useCallback((fields: string[]) => {
    setFormData(prev => {
      const next = { ...prev };
      fields.forEach(f => {
        (next as Record<string, string | boolean>)[f] = '';
      });
      return next;
    });
  }, []);

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.deceased_name.trim()) newErrors.deceased_name = '고인명을 입력해주세요';
    if (!formData.age.trim()) newErrors.age = '연세를 입력해주세요';
    if (!formData.gender) newErrors.gender = '성별을 선택해주세요';

    if (formData.funeral_type !== '무빈소장례') {
      if (!formData.funeral_home.trim()) newErrors.funeral_home = '장례식장명을 입력해주세요';
      if (!formData.room_number.trim()) newErrors.room_number = '호실을 입력해주세요';
    }

    if (!formData.funeral_date) newErrors.funeral_date = '발인 날짜를 선택해주세요';
    if (!formData.funeral_time) newErrors.funeral_time = '발인 시간을 입력해주세요';

    // 대표상주 확인
    if (!mourners[0]?.name?.trim()) newErrors.mourner_name = '대표상주 성함을 입력해주세요';
    if (!mourners[0]?.relationship) newErrors.mourner_relationship = '대표상주 관계를 선택해주세요';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장하기 (임시저장)
  const handleSave = async () => {
    const user = JSON.parse(localStorage.getItem('b2b_user') || '{}');
    try {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: { ...formData, mourners },
          templateId: 'basic',
          b2bUserId: user.id,
        }),
      });
      alert('임시저장 되었습니다.');
    } catch {
      alert('저장에 실패했습니다.');
    }
  };

  // 제출
  const handleSubmit = async () => {
    if (!validate()) {
      // 첫 번째 에러로 스크롤
      const firstError = document.querySelector('[data-error]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('b2b_user') || '{}');
      const bugoNumber = await generateBugoNumber();
      const ownerToken = generateOwnerToken();

      const bugoData = {
        bugo_number: bugoNumber,
        template_id: 'basic',
        applicant_name: mourners[0]?.name || '',
        applicant_phone: mourners[0]?.contact || '',
        phone_password: mourners[0]?.contact || '',
        deceased_name: formData.deceased_name,
        gender: formData.hide_gender ? '' : formData.gender,
        hide_gender: formData.hide_gender,
        relationship: mourners[0]?.relationship || '',
        mourner_name: mourners[0]?.name || '',
        contact: mourners[0]?.contact || '',
        age: formData.age ? parseInt(formData.age) : null,
        religion: formData.religion === '없음' ? null : formData.religion,
        religious_title: formData.religious_title || null,
        show_religious_title: formData.show_religious_title,
        funeral_type: formData.funeral_type,
        funeral_home: formData.funeral_home || null,
        room_number: formData.room_number || null,
        funeral_home_tel: formData.funeral_home_tel || null,
        address: formData.address || null,
        address_detail: formData.address_detail || null,
        death_date: formData.death_date || null,
        death_time: formData.death_time || null,
        checkin_date: formData.checkin_date || null,
        checkin_time: formData.checkin_time || null,
        encoffin_date: formData.encoffin_date || null,
        encoffin_time: formData.encoffin_time || null,
        funeral_date: formData.funeral_date,
        funeral_time: formData.funeral_time || null,
        ilpo_date: formData.ilpo_date || null,
        ilpo_time: formData.ilpo_time || null,
        burial_place: formData.burial_place || null,
        burial_place2: formData.burial_place2 || null,
        message: formData.show_message ? formData.message : null,
        death_term: formData.death_term || '별세',
        partner_logo_url: formData.partner_logo_url || null,
        no_wreath: formData.no_wreath,
        auto_reply: formData.auto_reply,
        mourners: JSON.stringify(mourners.filter(m => m.name)),
        account_info: mourners[0]?.bank
          ? JSON.stringify([{
              holder: mourners[0].accountHolder,
              bank: mourners[0].bank,
              number: mourners[0].accountNumber,
            }])
          : null,
        photo_url: formData.show_photo ? formData.photo_url : null,
        status: 'active',
        owner_token: ownerToken,
        b2b_user_id: user.id || null,
      };

      const { error } = await supabase.from('bugo').insert([bugoData]);

      if (error) throw error;

      // 슬랙 + 알림톡 발송
      await fetch('/api/bugo-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bugo_number: bugoNumber,
          deceased_name: formData.deceased_name,
          funeral_home: formData.funeral_home,
          room_number: formData.room_number,
          address: formData.address,
          funeral_date: formData.funeral_date,
          funeral_time: formData.funeral_time,
          mourner_name: mourners[0]?.name,
          funeral_type: formData.funeral_type,
          created_new: true,
          phone_changed: false,
        }),
      });

      // 자주찾는 식장 저장
      if (formData.funeral_home && user.id) {
        const saved = JSON.parse(localStorage.getItem('b2b_fav_facilities') || '[]');
        const exists = saved.find((f: { name: string }) => f.name === formData.funeral_home);
        if (!exists && saved.length < 10) {
          saved.push({
            name: formData.funeral_home,
            address: formData.address,
            phone: formData.funeral_home_tel,
          });
          localStorage.setItem('b2b_fav_facilities', JSON.stringify(saved));
        }
      }

      router.push(`/create/complete/${bugoNumber}`);
    } catch (err) {
      console.error('부고 생성 실패:', err);
      alert('부고 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <IconArrowLeft size={22} stroke={1.8} />
        </button>
        <h1 className={styles.headerTitle}>부고장 제작</h1>
        <button className={styles.saveBtn} onClick={handleSave}>
          저장하기
        </button>
      </header>

      <div className={styles.content}>
        {/* 장례식장 정보 */}
        <FuneralHomeSection
          formData={formData}
          onChange={handleChange}
          onOpenFacilitySearch={() => setShowFacilitySearch(true)}
        />

        {/* 고인 정보 */}
        <DeceasedSection
          formData={formData}
          onChange={handleChange}
          onOpenAiCapture={() => setShowAiCapture(true)}
        />

        {/* 영정사진 */}
        <PhotoSection
          showPhoto={formData.show_photo}
          photoUrl={formData.photo_url}
          onToggle={(show) => handleChange('show_photo', show)}
          onPhotoChange={(url) => handleChange('photo_url', url)}
        />

        {/* 일시 정보 */}
        <DateTimeSection
          formData={formData}
          onChange={handleChange}
          onClear={handleClearFields}
        />

        {/* 상주 정보 */}
        <MournerSection
          mourners={mourners}
          onMournersChange={setMourners}
        />

        {/* 옵션 */}
        <OptionsSection
          formData={formData}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
