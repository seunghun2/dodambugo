/**
 * 축문(祝文) 생성 로직
 *
 * 제사 시 읽는 축문을 자동으로 생성합니다.
 * 전통 한문 축문과 현대식 쉬운 한글 축문을 모두 지원합니다. (단설 전용)
 * 장례 3일 동안 행해지는 세부 제식(발인, 평토, 성분, 산신 등)을 완벽히 포함합니다.
 * 종교(일반/불교 vs 기독교/천주교) 선택에 따라 축문 및 추도문이 동적으로 변화합니다.
 */

import { getYearGanji, getMonthGanji, getDayGanji } from './ganji';

// ─── 타입 ────────────────────────────────────────────────────────

/** 축문 생성 입력 */
export interface ChukmunInput {
  /** 제사 날짜 (양력) */
  date: Date;
  /** 상주(제주) 이름 */
  mournerName: string;
  /** 제사 유형 */
  occasionType: 
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

  /** 고인 이름 */
  deceasedName: string;
  /** 고인과의 관계 (아버지, 어머니 등) */
  relationship: string;
  /** 고인 성별 */
  gender: 'male' | 'female';
  /** 본관 (여성 고인용) */
  bonGwan?: string;
  /** 성씨 (여성 고인용) */
  familyName?: string;

  /** 종교 구분 */
  religion?: 'general' | 'buddhism' | 'christian' | 'catholic';
}

/** 축문 생성 결과 */
export interface ChukmunResult {
  /** 한문 축문 전체 텍스트 */
  fullText: string;
  /** 한문 축문 각 줄 텍스트 배열 */
  lines: string[];
  /** 한자 축문의 한글 독음 각 줄 텍스트 배열 */
  readingLines: string[];
  /** 한글 축문 전체 텍스트 */
  koreanFullText: string;
  /** 한글 축문 각 줄 텍스트 배열 */
  koreanLines: string[];
  /** 메타 정보 */
  meta: {
    occasionType: string;
    date: {
      year: number;
      month: number;
      day: number;
      yearGanji: string;
      monthGanji: string;
      dayGanji: string;
    };
  };
}

// ─── 상수 ────────────────────────────────────────────────────────

