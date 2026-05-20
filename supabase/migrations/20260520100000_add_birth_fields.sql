-- profiles에 생년월일 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_year  INT,
  ADD COLUMN IF NOT EXISTS birth_month INT,
  ADD COLUMN IF NOT EXISTS birth_day   INT;

-- 기존 grade 값 → birth_year 역산 (학년도 2026 기준, 기본 month=3, day=1)
-- 학년 번호: 초1=1 ~ 초6=6, 중1=7, 중2=8, 중3=9, 고1=10, 고2=11, 고3=12
-- birth_year = 2026 - grade_num - 6
UPDATE public.profiles SET
  birth_year  = CASE grade
    WHEN '초1' THEN 2019
    WHEN '초2' THEN 2018
    WHEN '초3' THEN 2017
    WHEN '초4' THEN 2016
    WHEN '초5' THEN 2015
    WHEN '초6' THEN 2014
    WHEN '중1' THEN 2013
    WHEN '중2' THEN 2012
    WHEN '중3' THEN 2011
    WHEN '고1' THEN 2010
    WHEN '고2' THEN 2009
    WHEN '고3' THEN 2008
    ELSE NULL
  END,
  birth_month = 3,
  birth_day   = 1
WHERE role = 'student' AND grade IS NOT NULL AND grade != '';

-- get_all_profiles RPC에 birth 필드 추가
DROP FUNCTION IF EXISTS public.get_all_profiles();
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE (
  id uuid,
  name text,
  grade text,
  role text,
  approval_status text,
  avatar_url text,
  target_ei integer,
  is_active boolean,
  is_test boolean,
  created_at timestamptz,
  email text,
  birth_year  int,
  birth_month int,
  birth_day   int
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.id, p.name, p.grade, p.role, p.approval_status,
    p.avatar_url, p.target_ei, p.is_active, p.is_test,
    p.created_at, u.email,
    p.birth_year, p.birth_month, p.birth_day
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
$$;
