/**
 * 부고장 API 테스트
 */

describe('부고장 API 테스트', () => {
    test('테스트 환경 정상 동작', () => {
        expect(true).toBe(true);
    });

    describe('부고장 생성', () => {
        test.skip('정상 부고장 생성', async () => {
            // const response = await fetch('/api/bugo', {
            //   method: 'POST',
            //   body: JSON.stringify({
            //     deceased_name: '홍길동',
            //     mourner_name: '홍철수',
            //     template_id: 'basic'
            //   })
            // });
            // expect(response.status).toBe(200);
            // const data = await response.json();
            // expect(data.id).toBeDefined();
        });

        test.skip('필수 필드 누락 - 실패해야 함', async () => {
            // 고인명 없이 생성 시도
        });
    });

    describe('부고장 조회', () => {
        test.skip('부고장 ID로 조회', async () => {
            // 생성된 부고장 조회
        });

        test.skip('존재하지 않는 ID - 404 반환', async () => {
            // 없는 ID 조회 시
        });
    });
});
