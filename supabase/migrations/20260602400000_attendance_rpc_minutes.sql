-- 출석 조회 RPC들이 participation_minutes 함께 반환하도록 갱신
-- 클라이언트가 미달자 표시 + 정확한 카운트(분 임계값 이상만)를 위해 필요

-- ────────────────────────────────────────────────────────
-- 1) get_my_attendance_logs
-- ────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_my_attendance_logs();
CREATE OR REPLACE FUNCTION public.get_my_attendance_logs()
RETURNS TABLE (
  session_date          date,
  session_type          text,
  participation_minutes smallint
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT a.session_date, a.session_type, a.participation_minutes
  FROM public.attendance_logs a
  WHERE a.student_id IN (
    SELECT id FROM public.cert_students
    WHERE name = (SELECT name FROM public.profiles WHERE id = auth.uid())
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_my_attendance_logs() TO authenticated;

-- ────────────────────────────────────────────────────────
-- 2) get_child_attendance_logs (admin/parent)
-- ────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_child_attendance_logs(uuid);
CREATE OR REPLACE FUNCTION public.get_child_attendance_logs(p_child_id uuid)
RETURNS TABLE (
  session_date          date,
  session_type          text,
  participation_minutes smallint
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT a.session_date, a.session_type, a.participation_minutes
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
GRANT EXECUTE ON FUNCTION public.get_child_attendance_logs(uuid) TO authenticated;

-- ────────────────────────────────────────────────────────
-- 3) get_attendance_logs (admin 전체 — 회원관리/전체현황 그리드)
-- ────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_attendance_logs(date, date);
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
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.get_attendance_logs(date, date) TO authenticated;
