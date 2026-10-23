// 답례품과 함께 보내기 — 감사 문구/카드 정의
// 문구 원본은 app/view/[id]/thanks/ThanksContent.tsx 의 messages 와 동일하다.
// (운영 중인 감사장 페이지를 건드리지 않기 위해 복사해 둠. 문구를 바꾸면 두 곳을 함께 수정할 것)

export type ReligionType = 'general' | 'christian' | 'catholic' | 'buddhist';
export type CardId = ReligionType | 'none';

export const RELIGION_TABS: { key: ReligionType; label: string }[] = [
    { key: 'general', label: '일반' },
    { key: 'christian', label: '기독교' },
    { key: 'catholic', label: '천주교' },
    { key: 'buddhist', label: '불교' },
];

export const CARD_OPTIONS: { id: CardId; label: string; image: string | null }[] = [
    { id: 'general', label: '일반', image: '/images/thanks/thanks-general.jpg' },
    { id: 'christian', label: '기독교', image: '/images/thanks/thanks-christian.jpg' },
    { id: 'catholic', label: '천주교', image: '/images/thanks/thanks-catholic.jpg' },
    { id: 'buddhist', label: '불교', image: '/images/thanks/thanks-buddhist.jpg' },
    { id: 'none', label: '없음', image: null },
];

const BODY: Record<ReligionType, string[]> = {
    general: [
        '귀한 시간 내시어 故{deceased}님의 마지막 길에\n함께해 주셔서 감사드립니다.',
        '보내주신 따뜻한 마음과 위로가\n슬픔 속에서 큰 힘이 되었습니다.',
        '직접 찾아뵙고 인사드려야 하나,\n이렇게 글로 먼저 감사의 말씀을 전합니다.',
        '건강하시고 좋은 일만 가득하시기를 기원합니다.',
    ],
    christian: [
        '귀한 시간 내시어 故{deceased}님의 마지막 길에\n함께해 주시고 위로해 주셔서 진심으로 감사드립니다.',
        '보내주신 따뜻한 기도와 위로의 말씀이\n주님의 은혜처럼 저희 가족에게 큰 힘이 되었습니다.',
        '이제 주님 품에서 편히 쉬고 계시며,\n저희도 믿음 안에서 다시 만날 날을 소망합니다.',
        '주님의 사랑 안에서\n늘 축복 가득하시기를 기도드립니다.',
    ],
    catholic: [
        '귀한 시간 내시어 故{deceased}님을 위해\n기도해 주시고 위로해 주셔서 깊이 감사드립니다.',
        '보내주신 따뜻한 위로와 기도가\n슬픔을 견디는 데 큰 힘이 되었습니다.',
        '이제 영원한 안식을 누리고 계시며,\n저희도 언젠가 다시 만날 날을 기다립니다.',
        '하느님의 은총이\n늘 함께하시기를 기도드립니다.',
    ],
    buddhist: [
        '귀한 시간 내시어 故{deceased}님의 왕생길에\n함께해 주시고 명복을 빌어주셔서 깊이 감사드립니다.',
        '보내주신 따뜻한 위로와 독경이\n슬픔 속에서 큰 위안이 되었습니다.',
        '이제 극락세계에서 편히 쉬고 계시며,\n저희도 인연의 끈으로 다시 만날 날을 기다립니다.',
        '부처님의 가피로\n늘 평안하시기를 기원합니다.',
    ],
};

export const MESSAGE_MAX = 500;

export function getReligionType(religion?: string | null): ReligionType {
    if (religion === '기독교') return 'christian';
    if (religion === '천주교') return 'catholic';
    if (religion === '불교') return 'buddhist';
    return 'general';
}

export type CustomMessages = Partial<Record<ReligionType, string>>;

/** bugo.thanks_message (문자열/JSON/객체) → 종교별 사용자 수정 문구 */
export function parseCustomMessages(raw: unknown): CustomMessages {
    if (!raw) return {};
    if (typeof raw === 'object') return raw as CustomMessages;
    if (typeof raw === 'string') {
        try {
            const v = JSON.parse(raw);
            return typeof v === 'object' && v ? (v as CustomMessages) : { general: raw };
        } catch {
            return { general: raw }; // 이전 형식(단일 문자열)
        }
    }
    return {};
}

/** 탭에서 보여줄 문구: 사용자가 수정해 둔 문구가 있으면 그것, 없으면 기본 문구 */
export function buildMessage(tab: ReligionType, deceased: string, custom: CustomMessages): string {
    const saved = custom[tab];
    if (saved && saved.trim()) return saved;
    return BODY[tab].map((p) => p.replace('{deceased}', deceased || '고인')).join('\n\n');
}
