/**
 * 부고장 장례 정보 표시 로직 — 단위 테스트
 * 
 * 실행: cd jojo && npx jest __tests__/funeral-display.test.ts
 */
import {
  isNormalFuneral,
  isNoCeremony,
  isFamilyFuneral,
  shouldShowEncoffin,
  shouldShowFuneral,
  shouldShowIlpo,
  shouldShowBurialPlace,
  shouldShowFuneralHomeBox,
  shouldShowMap,
  shouldShowFlowerSection,
  getCeremonyLabel,
  getFuneralLocationText,
  FUNERAL_TYPES,
} from '../lib/funeral-display';

// ── isNormalFuneral ─────────────────────────────────────────────
describe('isNormalFuneral', () => {
  it('null/undefined/빈값은 일반 장례', () => {
    expect(isNormalFuneral(null)).toBe(true);
    expect(isNormalFuneral(undefined)).toBe(true);
    expect(isNormalFuneral('')).toBe(true);
    expect(isNormalFuneral('  ')).toBe(true);
  });

  it('"일반 장례"(공백 있음) → true', () => {
    expect(isNormalFuneral('일반 장례')).toBe(true);
  });

  it('"일반장례"(공백 없음) → true (B2B 호환)', () => {
    expect(isNormalFuneral('일반장례')).toBe(true);
  });

  it('가족장 → false', () => {
    expect(isNormalFuneral('가족장')).toBe(false);
  });

  it('무빈소장례 → false', () => {
    expect(isNormalFuneral('무빈소장례')).toBe(false);
  });
});

// ── isNoCeremony ────────────────────────────────────────────────
describe('isNoCeremony', () => {
  it('무빈소장례 → true', () => {
    expect(isNoCeremony('무빈소장례')).toBe(true);
  });

  it('일반 장례 → false', () => {
    expect(isNoCeremony('일반 장례')).toBe(false);
  });

  it('null → false', () => {
    expect(isNoCeremony(null)).toBe(false);
  });
});

// ── shouldShowEncoffin (입관) ───────────────────────────────────
describe('shouldShowEncoffin', () => {
  it('B2C에서는 절대 표시 안 함', () => {
    expect(shouldShowEncoffin('2026-01-01', 'b2c')).toBe(false);
    expect(shouldShowEncoffin(null, 'b2c')).toBe(false);
  });

  it('B2B에서 encoffin_date 있으면 표시', () => {
    expect(shouldShowEncoffin('2026-01-01', 'b2b')).toBe(true);
  });

  it('B2B에서 encoffin_date 없으면 숨김', () => {
    expect(shouldShowEncoffin(null, 'b2b')).toBe(false);
    expect(shouldShowEncoffin('', 'b2b')).toBe(false);
  });

  it('기본 context는 b2c', () => {
    expect(shouldShowEncoffin('2026-01-01')).toBe(false);
  });
});

// ── shouldShowFuneral (발인) ────────────────────────────────────
describe('shouldShowFuneral', () => {
  it('일반 장례 + 날짜 있음 → 표시', () => {
    expect(shouldShowFuneral({ funeralType: '일반 장례', funeralDate: '2026-01-01' })).toBe(true);
  });

  it('무빈소장례 → 숨김', () => {
    expect(shouldShowFuneral({ funeralType: '무빈소장례', funeralDate: '2026-01-01' })).toBe(false);
  });

  it('hide_funeral → 숨김', () => {
    expect(shouldShowFuneral({ funeralType: '일반 장례', funeralDate: '2026-01-01', hideFuneral: true })).toBe(false);
  });

  it('날짜 없음 → 숨김', () => {
    expect(shouldShowFuneral({ funeralType: '일반 장례', funeralDate: null })).toBe(false);
  });

  it('가족장 + 날짜 있음 → 표시', () => {
    expect(shouldShowFuneral({ funeralType: '가족장', funeralDate: '2026-01-01' })).toBe(true);
  });
});

// ── shouldShowIlpo (일포) ───────────────────────────────────────
describe('shouldShowIlpo', () => {
  it('일반 장례 + 날짜 있음 → 표시', () => {
    expect(shouldShowIlpo({ funeralType: '일반 장례', ilpoDate: '2026-01-01' })).toBe(true);
  });

  it('무빈소장례 → 숨김', () => {
    expect(shouldShowIlpo({ funeralType: '무빈소장례', ilpoDate: '2026-01-01' })).toBe(false);
  });

  it('날짜 없음 → 숨김', () => {
    expect(shouldShowIlpo({ funeralType: '일반 장례', ilpoDate: null })).toBe(false);
  });
});

