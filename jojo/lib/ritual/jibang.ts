/**
 * 지방(紙榜) 생성 로직
 *
 * 제사 시 신위를 모시기 위해 종이에 쓰는 지방의 내용을 자동 생성합니다.
 * 종교별(일반, 불교, 기독교, 천주교) 및 성별·관계에 따라
 * 전통 및 현대 양식에 맞는 단설 문구를 구성합니다. (쌍설 지원 안 함)
 */

// ─── 타입 ────────────────────────────────────────────────────────

/** 지방 생성 입력 (단설 전용) */
export interface JibangInput {
  /** 고인 이름 */
  deceasedName: string;
  /** 고인과의 관계 (아버지, 어머니, 할아버지 등) */
  relationship: string;
  /** 고인 성별 */
  gender: 'male' | 'female';
  /** 본관 (여성 고인용, 예: '김해') */
  bonGwan?: string;
  /** 성씨 (여성 고인용, 예: '김') */
  familyName?: string;

  // 종교별 세부 옵션
  /** 종교 구분 */
  religion?: 'general' | 'buddhism' | 'christian' | 'catholic';
  /** 기독교/천주교 직분 (예: 성도, 집사, 권사, 장로 등) */
  christianTitle?: string;
  /** 세례명 (천주교/기독교용, 예: '데레사', '요한') */
  baptismName?: string;
  /** 종교적 맺음말 ('神位': 신위, '靈駕': 영가, '安息': 안식, '없음') */
  endingWord?: '神位' | '靈駕' | '安息' | '없음';
  /** 기독교/천주교 측면 기도문구 */
  christianPhrase?: '안식기도' | '빛기도' | '없음';
}

/** 지방 생성 결과 */
export interface JibangResult {
  /** 지방 전체 텍스트 */
  fullText: string;
  /** 각 줄의 텍스트 배열 (세로 쓰기 기준) */
  lines: string[];
  /** 기독교/천주교 측면 기도문구 라인 */
  phraseLines?: string[];
  /** 메타 정보 */
  meta: {
    width: number;
    height: number;
    roundedTop: boolean;
    type: 'jibang' | 'honbaek';
    religion: 'general' | 'buddhism' | 'christian' | 'catholic';
  };
}

// ─── 상수 ────────────────────────────────────────────────────────

/** 관계별 호칭(漢字) 매핑 */
export const RELATIONSHIP_TITLE: Record<string, string> = {
  '아버지': '顯考',
  '어머니': '顯妣',
  '할아버지': '顯祖考',
  '할머니': '顯祖妣',
  '증조부': '顯曾祖考',
  '증조모': '顯曾祖妣',
  '남편': '亡夫',
  '아내': '亡室',
  '형': '顯兄',
  '아들': '亡子',
  '며느리': '亡婦',
};

// ─── 유틸리티 ────────────────────────────────────────────────────

/**
 * 1인의 지방 문구 라인을 빌드합니다. (종교별 룰 완벽 반영)
 */
export function buildSingleJibangLines(item: JibangInput): string[] {
  const religion = item.religion || 'general';
  const ending = item.endingWord || (religion === 'buddhism' ? '靈駕' : religion === 'christian' || religion === 'catholic' ? '安息' : '神位');

  // 1. 기독교 & 천주교 룰 (직분, 세례명 중심 한글 구성)
  if (religion === 'christian' || religion === 'catholic') {
    const parts: string[] = ['故'];
    
    // 직분 (예: 집사, 권사, 성도)
    if (item.christianTitle && item.christianTitle !== '선택 안 함') {
      parts.push(item.christianTitle);
    }
    
    // 세례명 (예: 요한, 데레사)
    if (item.baptismName) {
      parts.push(item.baptismName);
    }
    
    parts.push(item.deceasedName);
    
    if (ending !== '없음') {
      parts.push(ending === '安息' ? '안식' : ending);
    }
    
    return parts;
  }

  // 2. 일반 & 불교 룰 (전통 한자 뼈대 + 한글 이름)
  const title = RELATIONSHIP_TITLE[item.relationship] || '顯考';
  const pos = item.gender === 'male' ? '學生' : '孺人'; // 직위/벼슬은 전통 學生/孺人 고정

  const lines: string[] = [title, pos];

  if (item.gender === 'male') {
    lines.push(item.deceasedName, '府君');
  } else {
    if (item.bonGwan && item.familyName) {
      lines.push(`${item.bonGwan}${item.familyName}氏`);
    } else {
      lines.push(item.deceasedName);
    }
  }

  if (ending !== '없음') {
    lines.push(ending);
  }

  return lines;
}

/**
 * 기도문구(안식기도 / 빛기도) 한글 세로쓰기 배열 반환
 */
export function getPhraseLines(phrase: '안식기도' | '빛기도' | '없음'): string[] {
  if (phrase === '안식기도') {
    return ['주', '님', ' ', '그', '에', '게', ' ', '영', '원', '한', ' ', '안', '식', '을', ' ', '주', '소', '서'];
  }
  if (phrase === '빛기도') {
    return ['영', '원', '한', ' ', '빛', '을', ' ', '그', '에', '게', ' ', '비', '추', '소', '서'];
  }
  return [];
}

// ─── 핵심 함수 ───────────────────────────────────────────────────

/**
 * 지방(紙榜)을 생성합니다. (단설 전용)
 */
export function generateJibang(input: JibangInput): JibangResult {
  const religion = input.religion || 'general';
  const lines = buildSingleJibangLines(input);
  const phraseLines = (religion === 'christian' || religion === 'catholic')
    ? getPhraseLines(input.christianPhrase || '없음')
    : [];

  return {
    fullText: lines.join(' '),
    lines,
    phraseLines,
    meta: {
      width: 6,
      height: 22,
      roundedTop: true,
      type: 'jibang',
      religion,
    },
  };
}
