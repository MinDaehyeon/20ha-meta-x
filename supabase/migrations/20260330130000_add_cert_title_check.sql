-- 제목 파싱 결과 저장 컬럼 추가
-- post_title 예시: "[3주차/일] 조성재/중1/6247"
-- parsed_name: "조성재", parsed_grade: "중1", parsed_code: "6247"
ALTER TABLE public.cafe_certifications
  ADD COLUMN IF NOT EXISTS parsed_name TEXT,
  ADD COLUMN IF NOT EXISTS parsed_grade TEXT,
  ADD COLUMN IF NOT EXISTS parsed_code TEXT,
  ADD COLUMN IF NOT EXISTS title_match_status TEXT DEFAULT 'unchecked';
-- title_match_status: 'matched' | 'name_mismatch' | 'grade_mismatch' | 'code_mismatch' | 'no_profile' | 'parse_failed' | 'unchecked'

-- 관리자용: 제목 파싱 정보 포함한 인증 현황 조회
CREATE OR REPLACE FUNCTION public.get_cert_status(p_from timestamptz, p_to timestamptz)
RETURNS TABLE (
  profile_id uuid,
  name text,
  grade text,
  naver_nickname text,
  cert_dates timestamptz[],
  cert_count int
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id,
    p.name,
    p.grade,
    p.naver_nickname,
    ARRAY_AGG(c.posted_at ORDER BY c.posted_at) FILTER (WHERE c.posted_at IS NOT NULL),
    COUNT(c.id)::int
  FROM public.profiles p
  LEFT JOIN public.cafe_certifications c
    ON c.naver_nickname = p.naver_nickname
    AND c.posted_at BETWEEN p_from AND p_to
  WHERE p.role = 'student'
    AND p.approval_status = 'approved'
    AND p.is_test = false
  GROUP BY p.id, p.name, p.grade, p.naver_nickname
  ORDER BY p.name;
$$;

-- 관리자용: 양식 미준수 + 제목 불일치 목록
CREATE OR REPLACE FUNCTION public.get_cert_issues(p_limit int DEFAULT 100)
RETURNS TABLE (
  id bigint,
  naver_nickname text,
  post_title text,
  post_url text,
  posted_at timestamptz,
  is_valid_format boolean,
  parsed_name text,
  parsed_grade text,
  parsed_code text,
  title_match_status text,
  matched_profile_name text,
  matched_profile_grade text
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id, c.naver_nickname, c.post_title, c.post_url, c.posted_at,
    c.is_valid_format, c.parsed_name, c.parsed_grade, c.parsed_code,
    c.title_match_status,
    p.name AS matched_profile_name,
    p.grade AS matched_profile_grade
  FROM public.cafe_certifications c
  LEFT JOIN public.profiles p ON p.naver_nickname = c.naver_nickname
  WHERE c.is_valid_format = false
     OR c.title_match_status IN ('name_mismatch', 'grade_mismatch', 'code_mismatch', 'no_profile')
  ORDER BY c.posted_at DESC
  LIMIT p_limit;
$$;
