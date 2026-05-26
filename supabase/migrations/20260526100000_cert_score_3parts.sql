-- 인증글 점수 3분할: 제출(50) + 필수미션(30) + 충실도(20)
-- completeness_score는 3개 합산을 자동 저장 (학생/명단 표 호환 유지)

-- 1. 컬럼 추가
ALTER TABLE public.cafe_certifications
  ADD COLUMN IF NOT EXISTS submit_score   smallint,
  ADD COLUMN IF NOT EXISTS mission_score  smallint,
  ADD COLUMN IF NOT EXISTS fidelity_score smallint;

-- 2. update_cert_scores 재정의 (3개 점수 입력 + 총합 자동 계산)
DROP FUNCTION IF EXISTS public.update_cert_scores(bigint, numeric, numeric);
DROP FUNCTION IF EXISTS public.update_cert_scores(bigint, smallint, smallint, smallint);

CREATE OR REPLACE FUNCTION public.update_cert_scores(
  p_cert_id  bigint,
  p_submit   smallint DEFAULT NULL,
  p_mission  smallint DEFAULT NULL,
  p_fidelity smallint DEFAULT NULL
)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.cafe_certifications
  SET
    submit_score       = p_submit,
    mission_score      = p_mission,
    fidelity_score     = p_fidelity,
    completeness_score = CASE
      WHEN p_submit IS NULL AND p_mission IS NULL AND p_fidelity IS NULL THEN NULL
      ELSE COALESCE(p_submit,0) + COALESCE(p_mission,0) + COALESCE(p_fidelity,0)
    END,
    compliance_score   = NULL
  WHERE id = p_cert_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 3. get_cert_records: 3개 새 컬럼 포함
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
  compliance_score     numeric
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id, c.naver_nickname, c.post_title, c.post_url, c.posted_at, c.crawled_at,
    c.is_valid_format, c.parsed_name, c.parsed_grade, c.parsed_code,
    c.title_match_status, c.assigned_student_id,
    s.name AS matched_student_name,
    c.submit_score, c.mission_score, c.fidelity_score,
    c.completeness_score, c.compliance_score
  FROM public.cafe_certifications c
  LEFT JOIN public.cert_students s ON s.id = c.assigned_student_id
  WHERE (p_status IS NULL OR c.title_match_status = p_status)
  ORDER BY c.posted_at DESC
  LIMIT p_limit;
$$;

-- 4. get_attendance_certs: 3개 새 컬럼 포함
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
  compliance_score     numeric
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id, c.naver_nickname, c.post_title, c.post_url, c.posted_at,
    c.is_valid_format, c.title_match_status, c.assigned_student_id,
    c.submit_score, c.mission_score, c.fidelity_score,
    c.completeness_score, c.compliance_score
  FROM public.cafe_certifications c
  WHERE c.posted_at >= p_from AND c.posted_at < p_to
  ORDER BY c.posted_at DESC;
$$;
