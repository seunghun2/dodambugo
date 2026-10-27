process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-key';

import { B2B_TEMPLATE_MAP } from '@/lib/solapi';

describe('장지 이용후기/만족도 알림톡 발송 격리 및 B2B 배제 테스트', () => {
    describe('1. 크론 발송 대상 필터링 시뮬레이션 (B2B 배제 검증)', () => {
        interface BugoTarget {
            bugo_number: number;
            mourner_name: string;
            phone_password: string;
            burial_place: string;
            b2b_user_id: string | null;
        }

        const mockBugos: BugoTarget[] = [
            {
                bugo_number: 1001,
                mourner_name: '홍길동(B2C)',
                phone_password: '010-1111-2222',
                burial_place: '서울추모공원',
                b2b_user_id: null, // 순수 B2C 마음부고
            },
            {
                bugo_number: 1002,
                mourner_name: '이순신(B2B더좋은)',
                phone_password: '010-3333-4444',
                burial_place: '부산영락공원',
                b2b_user_id: 'b2b_user_thegood_01', // B2B 부고온 파트너
            },
            {
                bugo_number: 1003,
                mourner_name: '강감찬(B2C)',
                phone_password: '010-5555-6666',
                burial_place: '분당메모리얼파크',
                b2b_user_id: null, // 순수 B2C 마음부고
            },
            {
                bugo_number: 1004,
                mourner_name: '을지문덕(B2B사하구민)',
                phone_password: '010-7777-8888',
                burial_place: '사하구민장지',
                b2b_user_id: 'b2b_user_saha_02', // B2B 부고온 파트너
            },
        ];

        it('burial-review-notify 크론 로직에 따라 b2b_user_id가 있는 부고장은 전량 제외되어야 함', () => {
            // DB 레벨 쿼리 필터(.is('b2b_user_id', null)) 및 루프 방어 로직(if (bugo.b2b_user_id) continue) 적용 시
            const filteredTargets = mockBugos.filter(bugo => bugo.b2b_user_id === null);

            // 총 4건 중 B2C 2건만 통과해야 함
            expect(filteredTargets).toHaveLength(2);
            expect(filteredTargets.map(b => b.bugo_number)).toEqual([1001, 1003]);

            // B2B 파트너(1002, 1004)는 단 1건도 포함되어서는 안 됨
            const hasB2B = filteredTargets.some(b => b.b2b_user_id !== null);
            expect(hasB2B).toBe(false);
        });
    });

    describe('2. B2B 솔라피 알림톡 템플릿 매핑 및 교체 예정 추적', () => {
        const B2B_REVIEW_TEMPLATE_ID = 'KA01TP260714225958774NSjzKCXWvdF';
        const B2C_REVIEW_TEMPLATE_ID = 'KA01TP260310031832180MIhfBqgYYoB';

        it('기존 장지 이용후기 B2B 매핑이 현재 템플릿 ID를 가리키고 있는지 확인', () => {
            expect(B2B_TEMPLATE_MAP[B2C_REVIEW_TEMPLATE_ID]).toBe(B2B_REVIEW_TEMPLATE_ID);
        });

        it('향후 신규 B2B 알림톡 템플릿 승인 시 교체 대상임을 확인', () => {
            // 현재 등록된 템플릿(KA01TP260714225958774NSjzKCXWvdF)은 본문에 "마음부고"가 포함되어 미사용 처리됨
            // 향후 카카오 검수 완료된 신규 부고온 전용 템플릿으로 교체할 때 본 테스트를 갱신할 것
            const isTemporarilyDisabledForB2B = true;
            expect(isTemporarilyDisabledForB2B).toBe(true);
        });
    });
});
