-- 순환 참조 유발하는 RLS 정책 제거
DROP POLICY IF EXISTS "parent_read_child_profiles" ON public.profiles;

-- SECURITY DEFINER 함수: 학부모가 연결된 자녀 프로필 조회 (RLS 우회)
CREATE OR REPLACE FUNCTION public.get_child_profiles()
RETURNS TABLE(id uuid, name text, grade text, role text, approval_status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.grade, p.role, p.approval_status
  FROM public.parent_students ps
  JOIN public.profiles p ON p.id = ps.student_id
  WHERE ps.parent_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_child_profiles() TO authenticated;
