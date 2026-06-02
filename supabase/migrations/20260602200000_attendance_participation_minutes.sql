-- 출석체크 룰 변경: 미라클 모닝 15분 이상, 나잇 60분 이상 참여 시에만 출석 인정
-- 출석 시 참여 분(participation_minutes)도 함께 기록
--
-- 단계
-- 1) attendance_logs 전체 DELETE (사용자 백업 완료 후 진행 — .scratch/attendance_backup.{json,sql})
-- 2) participation_minutes smallint 컬럼 추가 (NULL=면제·행사용)
-- 3) 6/3 전원 자동 출석 트리거 함수 + 김도현 월요일 함수 → participation_minutes 값과 함께 INSERT
-- 4) 하드코딩 재적용 (6/3 전원 N=60, 김도현 과거 월요일 N=60)

-- ────────────────────────────────────────────────────────
-- 1) 전체 삭제
-- ────────────────────────────────────────────────────────
DELETE FROM public.attendance_logs;

-- ────────────────────────────────────────────────────────
-- 2) 컬럼 추가
-- ────────────────────────────────────────────────────────
ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS participation_minutes smallint;

COMMENT ON COLUMN public.attendance_logs.participation_minutes IS
  '실제 참여 분. NULL=면제·행사 자동 출석 (예: 6/3 일정변경, 김도현 영작수업). 0 이상은 CSV 업로드 시 학생별 합산값';

-- ────────────────────────────────────────────────────────
-- 3) 트리거 함수 업데이트 — 6/3 전원 N 자동 출석 시 60분 함께 입력
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cert_students_apply_full_attendance()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.attendance_logs (student_id, session_date, session_type, participation_minutes)
  VALUES (NEW.id, DATE '2026-06-03', 'N', 60)
  ON CONFLICT (student_id, session_date, session_type) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────
-- 3-2) 김도현 월요일 함수 업데이트 — 60분 함께 입력
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_kimdohyun_monday_attendance()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_kim_id integer := 124;
  v_start  date    := DATE '2026-05-17';
  v_yest   date    := (now() AT TIME ZONE 'Asia/Seoul')::date - INTERVAL '1 day';
  v_count  integer;
BEGIN
  WITH ins AS (
    INSERT INTO public.attendance_logs (student_id, session_date, session_type, participation_minutes)
    SELECT v_kim_id, d::date, 'N', 60
    FROM generate_series(v_start, v_yest::date, INTERVAL '1 day') AS d
    WHERE EXTRACT(DOW FROM d) = 1
    ON CONFLICT (student_id, session_date, session_type) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM ins;
  RETURN v_count;
END;
$$;

-- ────────────────────────────────────────────────────────
-- 4) 하드코딩 재적용
-- ────────────────────────────────────────────────────────
-- 4-1) 6/3 전원 N=60 (트리거가 미래 학생에는 자동 처리하지만 기존 학생은 직접 INSERT)
INSERT INTO public.attendance_logs (student_id, session_date, session_type, participation_minutes)
SELECT id, DATE '2026-06-03', 'N', 60 FROM public.cert_students
ON CONFLICT (student_id, session_date, session_type) DO NOTHING;

-- 4-2) 김도현 어제까지 월요일 N=60
SELECT public.apply_kimdohyun_monday_attendance() AS kim_backfill_count;
