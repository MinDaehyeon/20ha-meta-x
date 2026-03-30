-- 네이버 카페 인증글 저장 테이블
CREATE TABLE public.cafe_certifications (
  id BIGSERIAL PRIMARY KEY,
  naver_nickname TEXT NOT NULL,
  post_title TEXT,
  post_url TEXT,
  post_snippet TEXT,
  posted_at TIMESTAMPTZ NOT NULL,
  crawled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(naver_nickname, post_url)
);

-- profiles에 네이버 닉네임 컬럼 추가 (관리자가 직접 매핑)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS naver_nickname TEXT;

-- RLS 활성화
ALTER TABLE public.cafe_certifications ENABLE ROW LEVEL SECURITY;

-- 관리자만 읽기/쓰기 (크롤러는 service_role 키 사용)
CREATE POLICY "admin_read" ON public.cafe_certifications
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 학생 본인 인증 이력 조회 (naver_nickname 매핑된 경우)
CREATE POLICY "student_read_own" ON public.cafe_certifications
  FOR SELECT
  USING (
    naver_nickname = (SELECT naver_nickname FROM public.profiles WHERE id = auth.uid())
    AND (SELECT naver_nickname FROM public.profiles WHERE id = auth.uid()) IS NOT NULL
  );
