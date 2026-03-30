-- 관리자 UPDATE 정책 추가
CREATE POLICY "admin_update" ON public.cafe_certifications
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 관리자용: 인증글 목록 조회 (상태 필터 가능)
CREATE OR REPLACE FUNCTION public.get_cert_records(
  p_status text DEFAULT NULL,
  p_limit int DEFAULT 200
)
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
  matched_profile_id uuid,
  matched_profile_name text,
  matched_profile_grade text
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id, c.naver_nickname, c.post_title, c.post_url, c.posted_at,
    c.is_valid_format, c.parsed_name, c.parsed_grade, c.parsed_code,
    c.title_match_status,
    p.id, p.name, p.grade
  FROM public.cafe_certifications c
  LEFT JOIN public.profiles p ON p.naver_nickname = c.naver_nickname AND p.role = 'student'
  WHERE (p_status IS NULL OR c.title_match_status = p_status)
  ORDER BY c.posted_at DESC
  LIMIT p_limit;
$$;

-- 관리자용: 인증글 개별 수정
CREATE OR REPLACE FUNCTION public.update_cert_record(
  p_id bigint,
  p_parsed_name text DEFAULT NULL,
  p_parsed_grade text DEFAULT NULL,
  p_parsed_code text DEFAULT NULL,
  p_title_match_status text DEFAULT NULL,
  p_is_valid_format boolean DEFAULT NULL
)
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.cafe_certifications
  SET
    parsed_name        = COALESCE(p_parsed_name, parsed_name),
    parsed_grade       = COALESCE(p_parsed_grade, parsed_grade),
    parsed_code        = COALESCE(p_parsed_code, parsed_code),
    title_match_status = COALESCE(p_title_match_status, title_match_status),
    is_valid_format    = COALESCE(p_is_valid_format, is_valid_format)
  WHERE id = p_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
