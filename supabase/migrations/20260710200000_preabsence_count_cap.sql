-- Phase 2: 사전결석 카운팅 한도 (미라클 모닝 3회 / 미라클 나잇 5회)
-- 기록(pre_absence 행)은 모두 유지, 카운트(숫자)에서만 초과분 제외.
-- 학생·타입별 회차 빠른 순으로 한도 내 N개만 출석 인정, 나머지 초과분은 미인정.
CREATE OR REPLACE FUNCTION public.get_class_attendance_stats()
RETURNS TABLE(student_name text, morning_count integer, night_count integer)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH pa AS (
    SELECT id,
      row_number() OVER (PARTITION BY student_id, session_type ORDER BY session_date, id) AS rnk
    FROM public.attendance_logs
    WHERE pre_absence = true
  ),
  cnt AS (
    SELECT a.student_id, a.session_type,
      CASE
        WHEN a.pre_absence THEN (pa.rnk <= CASE a.session_type WHEN 'M' THEN 3 ELSE 5 END)
        ELSE true
      END AS ok
    FROM public.attendance_logs a
    LEFT JOIN pa ON pa.id = a.id
  )
  SELECT s.name,
    COALESCE(SUM(CASE WHEN c.session_type='M' AND c.ok THEN 1 ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN c.session_type='N' AND c.ok THEN 1 ELSE 0 END), 0)::int
  FROM public.cert_students s
  LEFT JOIN cnt c ON c.student_id = s.id
  WHERE s.sort_order < 43
  GROUP BY s.name
  ORDER BY s.name;
$$;
