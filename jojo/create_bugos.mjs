import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fkwuhnkpitadwxcbqgin.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrd3VobmtwaXRhZHd4Y2JxZ2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMjQxNzUsImV4cCI6MjA0OTkwMDE3NX0.QMvNwzIqUSfGjeXU7FWVG5ZkLg5i9ksRgjIRoHLwct0'
);

const bugos = [
  {
    bugo_number: '2001',
    template_id: 'basic',
    applicant_name: '김영수',
    phone_password: '1234',
    deceased_name: '김순자',
    gender: '여',
    relationship: '모친',
    mourner_name: '김영수',
    contact: '010-1234-5678',
    age: 87,
    religion: '불교',
    funeral_home: '서울성모병원 장례식장',
    room_number: '특2호실',
    funeral_home_tel: '02-2258-5840',
    address: '서울특별시 서초구 반포대로 222',
    death_date: '2025-12-29',
    death_time: '14:30',
    funeral_date: '2025-12-31',
    funeral_time: '09:00',
    burial_place: '경기도 용인 천주교공원묘지',
    message: '저희 어머니께서 갑작스럽게 별세하셨습니다. 생전에 베풀어주신 따뜻한 관심과 사랑에 깊이 감사드리며, 바쁘신 중에도 부디 오셔서 마지막 가시는 길을 함께 해주시면 감사하겠습니다.',
    mourners: [
      { relationship: '장남', name: '김영수', contact: '010-1234-5678' },
      { relationship: '차남', name: '김영호', contact: '010-2345-6789' },
      { relationship: '장녀', name: '김영희', contact: '010-3456-7890' },
      { relationship: '며느리', name: '이미영', contact: '010-4567-8901' },
      { relationship: '며느리', name: '박수진', contact: '010-5678-9012' },
      { relationship: '사위', name: '최민호', contact: '010-6789-0123' }
    ],
    account_info: [
      { holder: '김영수', bank: 'KB국민은행', number: '123-45-678901' },
      { holder: '김영호', bank: '신한은행', number: '234-56-789012' },
      { holder: '김영희', bank: '우리은행', number: '345-67-890123' }
    ],
    status: 'active'
  },
  {
    bugo_number: '2002',
    template_id: 'ribbon',
    applicant_name: '박철수',
    phone_password: '5678',
    deceased_name: '박기남',
    gender: '남',
    relationship: '부친',
    mourner_name: '박철수',
    contact: '010-9876-5432',
    age: 92,
    religion: '기독교',
    funeral_home: '삼성서울병원 장례식장',
    room_number: '7호실',
    funeral_home_tel: '02-3410-3500',
    address: '서울특별시 강남구 일원로 81',
    death_date: '2025-12-30',
    death_time: '06:15',
    funeral_date: '2026-01-01',
    funeral_time: '10:30',
    burial_place: '경기도 파주 통일동산',
    message: '아버지께서 오랜 투병 끝에 하늘나라로 떠나셨습니다. 평생을 성실하게 살아오신 아버지의 마지막 가시는 길, 함께 해주시면 깊은 위로가 되겠습니다. 조문해 주시는 모든 분들께 진심으로 감사드립니다.',
    mourners: [
      { relationship: '장남', name: '박철수', contact: '010-9876-5432' },
      { relationship: '차남', name: '박철민', contact: '010-8765-4321' },
      { relationship: '장녀', name: '박숙희', contact: '010-7654-3210' },
      { relationship: '차녀', name: '박미희', contact: '010-6543-2109' },
      { relationship: '며느리', name: '김현정', contact: '010-5432-1098' },
      { relationship: '며느리', name: '정수연', contact: '010-4321-0987' },
      { relationship: '사위', name: '이준혁', contact: '010-3210-9876' },
      { relationship: '사위', name: '김동현', contact: '010-2109-8765' }
    ],
    account_info: [
      { holder: '박철수', bank: '하나은행', number: '456-78-901234' },
      { holder: '박철민', bank: 'NH농협은행', number: '567-89-012345' }
    ],
    status: 'active'
  },
  {
    bugo_number: '2003',
    template_id: 'border',
    applicant_name: '이정훈',
    phone_password: '9012',
    deceased_name: '이복순',
    gender: '여',
    relationship: '모친',
    mourner_name: '이정훈',
    contact: '010-1111-2222',
    age: 79,
    religion: '천주교',
    funeral_home: '아산서울병원 장례식장',
    room_number: '특실 3호',
    funeral_home_tel: '02-3010-3500',
    address: '서울특별시 송파구 올림픽로43길 88',
    death_date: '2025-12-28',
    death_time: '21:45',
    funeral_date: '2025-12-30',
    funeral_time: '11:00',
    burial_place: '충청남도 천안 경동공원묘지',
    message: '사랑하는 어머니께서 영면에 드셨습니다. 어머니는 평생을 가족을 위해 헌신하시고 이웃을 사랑으로 품어주셨습니다. 마지막 가시는 길에 함께해 주시면 유가족에게 큰 위로가 되겠습니다.',
    mourners: [
      { relationship: '장남', name: '이정훈', contact: '010-1111-2222' },
      { relationship: '차남', name: '이정민', contact: '010-3333-4444' },
      { relationship: '삼남', name: '이정우', contact: '010-5555-6666' },
      { relationship: '장녀', name: '이수정', contact: '010-7777-8888' },
      { relationship: '며느리', name: '최윤희', contact: '010-9999-0000' }
    ],
    account_info: [
      { holder: '이정훈', bank: 'IBK기업은행', number: '678-90-123456' },
      { holder: '이정민', bank: '카카오뱅크', number: '3333-01-234567' },
      { holder: '이수정', bank: '토스뱅크', number: '1000-1234-5678' }
    ],
    status: 'active'
  },
  {
    bugo_number: '2004',
    template_id: 'flower',
    applicant_name: '최민수',
    phone_password: '3456',
    deceased_name: '최영진',
    gender: '남',
    relationship: '부친',
    mourner_name: '최민수',
    contact: '010-2468-1357',
    age: 84,
    religion: '무교',
    funeral_home: '세브란스병원 장례식장',
    room_number: '2호실',
    funeral_home_tel: '02-2228-0600',
    address: '서울특별시 서대문구 연세로 50-1',
    death_date: '2025-12-31',
    death_time: '03:20',
    funeral_date: '2026-01-02',
    funeral_time: '08:00',
    burial_place: '경기도 남양주 모란공원',
    message: '뜻밖의 비보를 전하게 되어 송구합니다. 아버지께서 편안히 눈을 감으셨습니다. 여든 네 해를 한결같이 가족을 사랑하고 성실하게 살아오신 아버지. 이제 고단한 삶의 짐을 내려놓고 평안히 쉬시길 바랍니다.',
    mourners: [
      { relationship: '장남', name: '최민수', contact: '010-2468-1357' },
      { relationship: '차남', name: '최민규', contact: '010-1357-2468' },
      { relationship: '장녀', name: '최은지', contact: '010-8642-9753' },
      { relationship: '차녀', name: '최은영', contact: '010-7531-8642' },
      { relationship: '며느리', name: '한소희', contact: '010-9513-7428' },
      { relationship: '며느리', name: '이유진', contact: '010-4286-1597' },
      { relationship: '사위', name: '강현우', contact: '010-3175-8624' },
      { relationship: '사위', name: '정재원', contact: '010-6842-5139' },
      { relationship: '손자', name: '최준서', contact: '010-1597-4286' },
      { relationship: '손녀', name: '최예린', contact: '010-8624-3175' }
    ],
    account_info: [
      { holder: '최민수', bank: 'SC제일은행', number: '789-01-234567' },
      { holder: '최민규', bank: '케이뱅크', number: '100-123-456789' },
      { holder: '최은지', bank: 'KB국민은행', number: '890-12-345678' },
      { holder: '최은영', bank: '신한은행', number: '901-23-456789' }
    ],
    status: 'active'
  }
];

for (const bugo of bugos) {
  const { data, error } = await supabase
    .from('bugo')
    .upsert([bugo], { onConflict: 'bugo_number' })
    .select();
  
  if (error) {
    console.log('Error for ' + bugo.bugo_number + ':', error.message);
  } else {
    console.log('Created bugo ' + bugo.bugo_number + ' (' + bugo.template_id + '): ' + bugo.deceased_name);
  }
}
