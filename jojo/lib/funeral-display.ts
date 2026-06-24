/**
 * 부고장 장례 정보 표시 로직 — 공통 유틸리티
 * 
 * 이 파일은 B2C, B2B, 레거시 뷰어에서 공통으로 사용하는
 * 장례 정보 표시 판단 함수들을 제공합니다.
 * 
 * ⚠️ 수정 시 반드시 __tests__/funeral-display.test.ts 테스트를 실행하세요.
 * ⚠️ B2C와 B2B의 차이점:
 *   - 입관(encoffin): B2C ❌ 숨김 / B2B ✅ 값 있으면 표시
 *   - 가족장 옵션: B2C ✅ 있음 / B2B ❌ 없음 (현재)
 */

// ── 장례 타입 상수 ──────────────────────────────────────────────
export const FUNERAL_TYPES = {
  /** B2C에서 사용하는 일반 장례 값 (공백 있음) */
  NORMAL: '일반 장례',
  /** B2B에서 사용하는 일반 장례 값 (공백 없음) — DB 불일치 주의 */
  NORMAL_B2B: '일반장례',
  /** 가족장 */
  FAMILY: '가족장',
  /** 무빈소장례 */
  NO_CEREMONY: '무빈소장례',
} as const;

// ── 판단 함수 ──────────────────────────────────────────────────

/**
 * 일반 장례인지 판단
 * - null, undefined, 빈 문자열 → 일반 장례 취급
 * - '일반 장례'(공백 있음) AND '일반장례'(공백 없음) 모두 매칭
 */
export function isNormalFuneral(funeralType?: string | null): boolean {
  if (!funeralType || funeralType.trim() === '') return true;
  const normalized = funeralType.replace(/\s/g, '');
  return normalized === '일반장례';
}

/**
 * 무빈소장례인지 판단
 */
export function isNoCeremony(funeralType?: string | null): boolean {
  return funeralType === FUNERAL_TYPES.NO_CEREMONY;
}

/**
 * 가족장인지 판단
 */
export function isFamilyFuneral(funeralType?: string | null): boolean {
  return funeralType === FUNERAL_TYPES.FAMILY;
}

/**
 * 입관(encoffin) 표시 여부
 * - B2C: 절대 표시하지 않음
 * - B2B: encoffin_date가 있을 때만 표시
 */
export function shouldShowEncoffin(
  encoffinDate?: string | null,
  context: 'b2c' | 'b2b' = 'b2c'
): boolean {
  if (context === 'b2c') return false;
  return !!encoffinDate;
}

/**
 * 발인 표시 여부
 * - 무빈소장례이면 숨김
 * - hide_funeral이 true이면 숨김
 * - funeral_date가 없으면 숨김
 */
export function shouldShowFuneral(opts: {
  funeralType?: string | null;
  funeralDate?: string | null;
  hideFuneral?: boolean;
}): boolean {
  if (!opts.funeralDate) return false;
  if (opts.hideFuneral) return false;
  if (isNoCeremony(opts.funeralType)) return false;
  return true;
}

/**
 * 일포(ilpo) 표시 여부
 * - 무빈소장례이면 숨김
 * - ilpo_date가 없으면 숨김
 */
export function shouldShowIlpo(opts: {
  funeralType?: string | null;
  ilpoDate?: string | null;
}): boolean {
  if (!opts.ilpoDate) return false;
  if (isNoCeremony(opts.funeralType)) return false;
  return true;
}

/**
 * 장지(burial place) 표시 여부
 * - 무빈소장례이면 숨김
 * - burial_place가 없으면 숨김
 */
export function shouldShowBurialPlace(opts: {
  funeralType?: string | null;
  burialPlace?: string | null;
}): boolean {
  if (!opts.burialPlace) return false;
  if (isNoCeremony(opts.funeralType)) return false;
  return true;
}

/**
 * 빈소 박스(장례식장 이름 + 호실) 표시 여부
 * - 일반 장례만 표시 (무빈소, 가족장은 숨김)
 * - funeral_home 값이 있어야 표시
 */
export function shouldShowFuneralHomeBox(opts: {
  funeralType?: string | null;
  funeralHome?: string | null;
}): boolean {
  if (!opts.funeralHome) return false;
  return isNormalFuneral(opts.funeralType);
}

/**
 * 빈소 오시는 길 (지도) 표시 여부
 * - 일반 장례만 표시
 */
export function shouldShowMap(funeralType?: string | null): boolean {
  return isNormalFuneral(funeralType);
}

/**
 * 화환 보내기 섹션 표시 여부
 * - 일반 장례만 표시
 * - hide_flower_order가 true이면 숨김
 */
export function shouldShowFlowerSection(opts: {
  funeralType?: string | null;
  hideFlowerOrder?: boolean;
}): boolean {
  if (opts.hideFlowerOrder) return false;
  return isNormalFuneral(opts.funeralType);
}

/**
 * 빈소 라벨 텍스트 반환
 * - 가족장 → "가족장"
 * - 무빈소장례 → "무빈소"
 * - 그 외 → null (별도 표시 불필요)
 */
export function getCeremonyLabel(funeralType?: string | null): string | null {
  if (isFamilyFuneral(funeralType)) return '가족장';
  if (isNoCeremony(funeralType)) return '무빈소';
  return null;
}

/**
 * 알림 API용: 장례 장소 텍스트 생성
 */
export function getFuneralLocationText(opts: {
  funeralType?: string | null;
  funeralHome?: string | null;
  roomNumber?: string | null;
}): string {
  if (isFamilyFuneral(opts.funeralType) || isNoCeremony(opts.funeralType)) {
    return opts.funeralType || '';
  }
  return `${opts.funeralHome || ''} ${opts.roomNumber || ''}`.trim();
}
