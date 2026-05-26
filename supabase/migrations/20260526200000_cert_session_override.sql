-- 인증글에 회차 수동 지정 (다중 회차 지원)
-- null = 자동 매칭 (작성일 기준)
-- 비어있지 않은 배열 = 명시 지정된 회차 번호들 (1-based)

ALTER TABLE public.cafe_certifications
  ADD COLUMN IF NOT EXISTS session_override smallint[];

-- 회차 지정 RPC
CREATE OR REPLACE FUNCTION public.update_cert_sessions(
  p_cert_id  bigint,
  p_sessions smallint[]
)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.cafe_certifications
  SET session_override = CASE
    WHEN p_sessions IS NULL OR array_length(p_sessions, 1) IS NULL THEN NULL
    ELSE p_sessions
  END
  WHERE id = p_cert_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- get_cert_records 갱신 (session_override 포함)
DROP FUNCTION IF EXISTS public.get_cert_records(text, int);
CREATE OR REPLACE FUNCTION public.get_cert_records(
  p_status text DEFAULT NULL,
  p_limit  int  DEFAULT 500
)
RETURNS TABLE (
  id                   bigint,
  naver_nickname       text,
  post_title           text,
  post_url             text,
  posted_at            timestamptz,
  crawled_at           timestamptz,
  is_valid_format      boolean,
  parsed_name          text,
  parsed_grade         text,
  parsed_code          text,
  title_match_status   text,
  assigned_student_id  integer,
  matched_student_name text,
  submit_score         smallint,
  mission_score        smallint,
  fidelity_score       smallint,
  completeness_score   numeric,
  compliance_score     numeric,
  session_override     smallint[]
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id, c.naver_nickname, c.post_title, c.post_url, c.posted_at, c.crawled_at,
    c.is_valid_format, c.parsed_name, c.parsed_grade, c.parsed_code,
    c.title_match_status, c.assigned_student_id,
    s.name AS matched_student_name,
    c.submit_score, c.mission_score, c.fidelity_score,
    c.completeness_score, c.compliance_score,
    c.session_override
  FROM public.cafe_certifications c
  LEFT JOIN public.cert_students s ON s.id = c.assigned_student_id
  WHERE (p_status IS NULL OR c.title_match_status = p_status)
  ORDER BY c.posted_at DESC
  LIMIT p_limit;
$$;

-- get_attendance_certs 갱신
DROP FUNCTION IF EXISTS public.get_attendance_certs(timestamptz, timestamptz);
CREATE OR REPLACE FUNCTION public.get_attendance_certs(
  p_from timestamptz,
  p_to   timestamptz
)
RETURNS TABLE (
  id                   bigint,
  naver_nickname       text,
  post_title           text,
  post_url             text,
  posted_at            timestamptz,
  is_valid_format      boolean,
  title_match_status   text,
  assigned_student_id  integer,
  submit_score         smallint,
  mission_score        smallint,
  fidelity_score       smallint,
  completeness_score   numeric,
  compliance_score     numeric,
  session_override     smallint[]
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id, c.naver_nickname, c.post_title, c.post_url, c.posted_at,
    c.is_valid_format, c.title_match_status, c.assigned_student_id,
    c.submit_score, c.mission_score, c.fidelity_score,
    c.completeness_score, c.compliance_score,
    c.session_override
  FROM public.cafe_certifications c
  WHERE c.posted_at >= p_from AND c.posted_at < p_to
  ORDER BY c.posted_at DESC;
$$;
