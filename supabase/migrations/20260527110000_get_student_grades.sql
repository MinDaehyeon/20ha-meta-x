-- 학생 학년 정보 조회 RPC
-- 학생/학부모가 다른 학생의 학년을 알아야 하는 화면(BEST 3, 학교급 그룹 매칭)에서 사용
-- RLS(auth.uid()=id)는 본인 row만 허용하므로 SECURITY DEFINER로 우회
-- 노출 컬럼: name, grade, birth_year, birth_month (민감 정보 없음)

CREATE OR REPLACE FUNCTION public.get_student_grades()
RETURNS TABLE (name text, grade text, birth_year int, birth_month int)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT p.name, p.grade, p.birth_year, p.birth_month
  FROM public.profiles p
  WHERE p.role = 'student'
    AND COALESCE(p.is_test, false) = false;
$$;
