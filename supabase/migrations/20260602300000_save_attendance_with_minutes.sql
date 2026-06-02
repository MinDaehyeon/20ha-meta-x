-- save_attendance_batch 함수 변경: 학생별 분(minutes) 함께 INSERT
-- 같은 (학생, 날짜, 타입) 재업로드 시 더 큰 분 값으로 갱신
-- 옛 시그니처 (integer[])는 제거 (CSV 업로드 흐름만 호출)

DROP FUNCTION IF EXISTS public.save_attendance_batch(date, text, integer[]);

CREATE OR REPLACE FUNCTION public.save_attendance_batch(
  p_session_date date,
  p_session_type text,
  p_entries      jsonb  -- [{"student_id": 1, "minutes": 15}, ...]
)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE n int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  INSERT INTO public.attendance_logs (student_id, session_date, session_type, participation_minutes)
    SELECT (e->>'student_id')::int, p_session_date, p_session_type, (e->>'minutes')::smallint
    FROM jsonb_array_elements(p_entries) AS e
  ON CONFLICT (student_id, session_date, session_type) DO UPDATE
    SET participation_minutes = GREATEST(
      COALESCE(attendance_logs.participation_minutes, 0),
      COALESCE(EXCLUDED.participation_minutes, 0)
    );
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_attendance_batch(date, text, jsonb) TO authenticated;