/** 고인 관계별 호칭 (한문) */
const DECEASED_TITLE_HAN: Record<string, string> = {
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

/** 고인 관계별 호칭 (한글) */
const DECEASED_TITLE_KOR: Record<string, string> = {
  '아버지': '아버님',
  '어머니': '어머님',
  '할아버지': '할아버님',
  '할머니': '할머님',
  '증조부': '증조할아버님',
  '증조모': '증조할머님',
  '남편': '남편',
  '아내': '아내',
  '형': '형님',
  '아들': '자식',
  '며느리': '며느리',
};

/** 상주 호칭 매핑 (한문) */
const MOURNER_TITLE_HAN: Record<string, string> = {
  '아버지': '孝子',
  '어머니': '孝子',
  '할아버지': '孝孫',
  '할머니': '孝孫',
  '증조부': '孝曾孫',
  '증조모': '孝曾孫',
  '남편': '未亡人',
  '아내': '夫',
  '형': '弟',
  '아들': '父',
  '며느리': '舅',
};

/** 상주 호칭 매핑 (한글) */
const MOURNER_TITLE_KOR: Record<string, string> = {
  '아버지': '아들',
  '어머니': '아들',
  '할아버지': '손자',
  '할머니': '손자',
  '증조부': '증손자',
  '증조모': '증손자',
  '남편': '아내',
  '아내': '남편',
  '형': '동생',
  '아들': '아버지',
  '며느리': '시부모',
};

/** 월 이름 (한문) */
const MONTH_CHINESE: readonly string[] = [
  '', '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

/** 월 이름 (한글) */
const MONTH_KOREAN: readonly string[] = [
  '', '정월', '이월', '삼월', '사월', '오월', '유월',
  '칠월', '팔월', '구월', '시월', '동짓달', '섣달',
];

/** 일 이름 (한글 순우리말) */
const DAYS_KOREAN: readonly string[] = [
  '',
  '초하루', '초이틀', '초사흘', '초나흘', '초닷새', '초엿새', '초이레', '초여드레', '초아흐레', '초열흘',
  '열하루', '열이틀', '열사흘', '열나흘', '열닷새', '열엿새', '열이레', '열여드레', '열아흐레', '스무날',
  '스물하루', '스물이틀', '스물사흘', '스물나흘', '스물닷새', '스물엿새', '스물이레', '스물여드레', '스물아흐레', '그믐', '스물한날'
];

// ─── 유틸리티 ────────────────────────────────────────────────────

/** 일(日)을 한문 숫자 표기로 변환 */
export function dayToChinese(day: number): string {
  const units = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  if (day <= 10) {
    if (day === 10) return '初十日';
    return `初${units[day]}日`;
  }
  if (day <= 19) {
    return `十${units[day - 10]}日`;
  }
  if (day === 20) return '二十日';
  if (day <= 29) {
    return `二十${units[day - 20]}日`;
  }
  if (day === 30) return '三十日';
  return '三十一日';
}

/** 한문 고인 라인 빌더 */
function buildDeceasedLine(item: { deceasedName: string; relationship: string; gender: 'male' | 'female'; bonGwan?: string; familyName?: string }): string {
  const deceasedTitle = DECEASED_TITLE_HAN[item.relationship] || '顯考';
  const pos = item.gender === 'male' ? '學生' : '孺人';

  if (item.gender === 'male') {
    return `${deceasedTitle} ${pos} ${item.deceasedName} 府君`;
  } else {
    if (item.bonGwan && item.familyName) {
      return `${deceasedTitle} ${pos} ${item.bonGwan}${item.familyName}氏`;
    } else {
      return `${deceasedTitle} ${pos} ${item.deceasedName}`;
    }
  }
}

/** 한문 글자를 한글 음독으로 변환하는 사전 매핑 함수 */
export function translateHanjaToHangul(text: string): string {
  const dict: Record<string, string> = {
    // 1. 제례 및 관계용 한자
    '維': '유', '歲': '세', '次': '차', '朔': '삭', '孝': '효', '子': '자', '孫': '손', '曾': '증', 
    '未': '미', '亡': '망', '人': '인', '夫': '부', '弟': '제', '父': '부', '舅': '구', '敢': '감', 
    '昭': '소', '고': '고', '告': '고', '于': '우', '顯': '현', '考': '고', '妣': '비', '祖': '조', '學': '학',
    '生': '생', '孺': '유', '府': '부', '君': '군', '氏': '씨', '序': '서', '遷': '천', '易': '역', 
    '追': '추', '遠': '원', '감': '감', '感': '감', '時': '시', '昊': '호', '天': '천', '罔': '망', '極': '극', 
    '謹': '근', '以': '이', '清': '청', '酌': '작', '庶': '서', '羞': '수', '恭': '공', '修': '수', 
    '薦': '천', '事': '사', '伸': '신', '奠': '전', '獻': '헌', '尙': '상', '饗': '향', '靈': '영', 
    '輿': '여', '旣': '기', '整': '정', '往': '왕', '卽': '즉', '幽': '유', '宅': '택', '載': '재', 
    '將': '장', '永': '영', '終': '종', '嗚': '오', '呼': '호', '哀': '애', '哉': '재', '伏': '복', 
    '惟': '유', '形': '형', '歸': '귀', '室': '실', '堂': '당', '主': '주', '成': '성', '尊': '존', 
    '舍': '사', '舊': '구', '從': '종', '新': '신', '은': '은', '는': '는', '은는': '은는', '은(는)': '은(는)',
    '是': '시', '憑': '빙', '墳': '분', '墓': '묘', 
    '體': '체', '魄': '백', '夙': '숙', '安': '안', '토': '토', '土': '토', '地': '지', '之': '지', '신': '신', '神': '신', 
    '玆': '자', '爲': '위', '영': '영', '營': '영', '建': '건', '德': '덕', '수': '수', '守': '수', '호': '호', '護': '호', '비': '비', '庇': '비', 
    '우': '우', '佑': '우', '俾': '비', '무': '무', '無': '무', '후': '후', '後': '후', '간': '간', '艱': '간', '지': '지', '祗': '지',
    // 2. 간지 및 숫자
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '申': '신', '酉': '유', '戌': '술', '亥': '해',
    '一': '일', '二': '이', '三': '삼', '四': '사', '五': '오', '六': '육', '七': '칠', '八': '팔', '九': '구', '十': '십',
    '年': '년', '月': '월', '日': '일', '初': '초', '正': '정', '返': '반', '來': '래', '虞': '우', '慰': '위'
  };
  return text.split('').map(char => dict[char] || char).join('');
}

// ─── 핵심 함수 ───────────────────────────────────────────────────

/**
 * 축문(祝文)을 생성합니다. (전통 한문 및 쉬운 현대 한글 동시 반환)
 */
export function generateChukmun(input: ChukmunInput): ChukmunResult {
  const { date, mournerName, occasionType, deceasedName, relationship, gender, bonGwan, familyName, religion = 'general' } = input;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 1. 천간 지지 간지 자동 계산 (한문용)
  const systemYearGanji = getYearGanji(year);
  const systemMonthGanji = getMonthGanji(year, month);
  const systemDayGanji = getDayGanji(year, month, day);

  const monthNameHan = MONTH_CHINESE[month] || `${month}月`;
  const dayNameHan = dayToChinese(day);

  // 2. 천간 지지 간지 자동 계산 (한글 독음용)
  const yearGanjiKor = systemYearGanji.korean;
  const monthGanjiKor = systemMonthGanji.korean;
  const dayGanjiKor = systemDayGanji.korean;

  const monthNameKor = MONTH_KOREAN[month] || `${month}월`;
  const dayNameKor = DAYS_KOREAN[day] || `${day}일`;

  // 3. 한문 상주 호칭 및 고인 호칭
  const mournerTitleHan = MOURNER_TITLE_HAN[relationship] || '孝子';
  const deceasedLineHan = buildDeceasedLine({ deceasedName, relationship, gender, bonGwan, familyName });

  // 4. 한문 축문 날짜/제주 구성 (한자와 독음을 각각 구성)
  const dateLineHan = `維 歲次 ${systemYearGanji.hanja} ${monthNameHan} ${systemMonthGanji.hanja}朔 ${dayNameHan} ${systemDayGanji.hanja}`;
  const dateLineReading = `유세차 ${yearGanjiKor}년 ${monthNameKor} ${monthGanjiKor}삭 ${dayNameKor} ${dayGanjiKor}일`;
  const mournerLineHan = `${mournerTitleHan} ${mournerName} 敢昭告于`;

  // ── 한글 호칭 구성 ──
  const relationKor = DECEASED_TITLE_KOR[relationship] || '고인';
  const mournerTitleKor = MOURNER_TITLE_KOR[relationship] || '가족';
  const deceasedKor = `${relationKor} 故 ${deceasedName}`;

  // ── 기독교/천주교 전용 추도예배 축문 처리 ──
  if (religion === 'christian' || religion === 'catholic') {
    const chTitle = religion === 'christian' ? '기독교' : '천주교';
    const titleOccasion = occasionType === '기제사' ? '추모예배' : 
                         occasionType.includes('설날') || occasionType.includes('설') ? '설 명절 추모예배' :
                         occasionType.includes('추석') ? '추석 명절 추모예배' :
                         occasionType.includes('발인제') || occasionType.includes('장례') ? '발인예배' :
                         occasionType.includes('성분') ? '성분예배' :
                         occasionType.includes('삼우') ? '삼우예배' : '추모예배';
    
    const titleText = `[ ${chTitle} ${titleOccasion} 기도문 ]`;
    
    let bodyLines: string[] = [];
    if (occasionType === '기제사') {
      bodyLines = [
        '주님, 오늘 고인의 기일을 맞이하여 가족들이 모였습니다.',
        '고인이 생전에 보여준 사랑과 믿음의 유산을 기억하게 하시고,',
        '저희가 그 발자취를 따라 하늘의 소망을 품고 살아가게 하옵소서.',
        '남은 가족들을 위로하시고 하늘의 평강으로 채워 주옵소서.'
      ];
    } else if (occasionType.includes('설') || occasionType.includes('추석')) {
      bodyLines = [
        '주님, 명절을 맞이하여 온 가족이 한자리에 모였습니다.',
        '우리에게 귀한 믿음의 가정을 허락하시고 조상의 은덕을 기억하게 하심을 감사드립니다.',
        '천국에 있는 고인을 주님의 품 안에서 영원한 안식으로 인도하여 주시고,',
        '저희 가정이 주님의 은혜 안에서 늘 화목하고 평안하게 하옵소서.'
      ];
    } else if (occasionType.includes('발인제') || occasionType.includes('장례')) {
      bodyLines = [
        '주님, 이제 고인을 마지막으로 떠나보내는 발인의 시간에 모였습니다.',
        '이 땅에서의 슬픔을 걷어주시고 고인의 영혼을 주님의 따뜻한 품에 안아주옵소서.',
        '장지로 향하는 모든 여정을 주님께서 지켜주시고 동행하여 주시며,',
        '유가족들의 상처 입은 마음에 주님의 큰 위로를 더하여 주옵소서.'
      ];
    } else if (occasionType.includes('성분')) {
      bodyLines = [
        '주님, 고인의 유해를 안장하고 성분식을 올리며 기도드립니다.',
        '무덤의 흙은 육신의 집이오나 고인의 영혼은 하늘나라에서 영생하게 됨을 믿습니다.',
        '이곳을 지켜주시고 고인의 뼈가 흙에서 평안히 잠들게 하시며,',
        '가족들에게는 부활의 소망을 주시어 슬픔을 이겨내게 하옵소서.'
      ];
    } else if (occasionType.includes('삼우')) {
      bodyLines = [
        '주님, 장례를 마치고 삼우를 맞이하여 고인을 기억하며 예배드립니다.',
        '고인이 우리 곁을 떠난 슬픔은 크오나 하늘의 안식을 누림을 믿고 위로를 얻습니다.',
        '가족들이 일상으로 돌아가는 길에 복을 더하여 주시고,',
        '주님의 평화와 사랑이 늘 가득하게 하옵소서.'
      ];
    } else {
      bodyLines = [
        '주님, 고인의 영혼을 주님의 따뜻한 품에 안아주시고',
        '하늘나라에서 눈물과 고통 없는 영원한 복락과 안식을 누리게 하옵소서.',
        '이 땅에 남은 유가족들에게도 하늘의 위로와 평강을 내리어 주옵소서.'
      ];
    }

    const lines = [
      titleText,
      `일시: 서기 ${year}년 ${month}월 ${day}일`,
      `예배 인도자: ${mournerName}`,
      `대상 고인: 故 ${deceasedName}`,
      ...bodyLines
    ];

    return {
      fullText: lines.join('\n'),
      lines,
      readingLines: lines,
      koreanFullText: lines.join('\n'),
      koreanLines: lines,
      meta: {
        occasionType,
        date: { year, month, day, yearGanji: systemYearGanji.hanja, monthGanji: systemMonthGanji.hanja, dayGanji: systemDayGanji.hanja }
      }
    };
  }

  // ── 일반 & 불교 버전 각 유형별 라인 구성 ──
  let lines: string[] = [];
  let koreanLines: string[] = [];

  switch (occasionType) {
    case '기제사':
      lines = [
        dateLineHan,
        mournerLineHan,
        deceasedLineHan,
        '歲序遷易 追遠感時 昊天罔極',
        '謹以 清酌庶羞 恭修歲事 尙饗',
      ];
      koreanLines = [
        `서기 ${year}년 ${month}월 ${day}일,`,
        `${mournerTitleKor} ${mournerName}은(는) 삼가 ${deceasedKor}의 영전에 고하나이다.`,
        '어느덧 해가 바뀌어 고인의 기일이 다시 돌아오니,',
        '하늘과 같이 가이없는 은혜에 슬프고 애통한 마음을 금할 길이 없습니다.',
        '이에 맑은 술과 정성껏 준비한 제수를 공손히 올리오니 흠향하시옵소서.',
      ];
      break;

    case '설날':
      lines = [
        dateLineHan,
        mournerLineHan,
        deceasedLineHan,
        '歲序遷易 感時追慕 昊天罔極',
        '謹以 清酌庶羞 恭修歲薦 尙饗',
      ];
      koreanLines = [
        `서기 ${year}년 ${month}월 ${day}일 설날 차례를 맞이하여,`,
        `${mournerTitleKor} ${mournerName}은(는) 삼가 ${deceasedKor}의 영전에 고하나이다.`,
        '계절이 순환하여 새해 첫날을 맞이하니 고인의 그리움이 더욱 깊어갑니다.',
        '하늘처럼 넓으신 은덕을 기리며 정성껏 차례 음식을 올리오니,',
        '기쁘게 받아주시고 저희 가족을 돌보아 주옵소서.',
      ];
      break;

    case '추석':
      lines = [
        dateLineHan,
        mournerLineHan,
        deceasedLineHan,
        '秋露旣降 楓葉又紅 瞻掃封塋 不勝感愴',
        '謹以 清酌庶羞 恭修時薦 尙饗',
      ];
      koreanLines = [
        `서기 ${year}년 ${month}월 ${day}일 한가위를 맞이하여,`,
        `${mournerTitleKor} ${mournerName}은(는) 삼가 ${deceasedKor}의 영전에 고하나이다.`,
        '가을 이슬 내리고 단풍 붉게 물든 한가위를 맞이하여 추모의 정을 올립니다.',
        '은혜를 잊지 못해 햅쌀과 햇과일로 정성껏 수확의 제례를 모시오니,',
        '부디 흔쾌히 흠향하시고 보살펴 주옵소서.',
      ];
      break;

    case '장례(발인제)':
      lines = [
        dateLineHan,
        mournerLineHan,
        deceasedLineHan,
        '靈輿旣整 往卽幽宅',
        '載事將事 永遷終天',
        '嗚呼哀哉 伏惟 尙饗',
      ];
      koreanLines = [
        `서기 ${year}년 ${month}월 ${day}일 발인제를 맞이하여,`,
        `${mournerTitleKor} ${mournerName}은(는) 삼가 ${deceasedKor}의 영전에 머리 숙여 고하나이다.`,
        '상여가 이미 갖추어져 고인의 안식처로 머나먼 여정을 떠나고자 합니다.',
        '영원한 안식처로 고인을 모시게 됨을 슬퍼하며 맑은 술과 제수를 바치오니,',
        '부디 흔쾌히 받아주시고 평안히 영면하시옵소서.',
      ];
      break;

    case '초혼(招魂)':
      lines = [
        '嗚呼哀哉 尊靈返來',
        '伏惟 尙饗',
      ];
      koreanLines = [
        '슬프고 애달프도다.',
        `고인 故 ${deceasedName}의 영혼이시여,`,
        '부디 방황하지 마시고 이리로 돌아오시옵소서.',
        '저희가 올리는 간절한 마음에 응답하여 머물러 주옵소서.',
      ];
      break;

    case '평토제(平土祭)':
      lines = [
        dateLineHan,
        mournerLineHan,
        deceasedLineHan,
        '形歸幽宅 神返室堂',
        '神主旣成 伏惟 尊靈',
        '舍舊從新 是憑 尙饗',
      ];
      koreanLines = [
        `서기 ${year}년 ${month}월 ${day}일 평토제를 맞이하여,`,
        `${mournerTitleKor} ${mournerName}은(는) 삼가 ${deceasedKor}의 영전에 고하나이다.`,
        '육신은 광중(무덤)에 묻히고 영혼은 집(실당)으로 돌아오시게 되었습니다.',
        '이제 의례를 거쳐 고인의 신위가 완성되었사오니,',
        '옛 집착을 버리시고 새 신위에 편안히 의지하여 안식하옵소서.',
      ];
      break;

    case '성분제(成墳祭)':
      lines = [
        dateLineHan,
        mournerLineHan,
        deceasedLineHan,
        '墳墓旣成 體魄夙安',
        '嗚呼哀哉 伏惟 尙饗',
      ];
      koreanLines = [
        `서기 ${year}년 ${month}월 ${day}일 성분제를 맞이하여,`,
        `${mournerTitleKor} ${mournerName}은(는) 삼가 ${deceasedKor}의 영전에 고하나이다.`,
        '이제 무덤의 봉분을 완성하여 육신이 비로소 영원한 안식에 드시게 되었습니다.',
        '애통한 마음을 금치 못하여 맑은 술과 음식을 올리오니,',
        '부디 편안히 누리시옵소서.',
      ];
      break;

    case '산신제(山神祭)':
      lines = [
        `土地之神 ${mournerName} 敢昭告于`,
        `玆爲 顯考 學生 府君 營建幽宅`,
        '伏惟 神德 守護 庇佑 俾無後艱',
        '謹以 清酌庶羞 祗薦于神 尙饗',
      ];
      koreanLines = [
        `서기 ${year}년 ${month}월 ${day}일 토지신(산신령)께 고하나이다.`,
        `${mournerTitleKor} ${mournerName}은(는) 아버님 故 ${deceasedName}의 유택(묫자리)을 이곳에 새로 짓고자 합니다.`,
        '바라옵건대 신령님의 자비로운 덕으로 이곳을 보호하시고 보살펴 주시어,',
        '훗날 어떠한 재앙도 없이 가족들이 평안하도록 돌보아 주옵소서.',
        '이에 맑은 술과 고기와 과일을 갖추어 올리오니 흠향하시옵소서.',
      ];
      break;

    case '삼우제(三虞祭)':
      lines = [
        dateLineHan,
        mournerLineHan,
        deceasedLineHan,
        '歲序遷易 三虞薦事',
        '追遠感時 昊天罔極',
        '謹以 尙饗',
      ];
      koreanLines = [
        `서기 ${year}년 ${month}월 ${day}일 삼우제를 맞이하여,`,
        `${mournerTitleKor} ${mournerName}은(는) 삼가 ${deceasedKor}의 영전에 엎드려 고하나이다.`,
        '장례를 마치고 세 번째 제사인 삼우를 맞이하니 슬픈 마음이 가시지 않습니다.',
        '하늘과 같은 고인의 한없는 은혜에 보답하고자,',
        '맑은 술과 제수를 공손히 바치오니 흔쾌히 받아주옵소서.',
      ];
      break;

    case '위령제(慰靈祭)':
      lines = [
        '尊靈安慰 嗚呼哀哉',
        '伏惟 尙饗',
      ];
      koreanLines = [
        `고인 故 ${deceasedName}의 영령을 위로하오니,`,
        '이승에서의 고단했던 짐과 온갖 슬픔, 아픔을 모두 잊으시고,',
        '부디 하늘나라의 가장 밝고 편안한 곳에 깃들어 영원히 안식하소서.',
        '삼가 추모의 잔을 올립니다.',
      ];
      break;

    default:
      lines = [
        dateLineHan,
        mournerLineHan,
        deceasedLineHan,
        '歲序遷易 追遠感時 昊天罔極',
        '謹以 清酌庶羞 恭修歲事 尙饗',
      ];
      koreanLines = [
        `서기 ${year}년 ${month}월 ${day}일,`,
        `${mournerTitleKor} ${mournerName}은(는) 삼가 ${deceasedKor}의 영전에 고하나이다.`,
        '기일이 다시 돌아오니 은혜에 감사하며 슬픈 마음이 가득합니다.',
        '맑은 술과 제수를 공손히 올리오니 받아주옵소서.',
      ];
  }

  const readingLines = lines.map(line => {
    if (line === dateLineHan) {
      return dateLineReading;
    }
    return translateHanjaToHangul(line);
  });

  return {
    fullText: lines.join('\n'),
    lines,
    readingLines,
    koreanFullText: koreanLines.join('\n'),
    koreanLines,
    meta: {
      occasionType,
      date: {
        year,
        month,
        day,
        yearGanji: systemYearGanji.hanja,
        monthGanji: systemMonthGanji.hanja,
        dayGanji: systemDayGanji.hanja,
      },
    },
  };
}
