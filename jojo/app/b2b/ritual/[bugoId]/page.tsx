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
  '딸': 'female',
  '며느리': 'female',
};

/** 기독교/천주교 직분 목록 */
const CHRISTIAN_TITLES = ['성도/聖徒', '집사/執事', '권사/勸士', '장로/長老', '권찰/勸察', '목사/牧師', '전도사/傳道師', '신부/神父', '수녀/修女', '선택 안 함'];

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
  let m = 5.67; // 테두리 여백
  let countX = 10; // 상/하단 물결 개수 (기본 10개)
  
  if (width <= 25) { // honbaek print (23)
    m = 2.0;
    countX = 4;
  } else if (width <= 65 && height > 250) { // honbaek preview (60, 320)
    m = 4.0;
    countX = 6;
  } else if (width >= 100) { // christian preview (105), general preview (140)
    countX = 16;
  }

  let path = '';
  
  // 1. 상단 물결 (아래로 볼록)
  const startX = m;
  const endX = width - m;
  const lenX = endX - startX;
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
  
  // 3. 좌측 물결 (오른쪽으로 볼록) - 상하단 물결 크기(stepX)에 맞춰 좌우 물결 개수(countY) 자동 산출
  const startY = m;
  const endY = height - m;
  const lenY = endY - startY;
  const countY = Math.max(2, Math.round(lenY / stepX));
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
    let m2 = 5.67;
    let m3 = 11.34;
    let sw1 = 0.75;
    let sw2 = 1.5;
    let sw3 = 0.75;
    
    if (w <= 25) { // honbaek print (23)
      m2 = 2.0;
      m3 = 4.0;
      sw1 = 0.5;
      sw2 = 0.75;
      sw3 = 0.5;
    } else if (w <= 65) { // honbaek preview (60)
      m2 = 4.0;
      m3 = 8.0;
      sw1 = 0.5;
      sw2 = 1.0;
      sw3 = 0.5;
    }

    return (
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${w} ${h}`}
        shapeRendering="geometricPrecision"
      >
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} fill="none" stroke="#1a1311" strokeWidth={sw1} shapeRendering="geometricPrecision" />
        <rect x={m2} y={m2} width={w - m2 * 2} height={h - m2 * 2} fill="none" stroke="#1a1311" strokeWidth={sw2} strokeMiterlimit="10" shapeRendering="geometricPrecision" />
        <rect x={m3} y={m3} width={w - m3 * 2} height={h - m3 * 2} fill="none" stroke="#1a1311" strokeWidth={sw3} strokeMiterlimit="10" shapeRendering="geometricPrecision" />
      </svg>
    );
  }

  if (skin === 'corner') {
    let t = 1.0;
    let m = 5.67;
    let sqSize = 5.0;
    let innerLen = 6.0;
    let outerLen = 9.5;
    
    if (w <= 25) { // honbaek print
      t = 0.5;
      m = 2.0;
      sqSize = 2.0;
      innerLen = 2.0;
      outerLen = 3.5;
    } else if (w <= 65) { // honbaek preview
      t = 0.75;
      m = 4.0;
      sqSize = 3.5;
      innerLen = 4.0;
      outerLen = 6.0;
    }

    const getCornerPathString = (x: number, y: number, dx: number, dy: number) => {
      const x0 = dx === 1 ? x : x - sqSize;
      const y0 = dy === 1 ? y : y - sqSize;
      
      // 사각형을 겹침 없이 완전히 닫아서 렌더링
      const sqPath = `M ${x0} ${y0} h ${sqSize} v ${sqSize} h -${sqSize} z`;

      // 사각형의 안쪽 꼭짓점에서 출발해 안쪽 방향으로 격자선
      const innerX = x0 + (dx === 1 ? sqSize : 0);
      const innerY = y0 + (dy === 1 ? sqSize : 0);
      const innerH = `M ${innerX} ${innerY} h ${dx * innerLen}`;
      const innerV = `M ${innerX} ${innerY} v ${dy * innerLen}`;

      // 외부 꺾쇠 교차점에서 정확하게 맞물리도록 정합
      const outerH = `M ${x} ${y + dy * outerLen} h ${dx * outerLen}`;
      const outerV = `M ${x + dx * outerLen} ${y} v ${dy * outerLen}`;

      return `${sqPath} ${innerH} ${innerV} ${outerH} ${outerV}`;
    };

    const dPath = [
      getCornerPathString(m, m, 1, 1),
      getCornerPathString(w - m, m, -1, 1),
      getCornerPathString(m, h - m, 1, -1),
      getCornerPathString(w - m, h - m, -1, -1),
      `M ${m + outerLen} ${m} H ${w - m - outerLen}`,
      `M ${m + outerLen} ${h - m} H ${w - m - outerLen}`,
      `M ${m} ${m + outerLen} V ${h - m - outerLen}`,
      `M ${w - m} ${m + outerLen} V ${h - m - outerLen}`
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
    let strokeW = 1.5;
    if (w <= 25) strokeW = 0.75;
    else if (w <= 65) strokeW = 1.0;

    return (
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${w} ${h}`}
        shapeRendering="geometricPrecision"
      >
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} fill="none" stroke="#1a1311" strokeWidth={strokeW} shapeRendering="geometricPrecision" />
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
    let m2 = 5.67;
    let m3 = 11.34;
    let sw1 = 0.75;
    let sw2 = 1.5;
    let sw3 = 0.75;
    
    if (w <= 25) { // honbaek print (23)
      m2 = 2.0;
      m3 = 4.0;
      sw1 = 0.5;
      sw2 = 0.75;
      sw3 = 0.5;
    } else if (w <= 65) { // honbaek preview (60)
      m2 = 4.0;
      m3 = 8.0;
      sw1 = 0.5;
      sw2 = 1.0;
      sw3 = 0.5;
    }

    return `
      <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">
        <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="#1a1311" stroke-width="${sw1}" shape-rendering="geometricPrecision" />
        <rect x="${m2}" y="${m2}" width="${w - m2 * 2}" height="${h - m2 * 2}" fill="none" stroke="#1a1311" stroke-width="${sw2}" stroke-miterlimit="10" shape-rendering="geometricPrecision" />
        <rect x="${m3}" y="${m3}" width="${w - m3 * 2}" height="${h - m3 * 2}" fill="none" stroke="#1a1311" stroke-width="${sw3}" stroke-miterlimit="10" shape-rendering="geometricPrecision" />
      </svg>
    `;
  }
  if (skin === 'corner') {
    let t = 1.0;
    let m = 5.67;
    let sqSize = 5.0;
    let innerLen = 6.0;
    let outerLen = 9.5;
    
    if (w <= 25) { // honbaek print
      t = 0.5;
      m = 2.0;
      sqSize = 2.0;
      innerLen = 2.0;
      outerLen = 3.5;
    } else if (w <= 65) { // honbaek preview
      t = 0.75;
      m = 4.0;
      sqSize = 3.5;
      innerLen = 4.0;
      outerLen = 6.0;
    }

    const getCornerPathString = (x: number, y: number, dx: number, dy: number) => {
      const x0 = dx === 1 ? x : x - sqSize;
      const y0 = dy === 1 ? y : y - sqSize;
      
      const sqPath = `M ${x0} ${y0} h ${sqSize} v ${sqSize} h -${sqSize} z`;

      const innerX = x0 + (dx === 1 ? sqSize : 0);
      const innerY = y0 + (dy === 1 ? sqSize : 0);
      const innerH = `M ${innerX} ${innerY} h ${dx * innerLen}`;
      const innerV = `M ${innerX} ${innerY} v ${dy * innerLen}`;

      const outerH = `M ${x} ${y + dy * outerLen} h ${dx * outerLen}`;
      const outerV = `M ${x + dx * outerLen} ${y} v ${dy * outerLen}`;

      return `${sqPath} ${innerH} ${innerV} ${outerH} ${outerV}`;
    };

    const dPath = [
      getCornerPathString(m, m, 1, 1),
      getCornerPathString(w - m, m, -1, 1),
      getCornerPathString(m, h - m, 1, -1),
      getCornerPathString(w - m, h - m, -1, -1),
      `M ${m + outerLen} ${m} H ${w - m - outerLen}`,
      `M ${m + outerLen} ${h - m} H ${w - m - outerLen}`,
      `M ${m} ${m + outerLen} V ${h - m - outerLen}`,
      `M ${w - m} ${m + outerLen} V ${h - m - outerLen}`
    ].join(' ');

    return `
      <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">
        <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="#1a1311" stroke-width="0.75" shape-rendering="geometricPrecision" />
        <path d="${dPath}" fill="none" stroke="#1a1311" stroke-width="${t}" stroke-linecap="square" stroke-linejoin="miter" shape-rendering="geometricPrecision" />
      </svg>
    `;
  }
  if (skin === 'scallop') {
    let strokeW = 1.5;
    if (w <= 25) strokeW = 0.75;
    else if (w <= 65) strokeW = 1.0;

    return `
      <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">
        <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="#1a1311" stroke-width="${strokeW}" shape-rendering="geometricPrecision" />
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
  // 3-1. 위패 문자 선택 상태 ('korean': 한글, 'hanja': 漢文)
  const [wipaeTextType, setWipaeTextType] = useState<'korean' | 'hanja'>('hanja');

  // 고인 정보 상태
  const [deceasedName, setDeceasedName] = useState('');
  const [relationship, setRelationship] = useState('아버지');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  // 모달 팝업 상태
  const [isDeceasedModalOpen, setIsDeceasedModalOpen] = useState(false);

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
    religion,
  });

  const buildTabletColumns = (isWipae: boolean) => {
    const isChristianOrCatholic = religion === 'christian' || religion === 'catholic';
    const isKorean = wipaeTextType === 'korean';

    const translate = (str: string) => {
      if (!isKorean) return str;
      const dict: Record<string, string> = {
        '顯考': '현고', '顯妣': '현비', '顯祖考': '현조고', '顯祖妣': '현조비',
        '顯曾祖考': '현증조고', '顯曾祖妣': '현증조비', '亡夫': '망부', '亡室': '망실',
        '顯兄': '현형', '亡子': '망자', '亡婦': '망부',
        '學生': '학생', '孺人': '유인', '府君': '부군',
        '神位': '신위', '靈駕': '영가', '安息': '안식',
        '氏': '씨'
      };
      return dict[str] || str;
    };

    if (isChristianOrCatholic) {
      // 1. 기독교/천주교 룰
      const mainLines: string[] = [];
      if (religion === 'catholic') {
        mainLines.push('선종');
      } else {
        mainLines.push('故');
      }
      if (christianTitle && christianTitle !== '선택 안 함') {
        const titleParts = christianTitle.split('/');
        const titleStr = wipaeTextType === 'hanja' && titleParts[1] ? titleParts[1] : titleParts[0];
        if (titleStr) {
          mainLines.push(titleStr);
        }
      }
      mainLines.push(deceasedName);
      
      if (endingWord !== '없음') {
        const ending = endingWord === '安息' 
          ? (wipaeTextType === 'hanja' ? '安息' : '안식')
          : endingWord === '神位'
          ? (wipaeTextType === 'hanja' ? '神位' : '신위')
          : endingWord === '靈駕'
          ? (wipaeTextType === 'hanja' ? '靈駕' : '영가')
          : endingWord;
        mainLines.push(ending);
      }

      const mainCol = {
        type: 'main' as const,
        chars: mainLines.join('').split(''),
        showCross: true,
      };

      // 혼백명패는 극도로 좁으므로 무조건 main 열만 반환
      if (jibangSize === 'honbaek') {
        return [mainCol];
      }

      const cols: any[] = [];
      const showPhrase = christianPhrase !== '없음';

      // Left phrase column (빛기도)
      if (showPhrase) {
        cols.push({
          type: 'phrase' as const,
          chars: '영원한빛을그에게비추소서'.split(''),
          side: 'left' as const,
          showCross: false,
        });
      }

      // Main column
      cols.push(mainCol);

      // Right phrase column (안식기도)
      if (showPhrase) {
        cols.push({
          type: 'phrase' as const,
          chars: '주님그에게영원한안식을주소서'.split(''),
          side: 'right' as const,
          showCross: false,
        });
      }



      return cols;
    } else {
      // 2. 일반/불교 룰
      if (jibangSize === 'honbaek') {
        // 혼백·명패 크기는 극도로 좁아서 1열로만 렌더링
        const lines = isWipae ? wipaeResult.lines : jibangResult.lines;
        const translatedLines = lines.map(translate);
        return [{
          type: 'hanja' as const,
          chars: translatedLines.join('').split(''),
        }];
      }

      // 일반적인 크기 (87x248mm 등)는 2열 구성 (우측: 한자, 좌측: 한글이름)
      const title = RELATIONSHIP_TITLE[relationship] || '顯考';
      const pos = gender === 'male' ? '學生' : '孺人';
      
      const hanjaLines: string[] = [translate(title), translate(pos)];
      if (gender === 'male') {
        hanjaLines.push(translate('府君'));
      }
      if (endingWord !== '없음') {
        hanjaLines.push(translate(endingWord));
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
    const borderSvgHtml = getBorderSvgString(widthCm * 10, heightCm * 10, jibangSize === 'honbaek' ? 'none' : borderSkin);

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
          top: -4mm; left: -4mm; right: -4mm; bottom: -4mm;
          border: 2px dashed #ccc;
          border-radius: 4px;
        }
        .cutlabel {
          position: absolute;
          top: -9mm; left: 50%; transform: translateX(-50%);
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
          flex: none;
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
          font-size: ${jibangSize === 'christian_catholic' ? '15' : '18'}px;
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
            <div style="display: flex; width: 100%; align-items: stretch; justify-content: center; gap: 16px; position: relative; z-index: 1;">
              ${columns.map((col: any) => {
                if (col.type === 'phrase') {
                  const isLeft = col.side === 'left';
                  const isCatholicSize = jibangSize === 'christian_catholic';
                  const offsetVal = isCatholicSize ? '12.5mm' : '15mm';
                  const positionStyle = isLeft ? `left: ${offsetVal};` : `right: ${offsetVal};`;
                  return `
                    <div class="column" style="position: absolute; ${positionStyle} top: 12%; bottom: 12%; justify-content: center; flex: none;">
                      ${col.chars.map((c: string) => `<div class="phrase-char">${c}</div>`).join('')}
                    </div>
                  `;
                }
                if (col.type === 'name') {
                  return `
                    <div class="column" style="justify-content: center; gap: 20px; flex: none;">
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
            <option value="general">일반</option>
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

              {jibangSize !== 'honbaek' && (
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
              )}

              <div style={{ marginTop: '12px' }}>
                <label className={styles.formLabel}>문자 표기</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="wipaeTextType"
                      checked={wipaeTextType === 'hanja'}
                      onChange={() => setWipaeTextType('hanja')}
                      style={{ accentColor: 'var(--b2b-accent)' }}
                    />
                    漢文
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="wipaeTextType"
                      checked={wipaeTextType === 'korean'}
                      onChange={() => setWipaeTextType('korean')}
                      style={{ accentColor: 'var(--b2b-accent)' }}
                    />
                    한글
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 고인 정보 섹션 */}
        <div style={{ border: '1px solid var(--b2b-border-light)', borderRadius: '8px', padding: '14px', marginBottom: '16px', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--b2b-text-primary)' }}>
              대상 고인 정보
            </span>
            <button
              onClick={() => setIsDeceasedModalOpen(true)}
              style={{
                background: 'none',
                border: '1px solid var(--b2b-accent)',
                borderRadius: '4px',
                color: 'var(--b2b-accent)',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 8px',
                cursor: 'pointer'
              }}
            >
              수정하기
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#555' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>고인 성함</span>
              <span style={{ fontWeight: 600, color: '#222' }}>{deceasedName || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>관계</span>
              <span style={{ fontWeight: 600, color: '#222' }}>{relationship || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>성별</span>
              <span style={{ fontWeight: 600, color: '#222' }}>{gender === 'male' ? '남성' : '여성'}</span>
            </div>
            {(religion === 'christian' || religion === 'catholic') && christianTitle && christianTitle !== '선택 안 함' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>직분</span>
                <span style={{ fontWeight: 600, color: '#222' }}>{christianTitle}</span>
              </div>
            )}
          </div>

          {/* 기독교/천주교일 경우 측면 기도 문구 선택 드롭다운은 설정 폼 아래에 계속 노출 */}
          {(religion === 'christian' || religion === 'catholic') && (
            <div className={styles.formGroup} style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
              <label className={styles.formLabel}>측면 기도 문구</label>
              <select
                className={styles.formSelect}
                value={christianPhrase}
                onChange={(e) => setChristianPhrase(e.target.value as typeof christianPhrase)}
              >
                <option value="전체기도">기도문구 표시 ("영원한 빛을..." / "주님 그에게...")</option>
                <option value="없음">표시 안 함 (본체만 출력)</option>
              </select>
            </div>
          )}
        </div>

        {/* 고인 정보 수정 모달 팝업 */}
        {isDeceasedModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '360px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#111', display: 'block', marginBottom: '16px' }}>
                대상 고인 정보 수정
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                      onChange={(e) => {
                        const newRel = e.target.value;
                        setRelationship(newRel);
                        const mapped = RELATION_GENDER[newRel];
                        if (mapped) {
                          setGender(mapped);
                        }
                      }}
                    >
                      <option value="아버지">아버지</option>
                      <option value="어머니">어머니</option>
                      <option value="할아버지">할아버지</option>
                      <option value="할머니">할머니</option>
                      <option value="남편">남편</option>
                      <option value="아내">아내</option>
                      <option value="형">형</option>
                      <option value="동생">동생</option>
                      <option value="아들">아들</option>
                      <option value="딸">딸</option>
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.formLabel}>성별</label>
                    <select
                      className={styles.formSelect}
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                      disabled={!!RELATION_GENDER[relationship]}
                      style={{ backgroundColor: RELATION_GENDER[relationship] ? '#f5f5f5' : '#fff' }}
                    >
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                    </select>
                  </div>
                </div>

                {(religion === 'christian' || religion === 'catholic') && (
                  <div className={styles.formGroup}>
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
                )}

              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  onClick={() => setIsDeceasedModalOpen(false)}
                  style={{
                    flex: 1, height: '44px', border: '1px solid #ccc', borderRadius: '6px',
                    backgroundColor: '#fff', fontSize: '14px', fontWeight: 600, color: '#666',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => setIsDeceasedModalOpen(false)}
                  style={{
                    flex: 1, height: '44px', border: 'none', borderRadius: '6px',
                    backgroundColor: 'var(--b2b-accent)', fontSize: '14px', fontWeight: 600, color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 축문 설정 섹션 */}
        {activeTab === 'chukmun' && (
          <div style={{ border: '1px solid var(--b2b-border-light)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--b2b-text-primary)', display: 'block', marginBottom: '12px' }}>
              축문 설정
            </span>
            
            <div className={styles.formGroup}>
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
                  padding: '30px 12px 22px 12px',
                  position: 'relative',
                }}
              >
                {renderBorderSvg(
                  jibangSize === 'honbaek' ? 60 : jibangSize === 'christian_catholic' ? 105 : 140,
                  jibangSize === 'honbaek' ? 320 : jibangSize === 'christian_catholic' ? 333 : 370,
                  jibangSize === 'honbaek' ? 'none' : borderSkin
                )}
                <div style={{ display: 'flex', width: '100%', alignItems: 'stretch', justifyContent: 'center', gap: jibangSize === 'honbaek' ? '0px' : '6px', height: '100%', position: 'relative', zIndex: 1 }}>
                  {(() => {
                    const cols = buildTabletColumns(true);
                    const isSingleColumn = cols.length === 1;
                    return cols.map((col: any, cIdx: number) => {
                      if (col.type === 'phrase') {
                        const isLeft = col.side === 'left';
                        const isCatholicSize = jibangSize === 'christian_catholic';
                        const offsetPx = isCatholicSize ? '13px' : '16px';
                        return (
                          <div key={cIdx} style={{
                            position: 'absolute',
                            [isLeft ? 'left' : 'right']: offsetPx,
                            top: '12%',
                            bottom: '12%',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isCatholicSize ? '9px' : '11px',
                            color: '#333', fontWeight: 500,
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
                            fontSize: jibangSize === 'christian_catholic' ? '8px' : '10px',
                            color: '#777', fontWeight: 500,
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
                                 <div key={i} style={{ fontSize: jibangSize === 'honbaek' ? '12px' : jibangSize === 'christian_catholic' ? '18px' : '22px', fontWeight: 700, color: '#1a1311', fontFamily: "'Batang', 'Nanum Myeongjo', serif" }}>
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
                          <div key={cIdx} className={styles.jibangColumn} style={{ flex: 'none', borderRight: 'none', paddingRight: '0' }}>
                            {religion === 'christian' && (
                              <svg width="16" height="22" viewBox="0 0 20.5 28.2" fill="none" style={{ marginBottom: '6px' }}>
                                <path d="M 7.681,28.162 L 7.681,12.801 L 0.0,12.801 L 0.0,7.681 L 7.681,7.681 L 7.681,0.0 L 12.801,0.0 L 12.801,7.681 L 20.481,7.681 L 20.481,12.801 L 12.800,12.801 L 12.800,28.162 Z" fill="#de0615"/>
                              </svg>
                            )}
                            {religion === 'catholic' && (
                              <svg width="18" height="24" viewBox="0 0 25.8 34.0" fill="none" style={{ marginBottom: '6px' }}>
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
                                      fontSize: jibangSize === 'honbaek' ? '11px' : jibangSize === 'christian_catholic' ? '16px' : '19px',
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
                              <svg width="22" height="22" viewBox="0 0 24.8 24.8" fill="none" style={{ marginBottom: '6px' }}>
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
                                      fontSize: jibangSize === 'honbaek' ? '11px' : jibangSize === 'christian_catholic' ? '16px' : '19px',
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
