-- 관리자용: 기간별 인증 현황 조회
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

-- 학생 본인용: 본인 인증 이력 조회
CREATE OR REPLACE FUNCTION public.get_my_cert_history()
RETURNS TABLE (
  post_title text,
  post_url text,
  posted_at timestamptz
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT c.post_title, c.post_url, c.posted_at
  FROM public.cafe_certifications c
  JOIN public.profiles p ON p.naver_nickname = c.naver_nickname
  WHERE p.id = auth.uid()
    AND p.naver_nickname IS NOT NULL
  ORDER BY c.posted_at DESC;
$$;

-- 관리자용: 닉네임 업데이트
CREATE OR REPLACE FUNCTION public.update_naver_nickname(p_profile_id uuid, p_nickname text)
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.profiles
  SET naver_nickname = p_nickname
  WHERE id = p_profile_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
