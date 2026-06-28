/**
 * 간지(干支) 계산 엔진
 *
 * 천간(天干)과 지지(地支)를 조합하여 연·월·일의 간지를 계산합니다.
 * 60갑자 순환 체계를 기반으로 한자와 한글 읽기를 함께 반환합니다.
 */

// ─── 상수 ────────────────────────────────────────────────────────

/** 천간(天干) 10자 — 하늘의 줄기 */
const CHEONGAN_HANJA = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
] as const;

const CHEONGAN_KOREAN = [
  '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계',
] as const;

/** 지지(地支) 12자 — 땅의 가지 */
const JIJI_HANJA = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const;

const JIJI_KOREAN = [
  '자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해',
] as const;

// ─── 타입 ────────────────────────────────────────────────────────

/** 간지 결과 (한자 + 한글) */
export interface GanjiResult {
  /** 한자 간지 (예: '丙午') */
  hanja: string;
  /** 한글 간지 (예: '병오') */
  korean: string;
}

/** 연·월·일 전체 간지 */
export interface FullGanjiDate {
  year: GanjiResult;
  month: GanjiResult;
  day: GanjiResult;
}

// ─── 유틸리티 ────────────────────────────────────────────────────

/**
 * 음수 대응 안전한 모듈로 연산
 * JavaScript의 % 연산자는 음수에 대해 음수를 반환하므로 보정합니다.
 */
function safeMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// ─── 핵심 함수 ───────────────────────────────────────────────────

/**
 * 연도의 간지를 계산합니다.
 *
 * 계산 공식:
 * - 천간 인덱스 = (year - 4) % 10
 * - 지지 인덱스 = (year - 4) % 12
 *
 * @param year 서력 연도 (예: 2026)
 * @returns 한자·한글 간지 (예: { hanja: '丙午', korean: '병오' })
 *
 * @example
 * getYearGanji(2026) // → { hanja: '丙午', korean: '병오' }
 * getYearGanji(2024) // → { hanja: '甲辰', korean: '갑진' }
 */
export function getYearGanji(year: number): GanjiResult {
  const stemIndex = safeMod(year - 4, 10);
  const branchIndex = safeMod(year - 4, 12);

  return {
    hanja: CHEONGAN_HANJA[stemIndex] + JIJI_HANJA[branchIndex],
    korean: CHEONGAN_KOREAN[stemIndex] + JIJI_KOREAN[branchIndex],
  };
}

/**
 * 월 간지를 계산합니다.
 *
 * 연도의 천간에 따라 월의 천간 시작점이 결정됩니다:
 * - 甲·己년 → 丙寅월부터 시작 (천간 인덱스 2)
 * - 乙·庚년 → 戊寅월부터 시작 (천간 인덱스 4)
 * - 丙·辛년 → 庚寅월부터 시작 (천간 인덱스 6)
 * - 丁·壬년 → 壬寅월부터 시작 (천간 인덱스 8)
 * - 戊·癸년 → 甲寅월부터 시작 (천간 인덱스 0)
 *
 * 지지는 1월 = 寅(인덱스 2)부터 시작하여 순환합니다.
 *
 * @param year  서력 연도
 * @param month 양력 월 (1~12)
 */
export function getMonthGanji(year: number, month: number): GanjiResult {
  const yearStemIndex = safeMod(year - 4, 10);

  // 연간(年干)에 따른 1월(寅月) 천간 시작 인덱스
  const monthStartStem = ((yearStemIndex % 5) * 2 + 2) % 10;
  const stemIndex = (monthStartStem + (month - 1)) % 10;

  // 지지: 1월 = 寅(2), 2월 = 卯(3), ..., 11월 = 子(0), 12월 = 丑(1)
  const branchIndex = (month + 1) % 12;

  return {
    hanja: CHEONGAN_HANJA[stemIndex] + JIJI_HANJA[branchIndex],
    korean: CHEONGAN_KOREAN[stemIndex] + JIJI_KOREAN[branchIndex],
  };
}

/**
 * 일 간지를 계산합니다.
 *
 * 기준일: 1900년 1월 1일 = 庚子일 (천간 6, 지지 0)
 * 기준일로부터의 경과 일수를 이용하여 천간·지지 인덱스를 구합니다.
 *
 * @param year  서력 연도
 * @param month 양력 월 (1~12)
 * @param day   양력 일 (1~31)
 */
export function getDayGanji(year: number, month: number, day: number): GanjiResult {
  // 기준일: 1900-01-01 (庚子일)
  const reference = new Date(1900, 0, 1);
  const target = new Date(year, month - 1, day);

  // 밀리초 → 일수 변환 (DST 보정을 위해 반올림)
  const daysDiff = Math.round(
    (target.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 기준일의 간지: 庚(6)子(0)
  const stemIndex = safeMod(6 + daysDiff, 10);
  const branchIndex = safeMod(0 + daysDiff, 12);

  return {
    hanja: CHEONGAN_HANJA[stemIndex] + JIJI_HANJA[branchIndex],
    korean: CHEONGAN_KOREAN[stemIndex] + JIJI_KOREAN[branchIndex],
  };
}

/**
 * Date 객체로부터 연·월·일 전체 간지를 한 번에 반환합니다.
 *
 * @param date JavaScript Date 객체
 */
export function getFullGanjiDate(date: Date): FullGanjiDate {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return {
    year: getYearGanji(year),
    month: getMonthGanji(year, month),
    day: getDayGanji(year, month, day),
  };
}
