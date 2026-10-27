/**
 * 위패(位牌) 생성 로직
 *
 * 위패의 내용을 생성합니다.
 * 텍스트 구조는 지방(紙榜)과 동일하나, 레이아웃 메타정보(크기, 재질 등)가 다릅니다.
 * 위패는 나무 등 견고한 재질에 새기는 신위입니다. (단설 전용)
 */

import { JibangInput, buildSingleJibangLines, getPhraseLines } from './jibang';

// ─── 타입 ────────────────────────────────────────────────────────

/** 위패 생성 결과 */
export interface WipaeResult {
  /** 위패 전체 텍스트 */
  fullText: string;
  /** 각 줄의 텍스트 배열 (세로 쓰기 기준) */
  lines: string[];
  /** 기독교/천주교 기도문구 라인 */
  phraseLines?: string[];
  /** 메타 정보 */
  meta: {
    /** 가로 크기 (cm) */
    width: number;
    /** 세로 크기 (cm) */
    height: number;
    /** 재질 */
    material: string;
    /** 구분 타입 */
    type: 'wipae';
    /** 종교 구분 */
    religion: 'general' | 'buddhism' | 'christian' | 'catholic';
  };
}

// ─── 핵심 함수 ───────────────────────────────────────────────────

/**
 * 위패(位牌)를 생성합니다. (단설 전용)
 */
export function generateWipae(input: JibangInput): WipaeResult {
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
      width: 10,  // 가로 10cm
      height: 30, // 세로 30cm
      material: 'wood',
      type: 'wipae',
      religion,
    },
  };
}
