import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tbteghoppechzotdojna.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidGVnaG9wcGVjaHpvdGRvam5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTM2MjcsImV4cCI6MjA4MjQ2OTYyN30.MpmRA9dYprsg4Ou5qpbNzG6S7ihBBmZAWAALS95O8BI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 타입 정의
export interface Bugo {
    id: string;
    bugo_number: string;
    template: string;
    applicant_name: string;
    phone_password: string;
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