// ── shouldShowBurialPlace (장지) ────────────────────────────────
describe('shouldShowBurialPlace', () => {
  it('일반 장례 + 값 있음 → 표시', () => {
    expect(shouldShowBurialPlace({ funeralType: '일반 장례', burialPlace: '서울추모공원' })).toBe(true);
  });

  it('무빈소장례 → 숨김', () => {
    expect(shouldShowBurialPlace({ funeralType: '무빈소장례', burialPlace: '서울추모공원' })).toBe(false);
  });

  it('값 없음 → 숨김', () => {
    expect(shouldShowBurialPlace({ funeralType: '일반 장례', burialPlace: null })).toBe(false);
  });

  it('가족장 + 값 있음 → 표시', () => {
    expect(shouldShowBurialPlace({ funeralType: '가족장', burialPlace: '서울추모공원' })).toBe(true);
  });
});

// ── shouldShowFuneralHomeBox (빈소 박스) ────────────────────────
describe('shouldShowFuneralHomeBox', () => {
  it('일반 장례 + 장례식장 있음 → 표시', () => {
    expect(shouldShowFuneralHomeBox({ funeralType: '일반 장례', funeralHome: '서울병원장례식장' })).toBe(true);
  });

  it('"일반장례"(B2B, 공백없음) + 장례식장 있음 → 표시', () => {
    expect(shouldShowFuneralHomeBox({ funeralType: '일반장례', funeralHome: '서울병원장례식장' })).toBe(true);
  });

  it('무빈소장례 → 숨김', () => {
    expect(shouldShowFuneralHomeBox({ funeralType: '무빈소장례', funeralHome: '서울병원장례식장' })).toBe(false);
  });

  it('가족장 → 숨김', () => {
    expect(shouldShowFuneralHomeBox({ funeralType: '가족장', funeralHome: '서울병원장례식장' })).toBe(false);
  });

  it('장례식장 없음 → 숨김', () => {
    expect(shouldShowFuneralHomeBox({ funeralType: '일반 장례', funeralHome: null })).toBe(false);
  });
});

// ── shouldShowMap (빈소 오시는 길) ──────────────────────────────
describe('shouldShowMap', () => {
  it('일반 장례 → 표시', () => {
    expect(shouldShowMap('일반 장례')).toBe(true);
  });

  it('"일반장례"(B2B) → 표시', () => {
    expect(shouldShowMap('일반장례')).toBe(true);
  });

  it('null → 표시 (일반 장례 취급)', () => {
    expect(shouldShowMap(null)).toBe(true);
  });

  it('무빈소장례 → 숨김', () => {
    expect(shouldShowMap('무빈소장례')).toBe(false);
  });

  it('가족장 → 숨김', () => {
    expect(shouldShowMap('가족장')).toBe(false);
  });
});

// ── shouldShowFlowerSection (화환) ──────────────────────────────
describe('shouldShowFlowerSection', () => {
  it('일반 장례 → 표시', () => {
    expect(shouldShowFlowerSection({ funeralType: '일반 장례' })).toBe(true);
  });

  it('"일반장례"(B2B) → 표시', () => {
    expect(shouldShowFlowerSection({ funeralType: '일반장례' })).toBe(true);
  });

  it('무빈소장례 → 숨김', () => {
    expect(shouldShowFlowerSection({ funeralType: '무빈소장례' })).toBe(false);
  });

  it('hideFlowerOrder → 숨김', () => {
    expect(shouldShowFlowerSection({ funeralType: '일반 장례', hideFlowerOrder: true })).toBe(false);
  });
});

// ── getCeremonyLabel (빈소 라벨) ────────────────────────────────
describe('getCeremonyLabel', () => {
  it('가족장 → "가족장"', () => {
    expect(getCeremonyLabel('가족장')).toBe('가족장');
  });

  it('무빈소장례 → "무빈소"', () => {
    expect(getCeremonyLabel('무빈소장례')).toBe('무빈소');
  });

  it('일반 장례 → null', () => {
    expect(getCeremonyLabel('일반 장례')).toBeNull();
  });

  it('null → null', () => {
    expect(getCeremonyLabel(null)).toBeNull();
  });
});

// ── getFuneralLocationText (알림용) ─────────────────────────────
describe('getFuneralLocationText', () => {
  it('일반 장례 → 장례식장 + 호실', () => {
    expect(getFuneralLocationText({ funeralType: '일반 장례', funeralHome: '서울병원', roomNumber: '3호실' }))
      .toBe('서울병원 3호실');
  });

  it('가족장 → "가족장"', () => {
    expect(getFuneralLocationText({ funeralType: '가족장', funeralHome: '서울병원', roomNumber: '3호실' }))
      .toBe('가족장');
  });

  it('무빈소장례 → "무빈소장례"', () => {
    expect(getFuneralLocationText({ funeralType: '무빈소장례', funeralHome: null, roomNumber: null }))
      .toBe('무빈소장례');
  });
});
