/**
 * Supabase 설정
 * 도담부고 - Supabase 연동
 */

// Supabase 프로젝트 정보
const SUPABASE_URL = 'https://tbteghoppechzotdojna.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidGVnaG9wcGVjaHpvdGRvam5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTM2MjcsImV4cCI6MjA4MjQ2OTYyN30.MpmRA9dYprsg4Ou5qpbNzG6S7ihBBmZAWAALS95O8BI';

// Supabase 클라이언트 초기화
// 중요: window.supabase를 클라이언트 인스턴스로 덮어씀
const _supabaseLib = window.supabase;
window.supabase = _supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 전역 변수로도 접근 가능하도록 설정
const supabase = window.supabase;

console.log('✅ Supabase 클라이언트 초기화 완료');
