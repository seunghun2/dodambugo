/**
 * GET /api/test-push
 * 8개 알림 타입 전수 테스트 (임시 — 테스트 후 즉시 삭제)
 */
import { NextResponse } from 'next/server';
import { sendPartnerNotification } from '@/lib/partner-notification';

const PARTNER_ID = '552650f0-3243-4e46-97ec-d2e7ff5de2e2';

const tests = [
    { type: 'notice' as const, vars: { 제목: '서비스 업데이트 안내', 내용: '부고온 v1.1 업데이트가 적용되었습니다.' }, data: { url: '/b2b/dashboard' }, delay: 0 },
    { type: 'new_funeral' as const, vars: { 고인명: '홍길동', 상주명: '홍상주', 장례식장: '삼성서울병원장례식장' }, data: { url: '/b2b/manage' }, delay: 3000 },
    { type: 'delivery_complete' as const, vars: { 고인명: '홍길동', 주문자명: '김철수', 상품명: '근조3단화환', 배송지: '삼성서울병원장례식장 특3호실' }, data: { url: '/b2b/dashboard' }, delay: 6000 },
    { type: 'settlement' as const, vars: { 정산금액: '150,000', 정산기간: '2026.07.01 ~ 07.15' }, data: { url: '/b2b/wallet' }, delay: 9000 },
    { type: 'condolence_earned' as const, vars: { 조문객명: '이영희', 고인명: '홍길동', 금액: '100,000', 수당금액: '5,000' }, data: { url: '/b2b/wallet' }, delay: 12000 },
    { type: 'funeral_reminder' as const, vars: { 고인명: '홍길동', 장례식장: '삼성서울병원장례식장', 발인일시: '2026-07-19 10:00' }, data: { url: '/b2b/manage' }, delay: 15000 },
    { type: 'signup_approved' as const, vars: { 파트너명: '부고온 파트너 상조', 대표자명: '백승훈' }, data: { url: '/b2b/dashboard' }, delay: 18000 },
    { type: 'referral_signup' as const, vars: { 추천인명: '백승훈', 신규파트너명: '서울장례상조' }, data: { url: '/b2b/dashboard' }, delay: 21000 },
];

export async function GET() {
    const results: any[] = [];

    for (const test of tests) {
        try {
            if (test.delay > 0) {
                await new Promise(r => setTimeout(r, 3000));
            }
            await sendPartnerNotification(PARTNER_ID, test.type, test.vars, test.data);
            results.push({ type: test.type, status: '✅ 성공' });
        } catch (err: any) {
            results.push({ type: test.type, status: '❌ 실패', error: err.message });
        }
    }

    return NextResponse.json({ total: results.length, results });
}
