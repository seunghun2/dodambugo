-- 1. B2B 알림 템플릿 관리 테이블 생성
CREATE TABLE IF NOT EXISTS b2b_notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT UNIQUE NOT NULL, -- deposit_alert (정산), deceased_alert (부고), notice_alert (공지), signup_approved (가입승인)
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 기본 템플릿 데이터 주입 (인서트)
INSERT INTO b2b_notification_templates (event_type, title, content)
VALUES 
('deposit_alert', '[부고온] 예치금 정산 완료 알림', '안녕하세요 #{name} 파트너님, 금일 정산 금액 #{amount}원이 예치금 잔액에 정상 반영되었습니다. 확인해 주세요.'),
('deceased_alert', '[부고온] 신규 부고 생성 알림', '안녕하세요 #{name} 파트너님, 신규 부고장(고 #{deceased}님)이 성공적으로 발행되었습니다.'),
('notice_alert', '[부고온] 신규 전체 공지 안내', '안녕하세요 파트너님, 부고온의 새로운 공지사항 [#{title}]이 등록되었으니 확인해 주시기 바랍니다.'),
('signup_approved', '[부고온] 파트너 가입 승인 완료 안내', '안녕하세요 #{name} 파트너님, 부고온 파트너 가입 심사가 완료되어 정상 승인되었습니다. 지금 로그인하여 서비스를 이용하실 수 있습니다.')
ON CONFLICT (event_type) DO NOTHING;


-- 2. B2B 통합 알림/문자/푸시 발송 이력 로그 테이블 생성
CREATE TABLE IF NOT EXISTS b2b_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    type TEXT NOT NULL, -- alimtalk (알림톡), sms (단문문자), lms (장문문자), push (앱 푸시)
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL, -- success (발송성공), fail (발송실패)
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가 (조회 속도 최적화)
CREATE INDEX IF NOT EXISTS idx_b2b_notification_logs_phone ON b2b_notification_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_b2b_notification_logs_created ON b2b_notification_logs(created_at DESC);
