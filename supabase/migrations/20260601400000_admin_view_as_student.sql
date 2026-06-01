-- 관리자 "학생으로 보기" 기능: 기존 get_child_* RPC들에 admin role 분기 추가
-- 학부모가 자녀 보는 흐름과 동일한 컴포넌트를 admin이 임의 학생 대상으로 사용 가능하게 함

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
    EXISTS (SELECT 1 FROM public.parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = p_child_id)
    OR auth.uid() = p_child_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  ORDER BY c.posted_at;
$$;

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
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
$$;
