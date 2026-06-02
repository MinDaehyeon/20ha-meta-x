-- save_attendance_batch: entries에 같은 student_id가 중복 들어가도 안전하게 처리
-- ("ON CONFLICT DO UPDATE command cannot affect row a second time" 에러 방지)
-- 정책: 같은 호출 내 같은 학생이 여러 entry로 들어오면 분을 **합산** (입퇴장 반복 케이스)
--       기존 DB row와 충돌하면 더 큰 값으로 (재업로드 시 분이 줄어들지 않음)

CREATE OR REPLACE FUNCTION public.save_attendance_batch(
  p_session_date date,
  p_session_type text,
  p_entries      jsonb
)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE n int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  WITH agg AS (
    SELECT
      (e->>'student_id')::int                AS sid,
      SUM(NULLIF(e->>'minutes','')::int)     AS mins
    FROM jsonb_array_elements(p_entries) AS e
    GROUP BY (e->>'student_id')::int
  )
  INSERT INTO public.attendance_logs (student_id, session_date, session_type, participation_minutes)
    SELECT sid, p_session_date, p_session_type, mins::smallint FROM agg
  ON CONFLICT (student_id, session_date, session_type) DO UPDATE
    SET participation_minutes = GREATEST(
      COALESCE(attendance_logs.participation_minutes, 0),
      COALESCE(EXCLUDED.participation_minutes, 0)
    );
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
