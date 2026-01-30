import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 타입 정의
export interface Bugo {
    id: string;
    bugo_number: string;
    template: string;
    applicant_name: string;
    phone_password?: string; // 기존 데이터 (4자리)
    applicant_phone?: string; // 새 데이터 (전체번호)
    deceased_name: string;
    gender: string;
    relationship: string;
    age?: number;
    death_date?: string;
    religion?: string;
    mourner_name: string;
    contact: string;
    funeral_home: string;
    room_number?: string;
    funeral_home_tel?: string;
    address?: string;
    funeral_date?: string;
    funeral_time?: string;
    burial_place?: string;
    message?: string;
    family_list?: string;
    account_info?: string;
    photo_url?: string;
    created_at?: string;
}

export interface GuestbookEntry {
    id: string;
    bugo_id: string;
    author_name: string;
    message: string;
    created_at: string;
}

export interface Inquiry {
    id?: string;
    name: string;
    phone: string;
    company?: string;
    email: string;
    inquiry_type: string;
    message: string;
    created_at?: string;
}
