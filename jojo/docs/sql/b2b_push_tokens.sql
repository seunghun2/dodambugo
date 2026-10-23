-- b2b_push_tokens: FCM 푸시 토큰 저장 테이블
-- 파트너별, 플랫폼별로 FCM 토큰을 관리합니다.

CREATE TABLE IF NOT EXISTS b2b_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES b2b_users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown', -- 'ios', 'android', 'web'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, platform)
);

-- 파트너 ID로 토큰 조회 시 성능 최적화
CREATE INDEX idx_push_tokens_partner ON b2b_push_tokens(partner_id);
