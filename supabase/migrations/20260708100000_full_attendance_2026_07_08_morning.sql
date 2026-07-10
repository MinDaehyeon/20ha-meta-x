-- 2026-07-08 미라클 모닝(M) 2기 전원 출석 처리 (운영 결정, 1회성 백필)
-- participation_minutes는 비워둠(NULL = 면제/행사 → 출석 인정, isValidAttendance=true).
-- 기존 기록이 있으면 그대로 보존(ON CONFLICT DO NOTHING) — 실제 참여 분을 덮어쓰지 않음.
INSERT INTO public.attendance_logs (student_id, session_date, session_type)
SELECT id, DATE '2026-07-08', 'M' FROM public.cert_students
ON CONFLICT (student_id, session_date, session_type) DO NOTHING;
