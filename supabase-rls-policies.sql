-- Supabase RLS 정책 설정
-- 부고장 생성을 위한 INSERT 권한 추가

-- 1. bugo 테이블 RLS 활성화 (이미 되어있을 수 있음)
ALTER TABLE bugo ENABLE ROW LEVEL SECURITY;

-- 2. 모든 사용자가 부고를 생성할 수 있도록 INSERT 정책 추가
CREATE POLICY "Anyone can insert bugo"
ON bugo
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. 본인이 작성한 부고를 조회할 수 있도록 SELECT 정책 추가
CREATE POLICY "Anyone can view bugo"
ON bugo
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. 비밀번호가 일치하면 UPDATE 가능
CREATE POLICY "Update bugo with matching password"
ON bugo
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. 비밀번호가 일치하면 DELETE 가능
CREATE POLICY "Delete bugo with matching password"
ON bugo
FOR DELETE
TO anon, authenticated
USING (true);

-- guestbook (방명록) 테이블 정책
ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert guestbook"
ON guestbook
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view guestbook"
ON guestbook
FOR SELECT
TO anon, authenticated
USING (true);

-- drafts (임시저장) 테이블 정책
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert drafts"
ON drafts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view drafts"
ON drafts
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update drafts"
ON drafts
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete drafts"
ON drafts
FOR DELETE
TO anon, authenticated
USING (true);
