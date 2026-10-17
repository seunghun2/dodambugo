import type { GiftRecipient } from '@/lib/gift/phone';

export interface GiftProduct {
    id: string;
    brand: string;
    name: string;
    category: string;
    list_price: number;
    sale_price: number;
    image_url: string | null;
    badge: string | null;
}

/** 화면에 올라온 받는 사람 한 줄. 번호를 직접 가진 경우(phone)와 서버가 번호를 쥐고 있는 경우(ref)로 나뉜다. */
export interface RecipientItem {
    key: string; // 화면 목록용 고유키
    name: string;
    phone?: string; // contact / excel / manual 만 보유 (숫자만)
    ref?: string; // condolence / flower 는 ref 만 보유 (번호는 서버에서 조회)
    dedupeKey?: string; // 동일 전화번호 중복 통합용 해시키 (조의금+화환+직접입력 통합)
    maskedPhone: string;
    source: GiftRecipient['source'];
    note?: string; // 조의금 50,000원 같은 부가 설명
}

export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export const BRAND_COLORS: Record<string, string> = {
    스타벅스: '#00704A',
    투썸플레이스: '#D6001C',
    파리바게뜨: '#1D4E9E',
    뚜레쥬르: '#2F8F46',
    던킨도너츠: '#FF671F',
    정관장: '#B3001B',
    신세계이마트: '#E8A400',
    올리브영: '#7FB414',
    다이소: '#E4002B',
    해피콘: '#F2635F',
};
