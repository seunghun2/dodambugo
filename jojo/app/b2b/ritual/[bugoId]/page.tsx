'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateJibang, RELATIONSHIP_TITLE } from '@/lib/ritual/jibang';
import { generateChukmun } from '@/lib/ritual/chukmun';
import { generateWipae } from '@/lib/ritual/wipae';
import { getYearGanji, getMonthGanji, getDayGanji } from '@/lib/ritual/ganji';
import CalendarPicker from '@/app/b2b/create/sections/CalendarPicker';
import styles from '../ritual.module.css';

/** 부고 상세 정보 */
interface BugoDetail {
  bugo_number: string;
  deceased_name: string;
  funeral_home?: string;
  room_number?: string;
  relationship?: string;
  mourner_name?: string;
  gender?: string;
  death_date?: string;
  funeral_date?: string;
}

type TabType = 'chukmun' | 'wipae';

const RELATIONSHIPS = Object.keys(RELATIONSHIP_TITLE);

/** 축문 제사 유형 목록 (구조화) */
type OccasionType = 
  | '기제사' 
  | '설날' 
  | '추석' 
  | '장례(발인제)'
  | '초혼(招魂)'
  | '평토제(平土祭)'
  | '성분제(成墳祭)'
  | '산신제(山神祭)'
  | '삼우제(三虞祭)'
  | '위령제(慰靈祭)';

/** 관계별 성별 매핑 */
const RELATION_GENDER: Record<string, 'male' | 'female'> = {
  '아버지': 'male',
  '어머니': 'female',
  '할아버지': 'male',
  '할머니': 'female',
  '증조부': 'male',
  '증조모': 'female',
  '남편': 'male',
  '아내': 'female',
  '형': 'male',
  '아들': 'male',
  '며느리': 'female',
};

/** 기독교/천주교 직분 목록 */
const CHRISTIAN_TITLES = ['성도', '집사', '권사', '장로', '권찰', '목사', '전도사', '신부', '수녀', '선택 안 함'];

// ─── 종교별 인라인 SVG 아이콘 (아트보드 – 1.svg 원본 path 추출) ───

const RELIGION_SVGS = {
  // 기독교 단일 십자가 (아트보드 – 6.svg, #de0615)
  christian: `
    <svg width="20.5" height="28.2" viewBox="0 0 20.5 28.2" fill="none" style="margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;">
      <path d="M 7.681,28.162 L 7.681,12.801 L 0.0,12.801 L 0.0,7.681 L 7.681,7.681 L 7.681,0.0 L 12.801,0.0 L 12.801,7.681 L 20.481,7.681 L 20.481,12.801 L 12.800,12.801 L 12.800,28.162 Z" fill="#de0615"/>
    </svg>
  `,
  // 천주교 trefoil 십자가 (아트보드 – 2.svg, #262727)
  catholic: `
    <svg width="25.8" height="34.0" viewBox="0 0 25.8 34.0" fill="none" style="margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;">
      <path d="M 10.552,31.66 A 2.344,2.344 0.0 0,1 8.207,29.315 A 2.345,2.345 0.0 0,1 10.552,26.97 L 10.552,16.418 L 7.035,16.418 A 2.345,2.345 0.0 0,1 4.69,18.763 A 2.344,2.344 0.0 0,1 2.345,16.418 A 2.344,2.344 0.0 0,1 0.0,14.073 A 2.345,2.345 0.0 0,1 2.345,11.728 A 2.345,2.345 0.0 0,1 4.69,9.383 A 2.346,2.346 0.0 0,1 7.035,11.728 L 10.552,11.728 L 10.552,7.035 A 2.344,2.344 0.0 0,1 8.207,4.69 A 2.345,2.345 0.0 0,1 10.552,2.345 A 2.345,2.345 0.0 0,1 12.897,0.0 A 2.346,2.346 0.0 0,1 15.242,2.345 A 2.346,2.346 0.0 0,1 17.587,4.69 A 2.345,2.345 0.0 0,1 15.242,7.035 L 15.242,11.725 L 18.759,11.725 A 2.345,2.345 0.0 0,1 21.104,9.38 A 2.346,2.346 0.0 0,1 23.449,11.725 A 2.346,2.346 0.0 0,1 25.794,14.07 A 2.345,2.345 0.0 0,1 23.449,16.415 A 2.345,2.345 0.0 0,1 21.104,18.76 A 2.344,2.344 0.0 0,1 18.759,16.415 L 15.242,16.415 L 15.242,26.967 A 2.346,2.346 0.0 0,1 17.585,29.315 A 2.345,2.345 0.0 0,1 15.24,31.66 A 2.345,2.345 0.0 0,1 12.895,34.005 A 2.344,2.344 0.0 0,1 10.552,31.66" fill="#262727"/>
    </svg>
  `,
  // 불교 만자 (아트보드 – 5.svg, #de0615)
  buddhism: `
    <svg width="24.8" height="24.8" viewBox="0 0 24.8 24.8" fill="none" style="margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;">
      <path d="M 14.636,24.771 L 10.131,24.771 L 10.131,14.638 L 4.503,14.638 L 4.503,24.77 L 0.003,24.77 L 0.003,10.133 L 10.137,10.133 L 10.137,4.505 L 0.0,4.505 L 0.0,0.0 L 14.635,0.0 L 14.635,10.133 L 20.263,10.133 L 20.263,0.001 L 24.77,0.001 L 24.77,14.64 L 14.636,14.64 L 14.636,20.268 L 24.77,20.268 L 24.77,24.768 L 14.636,24.771 Z" fill="#de0615"/>
    </svg>
  `,
  general: ''
};

// ─── 테두리 무늬 스킨 렌더링 헬퍼 함수 및 경로 계산 ───

