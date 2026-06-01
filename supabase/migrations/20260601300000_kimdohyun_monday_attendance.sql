-- 김도현 학생 (cert_students.id=124) 매주 월요일 미라클 나이트 자동 출석
-- 사유: 매주 월요일 아이인사이드 영작 수업으로 불참 → 출석 인정
--
-- 운영 룰:
--   - 어제 이전 월요일만 자동 INSERT (미래 월요일은 미리 체크하지 않음)
--   - "화요일이 되면" 어제(=월요일) 자동 추가
--   - 적용 시점: 호출 시점 기준 "어제까지의 월요일들"
--   - 멱등 (ON CONFLICT DO NOTHING)

CREATE OR REPLACE FUNCTION public.apply_kimdohyun_monday_attendance()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_kim_id integer := 124; -- cert_students.id of 김도현
  v_start  date    := DATE '2026-05-17'; -- 2기 시작
  v_yest   date    := (now() AT TIME ZONE 'Asia/Seoul')::date - INTERVAL '1 day';
  v_count  integer;
BEGIN
  WITH ins AS (
    INSERT INTO public.attendance_logs (student_id, session_date, session_type)
    SELECT v_kim_id, d::date, 'N'
    FROM generate_series(v_start, v_yest::date, INTERVAL '1 day') AS d
    WHERE EXTRACT(DOW FROM d) = 1  -- 1 = 월요일
    ON CONFLICT (student_id, session_date, session_type) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM ins;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_kimdohyun_monday_attendance() TO authenticated;

-- 즉시 백필 (5/17 ~ 어제까지의 월요일들)
SELECT public.apply_kimdohyun_monday_attendance() AS backfilled_count;
