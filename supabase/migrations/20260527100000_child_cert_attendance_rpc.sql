-- 1) get_my_cafe_certs 재정의: 3분할 점수 + session_override 포함
DROP FUNCTION IF EXISTS public.get_my_cafe_certs();

CREATE OR REPLACE FUNCTION public.get_my_cafe_certs()
RETURNS TABLE (
  id bigint,
  post_title text,
  post_url text,
  posted_at timestamptz,
  submit_score smallint,
  mission_score smallint,
  fidelity_score smallint,
  completeness_score numeric,
  session_override smallint[]
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT c.id, c.post_title, c.post_url, c.posted_at,
         c.submit_score, c.mission_score, c.fidelity_score,
         c.completeness_score, c.session_override
  FROM public.cafe_certifications c
  WHERE c.assigned_student_id IN (
    SELECT id FROM public.cert_students
    WHERE name = (SELECT name FROM public.profiles WHERE id = auth.uid())
  )
  ORDER BY c.posted_at;
$$;

-- 2) get_child_cafe_certs: 학부모가 연결된 자녀의 카페 인증 조회
CREATE OR REPLACE FUNCTION public.get_child_cafe_certs(p_child_id uuid)
RETURNS TABLE (
  id bigint,
  post_title text,
  post_url text,
  posted_at timestamptz,
  submit_score smallint,
  mission_score smallint,
  fidelity_score smallint,
  completeness_score numeric,
  session_override smallint[]
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT c.id, c.post_title, c.post_url, c.posted_at,
         c.submit_score, c.mission_score, c.fidelity_score,
         c.completeness_score, c.session_override
  FROM public.cafe_certifications c
  WHERE c.assigned_student_id IN (
    SELECT id FROM public.cert_students
    WHERE name = (SELECT name FROM public.profiles WHERE id = p_child_id)
  )
  AND (
    -- 학부모 본인의 자녀이거나, 본인이 그 자녀일 때
    EXISTS (SELECT 1 FROM public.parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = p_child_id)
    OR auth.uid() = p_child_id
  )
  ORDER BY c.posted_at;
$$;

-- 3) get_child_attendance_logs: 학부모가 연결된 자녀의 모닝/나잇 출석 조회
CREATE OR REPLACE FUNCTION public.get_child_attendance_logs(p_child_id uuid)
RETURNS TABLE (
  session_date date,
  session_type text
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT a.session_date, a.session_type
  FROM public.attendance_logs a
  WHERE a.student_id IN (
    SELECT id FROM public.cert_students
    WHERE name = (SELECT name FROM public.profiles WHERE id = p_child_id)
  )
  AND (
    EXISTS (SELECT 1 FROM public.parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = p_child_id)
    OR auth.uid() = p_child_id
  );
$$;