const getScallopPath = (width: number, height: number) => {
  const m = 5.67; // 테두리 여백
  const arcSize = 22; // 반원 크기 (클수록 반원 개수 줄어듦)
  let path = '';
  
  // 1. 상단 물결 (아래로 볼록)
  const startX = m;
  const endX = width - m;
  const lenX = endX - startX;
  const countX = Math.max(2, Math.round(lenX / arcSize));
  const stepX = lenX / countX;
  const rX = stepX / 2;
  for (let i = 0; i < countX; i++) {
    const x = startX + i * stepX;
    path += ` M ${x},${m} a ${rX},${rX} 0 0,1 ${stepX},0 Z`;
  }
  
  // 2. 하단 물결 (위로 볼록)
  for (let i = 0; i < countX; i++) {
    const x = startX + i * stepX;
    path += ` M ${x},${height - m} a ${rX},${rX} 0 0,0 ${stepX},0 Z`;
  }
  
  // 3. 좌측 물결 (오른쪽으로 볼록)
  const startY = m;
  const endY = height - m;
  const lenY = endY - startY;
  const countY = Math.max(2, Math.round(lenY / arcSize));
  const stepY = lenY / countY;
  const rY = stepY / 2;
  for (let i = 0; i < countY; i++) {
    const y = startY + i * stepY;
    path += ` M ${m},${y} a ${rY},${rY} 0 0,0 0,${stepY}`;
  }
  
  // 4. 우측 물결 (왼쪽으로 볼록)
  for (let i = 0; i < countY; i++) {
    const y = startY + i * stepY;
    path += ` M ${width - m},${y} a ${rY},${rY} 0 0,1 0,${stepY}`;
  }
  
  return path;
};

const getCornerSvgContent = (w: number, h: number) => {
  const m = 5.67;
  const getCornerPath = (x: number, y: number, dx: number, dy: number) => {
    // 틈새를 메우기 위해 사각형과 교차하는 가로/세로선의 시작점을 1px 만큼 사각형 내부로 겹침(overlap) 처리
    // 선이 어긋나 보이는 현상을 막기 위해 내곽선은 사각형의 정중앙(4px)에서 시작하도록 설정
    // 외곽선들은 정확히 (x + 14, y + 14) 교차점에서 snap-align 되도록 10px -> 14px로 길이 연장
    return {
      square: {
        x: dx === 1 ? x : x - 8,
        y: dy === 1 ? y : y - 8,
        w: 8,
        h: 8
      },
      innerH: {
        x1: dx === 1 ? x + 7 : x - 7,
        y1: dy === 1 ? y + 4 : y - 4,
        x2: dx === 1 ? x + 16 : x - 16,
        y2: dy === 1 ? y + 4 : y - 4
      },
      innerV: {
        x1: dx === 1 ? x + 4 : x - 4,
        y1: dy === 1 ? y + 7 : y - 7,
        x2: dx === 1 ? x + 4 : x - 4,
        y2: dy === 1 ? y + 16 : y - 16
      },
      outerH: {
        x1: x,
        y1: dy === 1 ? y + 14 : y - 14,
        x2: dx === 1 ? x + 14 : x - 14,
        y2: dy === 1 ? y + 14 : y - 14
      },
      outerV: {
        x1: dx === 1 ? x + 14 : x - 14,
        y1: y,
        x2: dx === 1 ? x + 14 : x - 14,
        y2: dy === 1 ? y + 14 : y - 14
      }
    };
  };

  const corners = [
    getCornerPath(m, m, 1, 1), // Top-Left
    getCornerPath(w - m, m, -1, 1), // Top-Right
    getCornerPath(m, h - m, 1, -1), // Bottom-Left
    getCornerPath(w - m, h - m, -1, -1) // Bottom-Right
  ];

  return {
    corners,
    lines: [
      { x1: m + 14, y1: m, x2: w - m - 14, y2: m }, // Top
      { x1: m + 14, y1: h - m, x2: w - m - 14, y2: h - m }, // Bottom
      { x1: m, y1: m + 14, x2: m, y2: h - m - 14 }, // Left
      { x1: w - m, y1: m + 14, x2: w - m, y2: h - m - 14 } // Right
    ]
  };
};

const renderBorderSvg = (w: number, h: number, skin: 'none' | 'scallop' | 'double' | 'corner') => {
  if (skin === 'none') {
    return (
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${w} ${h}`}
      >
        {/* 모니터 화면에서 크기 가이드를 보여주기 위한 옅은 대시라인 (인쇄 시 미출력) */}
        <rect x="0" y="0" width={w} height={h} fill="none" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="3 3" />
      </svg>
    );
  }

  if (skin === 'double') {
    return (
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${w} ${h}`}
        shapeRendering="geometricPrecision"
      >
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} fill="none" stroke="#1a1311" strokeWidth="0.75" shapeRendering="geometricPrecision" />
        <rect x="5.67" y="5.67" width={w - 11.34} height={h - 11.34} fill="none" stroke="#1a1311" strokeWidth="1.5" strokeMiterlimit="10" shapeRendering="geometricPrecision" />
        <rect x="11.34" y="11.34" width={w - 22.68} height={h - 22.68} fill="none" stroke="#1a1311" strokeWidth="0.75" strokeMiterlimit="10" shapeRendering="geometricPrecision" />
      </svg>
    );
  }

  if (skin === 'corner') {
    const t = 1.0;
    const m = 5.67;
    const getCornerPathString = (x: number, y: number, dx: number, dy: number) => {
      const x0 = dx === 1 ? x : x - 5;
      const y0 = dy === 1 ? y : y - 5;
      
      // 사각형을 겹침 없이 완전히 닫아서 렌더링
      const sqPath = `M ${x0} ${y0} h 5 v 5 h -5 z`;

      // 사각형의 안쪽 꼭짓점에서 출발해 안쪽 방향으로 정확히 6px만 뻗어 나가는 격자선
      const innerX = x0 + (dx === 1 ? 5 : 0);
      const innerY = y0 + (dy === 1 ? 5 : 0);
      const innerH = `M ${innerX} ${innerY} h ${dx * 6}`;
      const innerV = `M ${innerX} ${innerY} v ${dy * 6}`;

      // 외부 꺾쇠 역시 교차점에서 정확하게 맞물려 끝나도록 9.5px 길이로 정합
      const outerH = `M ${x} ${y + dy * 9.5} h ${dx * 9.5}`;
      const outerV = `M ${x + dx * 9.5} ${y} v ${dy * 9.5}`;

      return `${sqPath} ${innerH} ${innerV} ${outerH} ${outerV}`;
    };

    const dPath = [
      getCornerPathString(m, m, 1, 1),
      getCornerPathString(w - m, m, -1, 1),
      getCornerPathString(m, h - m, 1, -1),
      getCornerPathString(w - m, h - m, -1, -1),
      `M ${m + 9.5} ${m} H ${w - m - 9.5}`,
      `M ${m + 9.5} ${h - m} H ${w - m - 9.5}`,
      `M ${m} ${m + 9.5} V ${h - m - 9.5}`,
      `M ${w - m} ${m + 9.5} V ${h - m - 9.5}`
    ].join(' ');

    return (
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${w} ${h}`}
        shapeRendering="geometricPrecision"
      >
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} fill="none" stroke="#1a1311" strokeWidth="0.75" shapeRendering="geometricPrecision" />
        <path d={dPath} fill="none" stroke="#1a1311" strokeWidth={t} strokeLinecap="square" strokeLinejoin="miter" shapeRendering="geometricPrecision" />
      </svg>
    );
  }

  if (skin === 'scallop') {
    return (
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${w} ${h}`}
        shapeRendering="geometricPrecision"
      >
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} fill="none" stroke="#1a1311" strokeWidth="1.5" shapeRendering="geometricPrecision" />
        <path d={getScallopPath(w, h)} fill="#1a1311" stroke="none" shapeRendering="geometricPrecision" />
      </svg>
    );
  }

  return null;
};

