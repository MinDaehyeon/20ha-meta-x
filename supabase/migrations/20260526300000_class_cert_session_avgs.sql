-- 카페 인증 회차별 전체 평균 점수 RPC

-- 작성일 기반 자동 회차 계산 헬퍼
CREATE OR REPLACE FUNCTION public._cert_auto_session(p_posted timestamptz)
RETURNS smallint LANGUAGE sql IMMUTABLE AS $$
  WITH sessions(sn, d) AS (
    VALUES
      (1::smallint, '2026-05-20'::date),
      (2::smallint, '2026-05-24'::date),
      (3::smallint, '2026-05-27'::date),
      (4::smallint, '2026-05-31'::date),
      (5::smallint, '2026-06-03'::date),
      (6::smallint, '2026-06-07'::date),
      (7::smallint, '2026-06-10'::date),
      (8::smallint, '2026-06-14'::date),
      (9::smallint, '2026-06-17'::date),
      (10::smallint, '2026-06-21'::date),
      (11::smallint, '2026-06-24'::date),
      (12::smallint, '2026-06-28'::date),
      (13::smallint, '2026-07-01'::date),
      (14::smallint, '2026-07-05'::date),
      (15::smallint, '2026-07-08'::date),
      (16::smallint, '2026-07-12'::date)
  )
  SELECT sn FROM sessions
  WHERE d <= (p_posted AT TIME ZONE 'Asia/Seoul')::date
  ORDER BY d DESC LIMIT 1;
$$;

DROP FUNCTION IF EXISTS public.get_class_cert_session_avgs();

CREATE OR REPLACE FUNCTION public.get_class_cert_session_avgs()
RETURNS TABLE (session_num smallint, avg_score numeric, submitted_count int)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH expanded AS (
    SELECT
      c.assigned_student_id,
      c.completeness_score,
      unnest(
        COALESCE(c.session_override, ARRAY[public._cert_auto_session(c.posted_at)]::smallint[])
      ) AS session_num
    FROM public.cafe_certifications c
    JOIN public.cert_students cs ON cs.id = c.assigned_student_id
    WHERE cs.name <> '테스트학생'
      AND c.completeness_score IS NOT NULL
  ),
  -- 학생당 회차당 최고 점수 1건만 (다중 글이면 best)
  per_student AS (
    SELECT DISTINCT ON (assigned_student_id, session_num)
      assigned_student_id, session_num, completeness_score
    FROM expanded
    WHERE session_num IS NOT NULL
    ORDER BY assigned_student_id, session_num, completeness_score DESC
  )
  SELECT session_num,
         ROUND(AVG(completeness_score)::numeric, 1) AS avg_score,
         COUNT(*)::int AS submitted_count
  FROM per_student
  GROUP BY session_num
  ORDER BY session_num;
$$;
