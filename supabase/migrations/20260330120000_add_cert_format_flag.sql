-- 양식 준수 여부 컬럼 추가
ALTER TABLE public.cafe_certifications
  ADD COLUMN IF NOT EXISTS is_valid_format BOOLEAN DEFAULT true;

-- 양식 미준수 글 조회 RPC (관리자용)
CREATE OR REPLACE FUNCTION public.get_invalid_certs(p_limit int DEFAULT 50)
RETURNS TABLE (
  id bigint,
  naver_nickname text,
  post_title text,
  post_url text,
  posted_at timestamptz,
  matched_profile_name text
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT c.id, c.naver_nickname, c.post_title, c.post_url, c.posted_at,
    p.name AS matched_profile_name
  FROM public.cafe_certifications c
  LEFT JOIN public.profiles p ON p.naver_nickname = c.naver_nickname
  WHERE c.is_valid_format = false
  ORDER BY c.posted_at DESC
  LIMIT p_limit;
$$;
