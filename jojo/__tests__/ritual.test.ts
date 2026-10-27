/**
 * 위패·축문·지방·간지 통합 테스트
 *
 * 각 라이브러리의 핵심 기능을 검증합니다:
 * - 간지: 연·월·일 간지 계산 정확성
 * - 지방: 관계별·성별 지방 생성
 * - 축문: 기제사 축문 양식 및 간지 날짜 포함
 * - 위패: 지방과 동일 텍스트, 다른 메타 정보
 */

import { getYearGanji, getMonthGanji, getDayGanji, getFullGanjiDate } from '../lib/ritual/ganji';
import { generateJibang } from '../lib/ritual/jibang';
import { generateChukmun } from '../lib/ritual/chukmun';
import { generateWipae } from '../lib/ritual/wipae';

// ─── 간지 계산 테스트 ────────────────────────────────────────────

describe('간지(干支) 계산', () => {
  describe('연도 간지', () => {
    test('2026년은 丙午년이다', () => {
      const result = getYearGanji(2026);
      expect(result.hanja).toBe('丙午');
      expect(result.korean).toBe('병오');
    });

    test('2024년은 甲辰년이다', () => {
      const result = getYearGanji(2024);
      expect(result.hanja).toBe('甲辰');
      expect(result.korean).toBe('갑진');
    });

    test('2023년은 癸卯년이다', () => {
      const result = getYearGanji(2023);
      expect(result.hanja).toBe('癸卯');
      expect(result.korean).toBe('계묘');
    });

    test('1984년은 甲子년이다', () => {
      const result = getYearGanji(1984);
      expect(result.hanja).toBe('甲子');
      expect(result.korean).toBe('갑자');
    });
  });

  describe('일 간지', () => {
    test('1900년 1월 1일은 庚子일이다 (기준일)', () => {
      const result = getDayGanji(1900, 1, 1);
      expect(result.hanja).toBe('庚子');
      expect(result.korean).toBe('경자');
    });

    test('1900년 1월 2일은 辛丑일이다', () => {
      const result = getDayGanji(1900, 1, 2);
      expect(result.hanja).toBe('辛丑');
      expect(result.korean).toBe('신축');
    });
  });

  describe('월 간지', () => {
    test('월 간지가 GanjiResult 형태로 반환된다', () => {
      const result = getMonthGanji(2026, 6);
      expect(result).toHaveProperty('hanja');
      expect(result).toHaveProperty('korean');
      expect(result.hanja.length).toBe(2);
      expect(result.korean.length).toBe(2);
    });
  });

  describe('전체 간지', () => {
    test('getFullGanjiDate가 year/month/day 모두 반환한다', () => {
      const date = new Date(2026, 5, 28); // 2026년 6월 28일
      const result = getFullGanjiDate(date);

      expect(result.year.hanja).toBe('丙午');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('day');
      expect(result.month).toHaveProperty('hanja');
      expect(result.day).toHaveProperty('hanja');
    });
  });
});

// ─── 지방 생성 테스트 ────────────────────────────────────────────

describe('지방(紙榜) 생성', () => {
  test('아버지 지방 — 남성 표준 양식', () => {
    const result = generateJibang({
      deceasedName: '홍길동',
      relationship: '아버지',
      gender: 'male',
    });

    expect(result.lines).toEqual(['顯考', '學生', '홍길동', '府君', '神位']);
    expect(result.fullText).toBe('顯考 學生 홍길동 府君 神位');
    expect(result.meta.type).toBe('jibang');
    expect(result.meta.width).toBe(6);
    expect(result.meta.height).toBe(22);
    expect(result.meta.roundedTop).toBe(true);
  });

  test('어머니 지방 — 여성 + 본관/성 있음', () => {
    const result = generateJibang({
      deceasedName: '김옥순',
      relationship: '어머니',
      gender: 'female',
      bonGwan: '김해',
      familyName: '김',
    });

    expect(result.lines).toEqual(['顯妣', '孺人', '김해김氏', '神位']);
    expect(result.fullText).toBe('顯妣 孺人 김해김氏 神位');
  });

  test('어머니 지방 — 여성 + 본관/성 없음 (이름 사용)', () => {
    const result = generateJibang({
      deceasedName: '박순이',
      relationship: '어머니',
      gender: 'female',
    });

    expect(result.lines).toEqual(['顯妣', '孺人', '박순이', '神位']);
    expect(result.fullText).toBe('顯妣 孺人 박순이 神位');
  });

  test('할아버지 지방', () => {
    const result = generateJibang({
      deceasedName: '홍판서',
      relationship: '할아버지',
      gender: 'male',
    });

    expect(result.lines[0]).toBe('顯祖考');
  });
});

// ─── 축문 생성 테스트 ────────────────────────────────────────────

describe('축문(祝文) 생성', () => {
  test('기제사 축문 — 표준 양식', () => {
    const result = generateChukmun({
      date: new Date(2026, 5, 28), // 2026년 6월 28일
      deceasedName: '홍길동',
      relationship: '아버지',
      gender: 'male',
      mournerName: '홍세종',
      occasionType: '기제사',
    });

    // 5줄 구성
    expect(result.lines).toHaveLength(5);

    // 1행: 날짜 (간지)
    expect(result.lines[0]).toContain('維 歲次');
    expect(result.lines[0]).toContain('丙午'); // 2026 = 丙午년

    // 2행: 상주 정보
    expect(result.lines[1]).toContain('孝子');
    expect(result.lines[1]).toContain('홍세종');
    expect(result.lines[1]).toContain('敢昭告于');

    // 3행: 고인 정보
    expect(result.lines[2]).toContain('顯考');
    expect(result.lines[2]).toContain('學生');
    expect(result.lines[2]).toContain('홍길동');
    expect(result.lines[2]).toContain('府君');

    // 4행: 추원감시
    expect(result.lines[3]).toContain('昊天罔極');

    // 5행: 마무리
    expect(result.lines[4]).toContain('尙饗');

    // 메타 정보
    expect(result.meta.occasionType).toBe('기제사');
    expect(result.meta.date.yearGanji).toBe('丙午');
  });

  test('축문 fullText는 줄바꿈으로 연결된다', () => {
    const result = generateChukmun({
      date: new Date(2026, 0, 1),
      deceasedName: '홍길동',
      relationship: '아버지',
      gender: 'male',
      mournerName: '홍세종',
      occasionType: '기제사',
    });

    expect(result.fullText).toBe(result.lines.join('\n'));
  });
});

// ─── 위패 생성 테스트 ────────────────────────────────────────────

describe('위패(位牌) 생성', () => {
  test('기본 위패 — 남성 아버지', () => {
    const result = generateWipae({
      deceasedName: '홍길동',
      relationship: '아버지',
      gender: 'male',
    });

    // 텍스트는 지방과 동일
    expect(result.lines).toEqual(['顯考', '學生', '홍길동', '府君', '神位']);
    expect(result.fullText).toBe('顯考 學生 홍길동 府君 神位');

    // 메타 정보는 위패 고유
    expect(result.meta.type).toBe('wipae');
    expect(result.meta.material).toBe('wood');
    expect(result.meta.width).toBe(10);
    expect(result.meta.height).toBe(30);
  });

  test('위패 — 여성 어머니 + 본관', () => {
    const result = generateWipae({
      deceasedName: '김옥순',
      relationship: '어머니',
      gender: 'female',
      bonGwan: '김해',
      familyName: '김',
    });

    expect(result.lines).toEqual(['顯妣', '孺人', '김해김氏', '神位']);
    expect(result.meta.type).toBe('wipae');
  });
});
