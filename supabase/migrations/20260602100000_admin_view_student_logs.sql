-- 관리자 "학생 화면 보기" 메뉴 확장: 메타인지 분석 + 학습 기록 추가 지원
-- get_child_logs RPC에 admin role 분기 추가 (학부모 viewerMode와 동일 컴포넌트 재사용)

CREATE OR REPLACE FUNCTION public.get_child_logs(child_id uuid)
RETURNS SETOF public.learning_logs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.*
  FROM public.learning_logs l
  WHERE l.uid = child_id
    AND (
      EXISTS (
        SELECT 1 FROM public.parent_students ps
        WHERE ps.parent_id = auth.uid()
          AND ps.student_id = child_id
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  ORDER BY l.date DESC;
$$;