// 인쇄용 테두리 SVG 마크업 문자열 반환 함수
const getBorderSvgString = (w: number, h: number, skin: 'none' | 'scallop' | 'double' | 'corner') => {
  if (skin === 'none') {
    return '';
  }
  if (skin === 'double') {
    return `
      <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">
        <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="#1a1311" stroke-width="0.75" shape-rendering="geometricPrecision" />
        <rect x="5.67" y="5.67" width="${w - 11.34}" height="${h - 11.34}" fill="none" stroke="#1a1311" stroke-width="1.5" stroke-miterlimit="10" shape-rendering="geometricPrecision" />
        <rect x="11.34" y="11.34" width="${w - 22.68}" height="${h - 22.68}" fill="none" stroke="#1a1311" stroke-width="0.75" stroke-miterlimit="10" shape-rendering="geometricPrecision" />
      </svg>
    `;
  }
  if (skin === 'corner') {
    const t = 1.0;
    const m = 5.67;
    const getCornerPathString = (x: number, y: number, dx: number, dy: number) => {
      const x0 = dx === 1 ? x : x - 5;
      const y0 = dy === 1 ? y : y - 5;
      
      const sqPath = `M ${x0} ${y0} h 5 v 5 h -5 z`;

      const innerX = x0 + (dx === 1 ? 5 : 0);
      const innerY = y0 + (dy === 1 ? 5 : 0);
      const innerH = `M ${innerX} ${innerY} h ${dx * 6}`;
      const innerV = `M ${innerX} ${innerY} v ${dy * 6}`;

      const outerH = `M ${x} ${y + dy * 9.5} h ${dx * 9.5}`;
      const outerV = `M ${x + dx * 9.5} ${y} v ${dy * 9.5}`;

      return `${sqPath} ${innerH} ${innerV} ${outerH} ${outerV}`;
    };

    const dPath = [
      getCornerPathString(m, m, 1, 1),
      getCornerPathString(w - m, m, -1, 1),
      getCornerPathString(m, h - m, 1, -1),
      getCornerPathString(w - m, h - m, -1, -1),
      `M ${m + 9.5} ${m} H ${w - m - 9.5}`,
      `M ${m + 9.5} ${h - m} H ${w - m - 9.5}`,
      `M ${m} ${m + 9.5} V ${h - m - 9.5}`,
      `M ${w - m} ${m + 9.5} V ${h - m - 9.5}`
    ].join(' ');

    return `
      <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">
        <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="#1a1311" stroke-width="0.75" shape-rendering="geometricPrecision" />
        <path d="${dPath}" fill="none" stroke="#1a1311" stroke-width="${t}" stroke-linecap="square" stroke-linejoin="miter" shape-rendering="geometricPrecision" />
      </svg>
    `;
  }
  if (skin === 'scallop') {
    return `
      <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">
        <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="#1a1311" stroke-width="1.5" shape-rendering="geometricPrecision" />
        <path d="${getScallopPath(w, h)}" fill="#1a1311" stroke="none" shape-rendering="geometricPrecision" />
      </svg>
    `;
  }
  return '';
};

