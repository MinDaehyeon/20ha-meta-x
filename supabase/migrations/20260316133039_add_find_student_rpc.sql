-- 이메일로 학생 찾기 (학부모 자녀 연결용)
CREATE OR REPLACE FUNCTION public.find_student_by_email(student_email text)
RETURNS TABLE(id uuid, name text, grade text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.grade
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE u.email = student_email
    AND p.role = 'student'
    AND p.approval_status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.find_student_by_email(text) TO authenticated;

-- 학부모가 연결된 자녀의 학습 기록 조회
CREATE OR REPLACE FUNCTION public.get_child_logs(child_id uuid)
RETURNS SETOF public.learning_logs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.*
  FROM public.learning_logs l
  WHERE l.uid = child_id
    AND EXISTS (
      SELECT 1 FROM public.parent_students ps
      WHERE ps.parent_id = auth.uid()
        AND ps.student_id = child_id
    )
  ORDER BY l.date DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_child_logs(uuid) TO authenticated;
