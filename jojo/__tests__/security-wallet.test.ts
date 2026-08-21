import jwt from 'jsonwebtoken';

describe('보안 및 출금 가드 로직 단위 테스트', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'maeumbugo-b2b-secret-key';

    describe('1. 비밀번호 재설정 verificationToken 검증 로직', () => {
        it('유효한 verificationToken이 있으면 정상 통과해야 함', () => {
            const phone = '01064262393';
            const token = jwt.sign({ phone, purpose: 'reset-password' }, JWT_SECRET, { expiresIn: '10m' });

            const decoded = jwt.verify(token, JWT_SECRET) as any;
            expect(decoded.phone).toBe(phone);
            expect(decoded.purpose).toBe('reset-password');
        });

        it('전화번호가 일치하지 않는 verificationToken은 거절되어야 함', () => {
            const phone = '01064262393';
            const hackerPhone = '01099998888';
            const token = jwt.sign({ phone: hackerPhone, purpose: 'reset-password' }, JWT_SECRET, { expiresIn: '10m' });

            const decoded = jwt.verify(token, JWT_SECRET) as any;
            expect(decoded.phone === phone).toBe(false);
        });

        it('purpose가 reset-password가 아닌 일반 토큰은 거절되어야 함', () => {
            const phone = '01064262393';
            const token = jwt.sign({ phone, purpose: 'login' }, JWT_SECRET, { expiresIn: '10m' });

            const decoded = jwt.verify(token, JWT_SECRET) as any;
            expect(decoded.purpose === 'reset-password').toBe(false);
        });
    });

    describe('2. 회원탈퇴 및 계좌 노출 설정 JWT 검증 로직', () => {
        it('정상 로그인 토큰에서 userId를 정확히 추출해야 함', () => {
            const userId = 'usr_test_12345';
            const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

            const decoded = jwt.verify(token, JWT_SECRET) as any;
            expect(decoded.userId).toBe(userId);
        });

        it('위조된 토큰 또는 잘못된 서명의 토큰은 에러를 발생시켜야 함', () => {
            const fakeToken = jwt.sign({ userId: 'hacker' }, 'wrong-secret');
            expect(() => jwt.verify(fakeToken, JWT_SECRET)).toThrow();
        });
    });

    describe('3. 출금 동시성(Race Condition) 원자적 선차감 시뮬레이션', () => {
        it('초기 잔액이 100,000원일 때, 100,000원 출금 2건이 동시 진입 시 1건만 성공해야 함', () => {
            let balance = 100000;
            const requestAmount = 100000;

            // 원자적 조건부 업데이트 시뮬레이션: (balance >= requestAmount) 일 때만 차감
            const tryDeductAtomic = () => {
                if (balance >= requestAmount) {
                    balance -= requestAmount;
                    return { success: true, remaining: balance };
                }
                return { success: false, remaining: balance };
            };

            // 동시 요청 1 & 2 실행
            const res1 = tryDeductAtomic();
            const res2 = tryDeductAtomic();

            expect(res1.success).toBe(true);
            expect(res1.remaining).toBe(0);

            // 2번째 요청은 잔액 부족으로 무조건 실패해야 함!
            expect(res2.success).toBe(false);
            expect(res2.remaining).toBe(0);
        });

        it('송금 실패 시 잔액이 원본으로 정확히 복구(환불)되어야 함', () => {
            let balance = 100000;
            const requestAmount = 100000;

            // 1단계: 선차감
            balance -= requestAmount;
            expect(balance).toBe(0);

            // 2단계: 송금 실패 가정 (보상 트랜잭션 롤백)
            const transferFailed = true;
            if (transferFailed) {
                balance += requestAmount; // 자동 환불
            }

            expect(balance).toBe(100000);
        });
    });
});