export default function RitualDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bugoNumber = params?.bugoId as string;

  const [bugo, setBugo] = useState<BugoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('wipae');

  // 1. 공통 종교 상태
  const [religion, setReligion] = useState<'general' | 'buddhism' | 'christian' | 'catholic'>('general');

  // 2. 출력 규격 선택 (지방/위패 공용)
  const [jibangSize, setJibangSize] = useState<'general_buddhism' | 'christian_catholic' | 'honbaek'>('general_buddhism');

  // 2-1. 테두리 무늬 스킨 선택
  const [borderSkin, setBorderSkin] = useState<'none' | 'scallop' | 'double' | 'corner'>('double');

  // 3. 축문 문자 선택 상태 ('korean': 쉬운 한글, 'hanja': 전통 한문)
  const [chukmunTextType, setChukmunTextType] = useState<'korean' | 'hanja'>('korean');

  // 고인 정보 상태
  const [deceasedName, setDeceasedName] = useState('');
  const [relationship, setRelationship] = useState('아버지');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [bonGwan, setBonGwan] = useState('');
  const [familyName, setFamilyName] = useState('');
  
  // 종교별 세부옵션
  const [endingWord, setEndingWord] = useState<'神位' | '靈駕' | '安息' | '없음'>('神位');
  const [christianTitle, setChristianTitle] = useState('성도');
  const [baptismName, setBaptismName] = useState('');
  const [baptismPosition, setBaptismPosition] = useState<'above' | 'below'>('above');
  const [christianPhrase, setChristianPhrase] = useState<'전체기도' | '안식기도' | '빛기도' | '없음'>('전체기도');
  const [affiliation, setAffiliation] = useState('천주교연령회연합회');

  // 축문용 정보 상태
  const [mournerName, setMournerName] = useState('');
  const [occasionType, setOccasionType] = useState<OccasionType>('장례(발인제)');
  const [ritualDateStr, setRitualDateStr] = useState<string>(new Date().toISOString().substring(0, 10));

  // 캘린더 모달 오픈 여부
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 캔버스 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 부고장 데이터 로드 및 프리필
  const fetchBugo = useCallback(async () => {
    const token = localStorage.getItem('b2b_token');
    if (!token) {
      router.push('/b2b/login');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bugo')
        .select('bugo_number, deceased_name, funeral_home, room_number, relationship, mourner_name, gender, death_date, funeral_date, religion')
        .eq('bugo_number', bugoNumber)
        .single();

      if (error || !data) {
        console.error('부고장 조회 실패:', error);
        router.back();
        return;
      }

      setBugo(data);

      setDeceasedName(data.deceased_name || '');
      setMournerName(data.mourner_name || '');

      const isFemale = data.gender === '여' || data.gender === 'female';
      setGender(isFemale ? 'female' : 'male');

      // 종교 설정 매핑
      const rawRelig = data.religion || 'general';
      if (rawRelig.includes('불교')) {
        setReligion('buddhism');
        setEndingWord('靈駕');
        setJibangSize('general_buddhism');
        setAffiliation('');
      } else if (rawRelig.includes('기독교')) {
        setReligion('christian');
        setEndingWord('安息');
        setJibangSize('christian_catholic');
        setAffiliation('교회');
        setChristianPhrase('없음');
      } else if (rawRelig.includes('천주교')) {
        setReligion('catholic');
        setEndingWord('安息');
        setJibangSize('christian_catholic');
        setAffiliation('천주교연령회연합회');
        setChristianPhrase('전체기도');
      } else {
        setReligion('general');
        setEndingWord('神位');
        setJibangSize('general_buddhism');
        setAffiliation('');
      }

      const rawRel = data.relationship || '';
      let detectedRel = isFemale ? '어머니' : '아버지';

      if (rawRel.includes('남편')) {
        detectedRel = '아내';
      } else if (rawRel.includes('아내') || rawRel.includes('배우자')) {
        detectedRel = isFemale ? '아내' : '남편';
      } else if (rawRel.includes('사위') || rawRel.includes('딸') || rawRel.includes('장녀')) {
        detectedRel = isFemale ? '어머니' : '아버지';
      } else if (rawRel.includes('형제') || rawRel.includes('동생')) {
        detectedRel = '형';
      }

      setRelationship(detectedRel);

      const defaultDate = data.funeral_date ? new Date(data.funeral_date) : new Date();
      setRitualDateStr(defaultDate.toISOString().substring(0, 10));

    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [bugoNumber, router]);

  useEffect(() => {
    fetchBugo();
  }, [fetchBugo]);

  const handleReligionChange = (newReligion: typeof religion) => {
    setReligion(newReligion);
    if (newReligion === 'buddhism') {
      setEndingWord('靈駕');
      setJibangSize('general_buddhism');
      setAffiliation('');
    } else if (newReligion === 'christian') {
      setEndingWord('安息');
      setJibangSize('christian_catholic');
      setAffiliation('교회');
      setChristianPhrase('없음');
    } else if (newReligion === 'catholic') {
      setEndingWord('安息');
      setJibangSize('christian_catholic');
      setAffiliation('천주교연령회연합회');
      setChristianPhrase('전체기도');
    } else {
      setEndingWord('神位');
      setJibangSize('general_buddhism');
      setAffiliation('');
    }
  };

  // 날짜 포맷 닷(.) 변환기
  // 날짜 포맷 닷(.) 변환기
  const formatDateDot = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[0]}. ${parts[1]}. ${parts[2]}.`;
    }
    return dateStr;
  };

  // 지방 생성 실행
  const jibangResult = generateJibang({
    deceasedName,
    relationship,
    gender,
    bonGwan: bonGwan || undefined,
    familyName: familyName || undefined,
    religion,
    endingWord,
    christianTitle: christianTitle === '선택 안 함' ? undefined : christianTitle,
    baptismName: baptismName || undefined,
    christianPhrase: christianPhrase === '전체기도' ? '없음' : christianPhrase,
  });

  // 위패 생성 실행
  const wipaeResult = generateWipae({
    deceasedName,
    relationship,
    gender,
    bonGwan: bonGwan || undefined,
    familyName: familyName || undefined,
    religion,
    endingWord,
    christianTitle: christianTitle === '선택 안 함' ? undefined : christianTitle,
    baptismName: baptismName || undefined,
    christianPhrase: christianPhrase === '전체기도' ? '없음' : christianPhrase,
  });

  // 축문 생성 실행 (religion 포함)
  const chukmunResult = generateChukmun({
    date: new Date(ritualDateStr),
    mournerName,
    occasionType,
    deceasedName,
    relationship,
    gender,
    bonGwan: bonGwan || undefined,
    familyName: familyName || undefined,
    religion,
  });

  const buildTabletColumns = (isWipae: boolean) => {
    const isChristianOrCatholic = religion === 'christian' || religion === 'catholic';

    if (isChristianOrCatholic) {
      // 1. 기독교/천주교 룰
      const mainLines: string[] = [];
      if (religion === 'catholic') {
        mainLines.push('선종');
      } else {
        mainLines.push('故');
      }
      if (christianTitle && christianTitle !== '선택 안 함') {
        mainLines.push(christianTitle);
      }
      if (baptismName && baptismPosition === 'above') {
        mainLines.push(baptismName);
      }
      mainLines.push(deceasedName);
      if (baptismName && baptismPosition === 'below') {
        mainLines.push('(');
        mainLines.push(baptismName);
        mainLines.push(')');
      }
      if (endingWord !== '없음') {
        const ending = endingWord === '安息' ? '안식' : endingWord === '神位' ? '신위' : endingWord;
        mainLines.push(ending);
      }

      const mainCol = {
        type: 'main' as const,
        chars: mainLines.join('').split(''),
        showCross: true,
      };

      // 기독교/천주교: phrase/affiliation 없이 main 열만 중앙정렬
      return [mainCol];
    } else {
      // 2. 일반/불교 룰
      if (jibangSize === 'honbaek') {
        // 혼백·명패 크기는 극도로 좁아서 1열로만 렌더링
        const lines = isWipae ? wipaeResult.lines : jibangResult.lines;
        return [{
          type: 'hanja' as const,
          chars: lines.join('').split(''),
        }];
      }

      // 일반적인 크기 (87x248mm 등)는 2열 구성 (우측: 한자, 좌측: 한글이름)
      const title = RELATIONSHIP_TITLE[relationship] || '顯考';
      const pos = gender === 'male' ? '學生' : '孺人';
      
      const hanjaLines: string[] = [title, pos];
      if (gender === 'female' && bonGwan && familyName) {
        hanjaLines.push(`${bonGwan}${familyName}氏`);
      }
      if (gender === 'male') {
        hanjaLines.push('府君');
      }
      if (endingWord !== '없음') {
        hanjaLines.push(endingWord);
      }

      const hanjaCol = {
        type: 'hanja' as const,
        chars: hanjaLines.join('').split(''),
      };

      const nameCol = {
        type: 'name' as const,
        chars: deceasedName.split(''),
      };

      return [nameCol, hanjaCol];
    }
  };

  // A4 PDF 인쇄 (명조체 바탕 강제화 및 종교 SVG 포함)
  const handlePrint = () => {
    if (activeTab === 'chukmun') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const isHanja = chukmunTextType === 'hanja' && religion !== 'christian' && religion !== 'catholic';
      const activeLines = isHanja ? chukmunResult.lines : chukmunResult.koreanLines;

      // 한문 모드: 글자 단위로 4자씩 세로 열 분할
      let hanjaColumnsHtml = '';
      if (isHanja) {
        const allChars = activeLines.join('').replace(/\s+/g, '').split('');
        const CHARS_PER_COL = 4;
        const columns: string[][] = [];
        for (let i = 0; i < allChars.length; i += CHARS_PER_COL) {
          columns.push(allChars.slice(i, i + CHARS_PER_COL));
        }
        hanjaColumnsHtml = columns.map(col =>
          `<div class="hanja-col">${col.map(c => `<span class="hanja-char">${c}</span>`).join('')}</div>`
        ).join('');
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html><head><title>축문 - 故 ${deceasedName}</title>
        <style>
          @page { size: A4; margin: 0; }
          html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
          body { 
            font-family: 'Batang', 'Nanum Myeongjo', 'Gungsuh', 'Georgia', serif; 
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            background: #fff;
            padding: 30mm;
          }
          .content { 
            display: flex;
            width: auto;
            max-width: 100%;
            height: auto;
            max-height: 100%;
            box-sizing: border-box;
            ${isHanja ? `
              flex-direction: row-reverse;
              justify-content: center;
              align-items: flex-start;
              gap: 12px;
            ` : `
              flex-direction: column;
              justify-content: center;
              align-items: flex-start;
              gap: 16px;
              width: 80%;
            `}
          }
          .line { 
            color: #1a1a1a; 
            word-break: keep-all;
            white-space: nowrap;
            font-size: 24px;
            line-height: 2.0;
            letter-spacing: 0.05em;
            text-align: left;
          }
          .hanja-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          .hanja-char {
            font-size: 28px;
            line-height: 1;
            color: #1a1a1a;
            display: block;
          }
        </style></head>
        <body>
          <div class="content">
            ${isHanja
              ? hanjaColumnsHtml
              : activeLines.map(line => `<div class="line">${line}</div>`).join('')
            }
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body></html>
      `);
      printWindow.document.close();
      return;
    }

    const isWipae = activeTab === 'wipae';
    const columns = buildTabletColumns(isWipae);
    
    // 규격별 가로/세로 cm 계산 (지방/위패 공용)
    let widthCm = 8.7;
    let heightCm = 24.8;

    if (jibangSize === 'general_buddhism') {
      widthCm = 8.7;
      heightCm = 24.8;
    } else if (jibangSize === 'christian_catholic') {
      widthCm = 5.7;
      heightCm = 20.0;
    } else if (jibangSize === 'honbaek') {
      widthCm = 2.3;
      heightCm = 14.0;
    }

    // 종교별 상단 마크 SVG
    const religionSvgStr = RELIGION_SVGS[religion] || '';

    // 선택된 무늬 스킨의 인쇄용 SVG 취득 (1cm = 10px 비율로 가상 뷰박스 생성)
    const borderSvgHtml = getBorderSvgString(widthCm * 10, heightCm * 10, borderSkin);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${isWipae ? '위패' : '지방'} - 故 ${deceasedName}</title>
      <style>
        @page { size: A4; margin: 0; }
        body { 
          font-family: 'Batang', 'Nanum Myeongjo', 'Gungsuh', 'Georgia', serif; 
          margin: 0; padding: 0;
          display: flex; align-items: center; justify-content: center;
          min-height: 297mm;
        }
        .container {
          position: relative;
          width: ${widthCm}cm;
          height: ${heightCm}cm;
          display: flex;
          align-items: stretch;
          justify-content: center;
        }
        /* 절취선 */
        .cutline {
          position: absolute;
          top: -8mm; left: -8mm; right: -8mm; bottom: -8mm;
          border: 2px dashed #ccc;
          border-radius: 4px;
        }
        .cutlabel {
          position: absolute;
          top: -14mm; left: 50%; transform: translateX(-50%);
          font-size: 9px; color: #aaa; font-family: sans-serif;
          white-space: nowrap;
        }
        /* 지방/위패 본체 — 선택한 테두리 SVG 스킨 동적 적용 */
        .paper {
          width: 100%; height: 100%;
          position: relative;
          display: flex; 
          flex-direction: row;
          align-items: stretch; 
          justify-content: center;
          box-sizing: border-box;
          background: #fff;
          padding: 16px 8px;
        }
        .column {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          flex: 1;
        }
        .char {
          font-size: ${jibangSize === 'honbaek' ? '24' : jibangSize === 'christian_catholic' ? '36' : isWipae ? '48' : '44'}px;
          font-weight: 700;
          color: #1a1311;
          line-height: 1.35;
        }
        .name-char {
          font-size: ${jibangSize === 'honbaek' ? '28' : jibangSize === 'christian_catholic' ? '40' : isWipae ? '52' : '48'}px;
          font-weight: 700;
          color: #1a1311;
          line-height: 1.35;
        }
        .goin-label {
          font-size: 16px;
          color: #666;
          font-weight: 600;
          line-height: 1.2;
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .phrase-char {
          font-size: 15px;
          color: #333;
          font-weight: 500;
          line-height: 1.35;
        }
      </style></head>
      <body>
        <div class="container">
          <div class="cutline"></div>
          <div class="cutlabel">절취선을 따라 잘라 주세요 (${isWipae ? '위패' : '지방'} 규격: ${widthCm} x ${heightCm}cm)</div>
          <div class="paper">
            ${borderSvgHtml}
            <div style="display: flex; width: 100%; align-items: stretch; justify-content: center; gap: 0px; position: relative; z-index: 1;">
              ${columns.map((col: any) => {
                if (col.type === 'phrase') {
                  const isLeft = christianPhrase === '빛기도';
                  const borderStyle = isLeft ? 'border-right: 1px solid #ccc; padding-right: 8px;' : 'border-left: 1px solid #ccc; padding-left: 8px;';
                  return `
                    <div class="column" style="${borderStyle} justify-content: center; flex: 1;">
                      ${col.chars.map((c: string) => `<div class="phrase-char">${c}</div>`).join('')}
                    </div>
                  `;
                }
                if (col.type === 'name') {
                  return `
                    <div class="column" style="justify-content: center; gap: 20px; flex: 1;">
                      <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                        ${col.chars.map((c: string) => `<div class="name-char">${c}</div>`).join('')}
                      </div>
                      <div class="goin-label" style="margin-top: 0;">
                        <div>고</div>
                        <div>인</div>
                      </div>
                    </div>
                  `;
                }
                if (col.type === 'main') {
                  return `
                    <div class="column" style="justify-content: center;">
                      ${col.showCross ? religionSvgStr : ''}
                      <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                        ${col.chars.map((c: string) => {
                          const isParenthesis = c === '(' || c === ')';
                          const inlineStyle = isParenthesis ? 'transform: rotate(90deg); display: inline-block; margin: 4px 0;' : '';
                          return `<div class="char" style="${inlineStyle}">${c}</div>`;
                        }).join('')}
                      </div>
                    </div>
                  `;
                }
                if (col.type === 'hanja') {
                  return `
                    <div class="column" style="justify-content: center;">
                      ${religionSvgStr}
                      <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                        ${col.chars.map((c: string) => `<div class="char">${c}</div>`).join('')}
                      </div>
                    </div>
                  `;
                }
                return '';
              }).join('')}
            </div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleSend = () => {
    alert('장례지도사 알림톡으로 생성이 완료된 이미지가 즉시 전송되었습니다.');
  };

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.headerTitle}>故 {deceasedName} 의례 문서</span>
      </header>

      {/* 탭 바 */}
      <div className={styles.tabBar}>

        <button
          className={`${styles.tab} ${activeTab === 'chukmun' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('chukmun')}
        >
          축문
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'wipae' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('wipae')}
        >
          위패
        </button>
      </div>

      {/* 커스텀 수정 폼 */}
      <div className={styles.formSection}>
        
        {/* 종교 설정 섹션 */}
        <div style={{ border: '1px solid var(--b2b-border-light)', borderRadius: '8px', padding: '14px', marginBottom: '16px', backgroundColor: '#fafafa' }}>
          <label className={styles.formLabel} style={{ fontWeight: 700 }}>고인 종교 선택</label>
          <select
            className={styles.formSelect}
            value={religion}
            onChange={(e) => handleReligionChange(e.target.value as typeof religion)}
          >
            <option value="general">일반 (유교 전통)</option>
            <option value="buddhism">불교</option>
            <option value="christian">기독교</option>
            <option value="catholic">천주교</option>
          </select>

          {/* 위패 탭일 때 규격 사이즈 및 테두리 무늬 스킨 선택 필드 */}
          {activeTab === 'wipae' && (
            <>
              <div style={{ marginTop: '12px' }}>
                <label className={styles.formLabel}>출력 규격 (사이즈)</label>
                <select
                  className={styles.formSelect}
                  value={jibangSize}
                  onChange={(e) => setJibangSize(e.target.value as typeof jibangSize)}
                >
                  <option value="general_buddhism">일반·불교 크기 (8.7 x 24.8cm)</option>
                  <option value="christian_catholic">기독교·천주교 크기 (5.7 x 20.0cm)</option>
                  <option value="honbaek">혼백·명패 크기 (2.3 x 14.0cm)</option>
                </select>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label className={styles.formLabel}>무늬 스킨 선택</label>
                <select
                  className={styles.formSelect}
                  value={borderSkin}
                  onChange={(e) => setBorderSkin(e.target.value as typeof borderSkin)}
                >
                  <option value="none">무늬 없음</option>
                  <option value="scallop">물결/톱니 무늬</option>
                  <option value="double">이중선 무늬</option>
                  <option value="corner">모서리 무늬</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* 고인 정보 섹션 */}
        <div style={{ border: '1px solid var(--b2b-border-light)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--b2b-text-primary)', display: 'block', marginBottom: '12px' }}>
            대상 고인 정보
          </span>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>고인 성함</label>
            <input
              className={styles.formInput}
              type="text"
              value={deceasedName}
              onChange={(e) => setDeceasedName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>관계</label>
              <select
                className={styles.formSelect}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>성별</label>
              <select
                className={styles.formSelect}
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
              >
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>
          </div>

          {/* 종교별 직분/세례명 필드 분기 */}
          {(religion === 'christian' || religion === 'catholic') && (
            <>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>직분</label>
                  <select
                    className={styles.formSelect}
                    value={christianTitle}
                    onChange={(e) => setChristianTitle(e.target.value)}
                  >
                    {CHRISTIAN_TITLES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>세례명 (선택)</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder="예: 요한"
                    value={baptismName}
                    onChange={(e) => setBaptismName(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>측면 기도 문구</label>
                <select
                  className={styles.formSelect}
                  value={christianPhrase}
                  onChange={(e) => setChristianPhrase(e.target.value as typeof christianPhrase)}
                >
                  <option value="안식기도">안식기도 ("주님 그에게 영원한 안식을 주소서")</option>
                  <option value="빛기도">빛기도 ("영원한 빛을 그에게 비추소서")</option>
                  <option value="없음">표시 안 함 (본체만 출력)</option>
                </select>
              </div>
            </>
          )}

          {gender === 'female' && (religion === 'general' || religion === 'buddhism') && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>본관 (예: 김해)</label>
                <input
                  className={styles.formInput}
                  type="text"
                  value={bonGwan}
                  onChange={(e) => setBonGwan(e.target.value)}
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>성씨 (예: 김)</label>
                <input
                  className={styles.formInput}
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>맺음말 문구</label>
            <select
              className={styles.formSelect}
              value={endingWord}
              onChange={(e) => setEndingWord(e.target.value as typeof endingWord)}
            >
              <option value="神位">神位 (신위 - 일반 전통)</option>
              <option value="靈駕">靈駕 (영가 - 불교식)</option>
              <option value="安息">安息 (안식 - 기독교/천주교식)</option>
              <option value="없음">직접수정 / 없음</option>
            </select>
          </div>
        </div>

        {/* 축문 설정 섹션 */}
        {activeTab === 'chukmun' && (
          <div style={{ border: '1px solid var(--b2b-border-light)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--b2b-text-primary)', display: 'block', marginBottom: '12px' }}>
              축문 설정
            </span>
            
            {/* 아래에서 위로 올라오는 바텀시트 데이트피커 바인딩 */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>제사 양력 날짜</label>
              <div style={{ position: 'relative' }} onClick={() => setIsCalendarOpen(true)}>
                <input
                  className={styles.formInput}
                  type="text"
                  readOnly
                  value={formatDateDot(ritualDateStr)}
                  style={{ cursor: 'pointer', paddingRight: '40px', backgroundColor: '#fff' }}
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>상주 이름</label>
                <input
                  className={styles.formInput}
                  type="text"
                  value={mournerName}
                  onChange={(e) => setMournerName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.formLabel}>축문 종류</label>
                <select
                  className={styles.formSelect}
                  value={occasionType}
                  onChange={(e) => setOccasionType(e.target.value as OccasionType)}
                >
                  <optgroup label="대표 의례 (명절/기일)">
                    <option value="기제사">기제사 (부모님 기일)</option>
                    <option value="설날">설날 차례</option>
                    <option value="추석">추석 차례</option>
                    <option value="장례(발인제)">장례 (발인제)</option>
                  </optgroup>
                  <optgroup label="세부 장례 제식 (3일장 과정)">
                    <option value="초혼(招魂)">초혼 (招魂)</option>
                    <option value="평토제(平土祭)">평토제 (平土祭)</option>
                    <option value="성분제(成墳祭)">성분제 (成墳祭)</option>
                    <option value="산신제(山神祭)">산신제 (山神祭 - 토지신)</option>
                    <option value="삼우제(三虞祭)">삼우제 (三虞祭)</option>
                    <option value="위령제(慰靈祭)">위령제 (慰靈祭)</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* 한글 / 한자 라디오 버튼형 문자 선택 UI (종교가 기독교/천주교가 아닐 때만 렌더링) */}
            {(religion !== 'christian' && religion !== 'catholic') && (
              <div style={{ marginTop: '12px' }}>
                <label className={styles.formLabel}>축문 표기 언어</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="chukmunTextType"
                      checked={chukmunTextType === 'korean'}
                      onChange={() => setChukmunTextType('korean')}
                      style={{ accentColor: 'var(--b2b-accent)' }}
                    />
                    현대식 한글 축문
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="chukmunTextType"
                      checked={chukmunTextType === 'hanja'}
                      onChange={() => setChukmunTextType('hanja')}
                      style={{ accentColor: 'var(--b2b-accent)' }}
                    />
                    전통 한문 축문
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 미리보기 영역 */}
      <div className={styles.previewSection}>
        <div className={styles.previewCard}>


          {/* 2. 축문 미리보기 */}
          {activeTab === 'chukmun' && (
            <div className={styles.chukmunPreview}>
              <div 
                className={styles.chukmunPaper} 
                style={
                  (chukmunTextType === 'hanja' && religion !== 'christian' && religion !== 'catholic') ? {
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    padding: '24px 12px',
                    minHeight: '380px',
                    gap: '2px',
                    overflowX: 'auto'
                  } : {
                    padding: '30px 20px',
                    minHeight: '380px'
                  }
                }
              >
                {(chukmunTextType === 'hanja' && religion !== 'christian' && religion !== 'catholic') ? (
                  (() => {
                    // 모든 줄의 한자/한글을 합쳐서 공백 제거 후 글자 배열로 변환
                    const allChars = chukmunResult.lines.join('').replace(/\s+/g, '').split('');
                    const CHARS_PER_COL = 4;
                    const columns: string[][] = [];
                    for (let i = 0; i < allChars.length; i += CHARS_PER_COL) {
                      columns.push(allChars.slice(i, i + CHARS_PER_COL));
                    }
                    return columns.map((col, cIdx) => (
                      <div
                        key={cIdx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {col.map((char, chIdx) => (
                          <span
                            key={chIdx}
                            style={{
                              fontSize: '14px',
                              lineHeight: '1',
                              display: 'block',
                            }}
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    ));
                  })()
                ) : (religion === 'christian' || religion === 'catholic') ? (
                  chukmunResult.koreanLines.map((line, i) => (
                    <div key={i} className={styles.chukmunLine} style={{ letterSpacing: '0.01em', fontSize: '13px', lineHeight: '2.0', textAlign: 'left', textIndent: '0', color: '#2b5f3a', fontWeight: 'bold' }}>{line}</div>
                  ))
                ) : (
                  chukmunResult.koreanLines.map((line, i) => (
                    <div key={i} className={styles.chukmunLine} style={{ letterSpacing: '0.02em', fontSize: '13px', lineHeight: '1.8', textAlign: 'left', textIndent: '0' }}>{line}</div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. 위패 미리보기 */}
          {activeTab === 'wipae' && (
            <div className={styles.jibangPreview}>
              <div
                className={styles.jibangPaper}
                style={{
                  width: jibangSize === 'honbaek' ? 60 : jibangSize === 'christian_catholic' ? 105 : 140,
                  minHeight: jibangSize === 'honbaek' ? 320 : jibangSize === 'christian_catholic' ? 333 : 370,
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  backgroundColor: '#fff',
                  padding: '32px 14px 24px 14px',
                  position: 'relative',
                }}
              >
                {renderBorderSvg(
                  jibangSize === 'honbaek' ? 60 : jibangSize === 'christian_catholic' ? 105 : 140,
                  jibangSize === 'honbaek' ? 320 : jibangSize === 'christian_catholic' ? 333 : 370,
                  borderSkin
                )}
                <div style={{ display: 'flex', width: '100%', alignItems: 'stretch', justifyContent: 'center', gap: jibangSize === 'honbaek' ? '0px' : '6px', height: '100%', position: 'relative', zIndex: 1 }}>
                  {(() => {
                    const cols = buildTabletColumns(true);
                    const isSingleColumn = cols.length === 1;
                    return cols.map((col: any, cIdx: number) => {
                      if (col.type === 'phrase') {
                        const isLeft = col.side === 'left';
                        return (
                          <div key={cIdx} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center',
                            paddingLeft: isLeft ? '0' : '8px',
                            paddingRight: isLeft ? '8px' : '0',
                            borderLeft: isLeft ? '0' : '1px solid #ddd',
                            borderRight: isLeft ? '1px solid #ddd' : '0',
                            fontSize: '12px', color: '#333', fontWeight: 500,
                            lineHeight: '1.35', gap: '0px',
                            fontFamily: "'Batang', 'Nanum Myeongjo', serif"
                          }}>
                            {col.chars.map((c: string, i: number) => (
                              <div key={i}>{c}</div>
                            ))}
                          </div>
                        );
                      }
                      if (col.type === 'affiliation') {
                        return (
                          <div key={cIdx} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center',
                            paddingLeft: '4px',
                            fontSize: '10px', color: '#777', fontWeight: 500,
                            lineHeight: '1.25', gap: '0px',
                            fontFamily: "'Batang', 'Nanum Myeongjo', serif",
                            opacity: 0.85
                          }}>
                            {col.chars.map((c: string, i: number) => (
                              <div key={i}>{c}</div>
                            ))}
                          </div>
                        );
                      }
                      if (col.type === 'name') {
                        return (
                          <div key={cIdx} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center',
                            flex: 'none', gap: '8px'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              {col.chars.map((c: string, i: number) => (
                                <div key={i} style={{ fontSize: jibangSize === 'honbaek' ? '16px' : jibangSize === 'christian_catholic' ? '24px' : '30px', fontWeight: 700, color: '#1a1311', fontFamily: "'Batang', 'Nanum Myeongjo', serif" }}>
                                  {c}
                                </div>
                              ))}
                            </div>
                            <div style={{
                              fontSize: '13px', color: '#666', fontWeight: 600,
                              display: 'flex', flexDirection: 'column', alignItems: 'center',
                              fontFamily: "'Batang', 'Nanum Myeongjo', serif"
                            }}>
                              <div>고</div>
                              <div>인</div>
                            </div>
                          </div>
                        );
                      }
                      if (col.type === 'main') {
                        return (
                          <div key={cIdx} className={styles.jibangColumn} style={{ flex: 'none', borderRight: isSingleColumn ? 'none' : undefined, paddingRight: isSingleColumn ? '0' : undefined }}>
                            {religion === 'christian' && (
                              <svg width="18" height="24.8" viewBox="0 0 20.5 28.2" fill="none" style={{ marginBottom: '6px' }}>
                                <path d="M 7.681,28.162 L 7.681,12.801 L 0.0,12.801 L 0.0,7.681 L 7.681,7.681 L 7.681,0.0 L 12.801,0.0 L 12.801,7.681 L 20.481,7.681 L 20.481,12.801 L 12.800,12.801 L 12.800,28.162 Z" fill="#de0615"/>
                              </svg>
                            )}
                            {religion === 'catholic' && (
                              <svg width="20" height="26.4" viewBox="0 0 25.8 34.0" fill="none" style={{ marginBottom: '6px' }}>
                                <path d="M 10.552,31.66 A 2.344,2.344 0.0 0,1 8.207,29.315 A 2.345,2.345 0.0 0,1 10.552,26.97 L 10.552,16.418 L 7.035,16.418 A 2.345,2.345 0.0 0,1 4.69,18.763 A 2.344,2.344 0.0 0,1 2.345,16.418 A 2.344,2.344 0.0 0,1 0.0,14.073 A 2.345,2.345 0.0 0,1 2.345,11.728 A 2.345,2.345 0.0 0,1 4.69,9.383 A 2.346,2.346 0.0 0,1 7.035,11.728 L 10.552,11.728 L 10.552,7.035 A 2.344,2.344 0.0 0,1 8.207,4.69 A 2.345,2.345 0.0 0,1 10.552,2.345 A 2.345,2.345 0.0 0,1 12.897,0.0 A 2.346,2.346 0.0 0,1 15.242,2.345 A 2.346,2.346 0.0 0,1 17.587,4.69 A 2.345,2.345 0.0 0,1 15.242,7.035 L 15.242,11.725 L 18.759,11.725 A 2.345,2.345 0.0 0,1 21.104,9.38 A 2.346,2.346 0.0 0,1 23.449,11.725 A 2.346,2.346 0.0 0,1 25.794,14.07 A 2.345,2.345 0.0 0,1 23.449,16.415 A 2.345,2.345 0.0 0,1 21.104,18.76 A 2.344,2.344 0.0 0,1 18.759,16.415 L 15.242,16.415 L 15.242,26.967 A 2.346,2.346 0.0 0,1 17.585,29.315 A 2.345,2.345 0.0 0,1 15.24,31.66 A 2.345,2.345 0.0 0,1 12.895,34.005 A 2.344,2.344 0.0 0,1 10.552,31.66" fill="#262727"/>
                              </svg>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              {col.chars.map((c: string, i: number) => {
                                const isParenthesis = c === '(' || c === ')';
                                return (
                                  <div
                                    key={i}
                                    className={styles.jibangChar}
                                    style={{
                                      fontSize: jibangSize === 'honbaek' ? '14px' : jibangSize === 'christian_catholic' ? '22px' : '28px',
                                      transform: isParenthesis ? 'rotate(90deg)' : 'none',
                                      display: isParenthesis ? 'inline-block' : 'block',
                                      margin: isParenthesis ? '2px 0' : '0'
                                    }}
                                  >
                                    {c}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      if (col.type === 'hanja') {
                        return (
                          <div key={cIdx} className={styles.jibangColumn} style={{ flex: 'none', borderRight: isSingleColumn ? 'none' : undefined, paddingRight: isSingleColumn ? '0' : undefined }}>
                            {religion === 'buddhism' && (
                              <svg width="24" height="24" viewBox="0 0 24.8 24.8" fill="none" style={{ marginBottom: '6px' }}>
                                <path d="M 14.636,24.771 L 10.131,24.771 L 10.131,14.638 L 4.503,14.638 L 4.503,24.77 L 0.003,24.77 L 0.003,10.133 L 10.137,10.133 L 10.137,4.505 L 0.0,4.505 L 0.0,0.0 L 14.635,0.0 L 14.635,10.133 L 20.263,10.133 L 20.263,0.001 L 24.77,0.001 L 24.77,14.64 L 14.636,14.64 L 14.636,20.268 L 24.77,20.268 L 24.77,24.768 L 14.636,24.771 Z" fill="#de0615"/>
                              </svg>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              {col.chars.map((c: string, i: number) => {
                                const isParenthesis = c === '(' || c === ')';
                                return (
                                  <div
                                    key={i}
                                    className={styles.jibangChar}
                                    style={{
                                      fontSize: jibangSize === 'honbaek' ? '14px' : jibangSize === 'christian_catholic' ? '22px' : '28px',
                                      transform: isParenthesis ? 'rotate(90deg)' : 'none',
                                      display: isParenthesis ? 'inline-block' : 'block',
                                      margin: isParenthesis ? '2px 0' : '0'
                                    }}
                                  >
                                    {c}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 액션 버튼 */}
      <div className={styles.bottomActions}>
        <button className={styles.btnPrint} onClick={handlePrint}>
          A4 인쇄
        </button>
        <button className={styles.btnSend} onClick={handleSend}>
          보내기
        </button>
      </div>

      {/* 마음부고 고유 아래에서 위로 올라오는 날짜 팝업 바텀시트 */}
      <CalendarPicker
        isOpen={isCalendarOpen}
        title="제사일자 선택"
        value={ritualDateStr}
        onSelect={(date) => setRitualDateStr(date)}
        onClose={() => setIsCalendarOpen(false)}
      />

      {/* 숨겨진 캔버스 (이미지 생성용) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
