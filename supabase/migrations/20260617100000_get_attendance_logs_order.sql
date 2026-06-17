-- get_attendance_logs: 안정적 페이지네이션을 위해 ORDER BY 추가
-- 배경: PostgREST 기본 1000행 제한 때문에 출석이 1000건을 넘으면 관리자 "전체 현황"에서
--       최신 회차가 조용히 사라졌다. 클라이언트가 .range()로 1000건씩 페이지네이션하도록
--       바꿨고, 페이지 경계가 흔들리지 않도록 서버 정렬을 명시한다. (시그니처/반환형 동일)
CREATE OR REPLACE FUNCTION public.get_attendance_logs(p_from date, p_to date)
RETURNS TABLE (
  student_id            integer,
  student_name          text,
  session_date          date,
  session_type          text,
  participation_minutes smallint
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT a.student_id, s.name AS student_name, a.session_date, a.session_type, a.participation_minutes
  FROM public.attendance_logs a
  JOIN public.cert_students s ON s.id = a.student_id
  WHERE a.session_date >= p_from AND a.session_date <= p_to
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ORDER BY a.session_date, a.student_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_attendance_logs(date, date) TO authenticated;
