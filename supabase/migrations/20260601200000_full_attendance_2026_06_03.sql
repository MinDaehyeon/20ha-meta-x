-- 미라클 나이트 일정 변경: 5/29 → 6/3
-- 6/3은 변경된 일정이라 2기 전원 출석으로 처리 (기존 학생 + 미래 신규 학생 자동화)

-- 1) 기존 cert_students 전체에 6/3 'N' 출석 입력 (멱등)
INSERT INTO public.attendance_logs (student_id, session_date, session_type)
SELECT id, DATE '2026-06-03', 'N' FROM public.cert_students
ON CONFLICT (student_id, session_date, session_type) DO NOTHING;

-- 2) 미래 신규 cert_students 추가 시 자동으로 6/3 'N' 출석 부여 트리거
-- 다른 "전체 출석 회차"가 추가되면 이 함수에 INSERT 한 줄 더 추가하거나 새 트리거 생성
CREATE OR REPLACE FUNCTION public.cert_students_apply_full_attendance()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.attendance_logs (student_id, session_date, session_type)
  VALUES (NEW.id, DATE '2026-06-03', 'N')
  ON CONFLICT (student_id, session_date, session_type) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cert_students_full_attendance_2026_06_03 ON public.cert_students;
CREATE TRIGGER cert_students_full_attendance_2026_06_03
  AFTER INSERT ON public.cert_students
  FOR EACH ROW
  EXECUTE FUNCTION public.cert_students_apply_full_attendance();
