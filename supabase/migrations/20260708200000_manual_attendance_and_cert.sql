-- Phase 1: 관리자 전체현황 그리드 수동 편집 지원
--  (1) attendance_logs 사전결석 컬럼  (2) 수동 출석/결석/사전결석 RPC
--  (3) 수동 카페인증 생성 RPC  (4) 조회/통계 RPC에 pre_absence 반영(카운트 제외)
-- 사전결석은 "데이터만" 저장(카운트 규칙 모닝3·나잇5는 Phase 2에서 카운트 시 제외).

-- ─────────────────────────────────────────────────────────
-- (1) 스키마: 사전결석 여부 + 제출일(전날규칙 검증용)
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS pre_absence    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pre_absence_at date;

COMMENT ON COLUMN public.attendance_logs.pre_absence IS '사전결석 신청 행(=결석이지만 신청 기록). Phase1은 출석으로 카운트 안 함.';
COMMENT ON COLUMN public.attendance_logs.pre_absence_at IS '사전결석 신청 제출일(전날까지 규칙 검증용).';

-- ─────────────────────────────────────────────────────────
-- (2) 수동 출석 설정: 출석 / 결석 / 사전결석
--   present=true  → 출석(참여분 무관, minutes=NULL=면제 인정)
--   present=false & pre_absence=true  → 결석+사전결석 기록(행 남김, 카운트 제외)
--   present=false & pre_absence=false → 결석(행 삭제 = 미참여)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_set_attendance(
  p_student_id   int,
  p_session_date date,
  p_session_type text,     -- 'M' | 'N'
  p_present      boolean,
  p_pre_absence  boolean,
  p_pre_absence_at date
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  IF p_present THEN
    INSERT INTO public.attendance_logs (student_id, session_date, session_type, participation_minutes, pre_absence, pre_absence_at)
    VALUES (p_student_id, p_session_date, p_session_type, NULL, false, NULL)
    ON CONFLICT (student_id, session_date, session_type)
    DO UPDATE SET participation_minutes = NULL, pre_absence = false, pre_absence_at = NULL;
  ELSIF p_pre_absence THEN
    INSERT INTO public.attendance_logs (student_id, session_date, session_type, participation_minutes, pre_absence, pre_absence_at)
    VALUES (p_student_id, p_session_date, p_session_type, NULL, true, p_pre_absence_at)
    ON CONFLICT (student_id, session_date, session_type)
    DO UPDATE SET pre_absence = true, pre_absence_at = EXCLUDED.pre_absence_at, participation_minutes = NULL;
  ELSE
    DELETE FROM public.attendance_logs
    WHERE student_id = p_student_id AND session_date = p_session_date AND session_type = p_session_type;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_attendance(int,date,text,boolean,boolean,date) TO authenticated;

-- ─────────────────────────────────────────────────────────
-- (3) 수동 카페 인증 생성 (글이 없는 셀을 관리자가 인증 부여)
--   posted_at은 회차 날짜(정오 KST 기준)로 넣어 자동매칭도 자연스럽게.
--   session_override=[회차]로 고정 → 학생/관리자 화면에 해당 회차로 표시.
--   기존 인증 수정은 기존 update_cert_scores RPC 사용(클라이언트 분기).
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_create_manual_cert(
  p_student_id int,
  p_session_num int,
  p_posted_at   timestamptz,
  p_submit   smallint,
  p_mission  smallint,
  p_fidelity smallint
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_id bigint; sname text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  SELECT name INTO sname FROM public.cert_students WHERE id = p_student_id;

  INSERT INTO public.cafe_certifications
    (naver_nickname, post_title, post_url, posted_at, assigned_student_id,
     submit_score, mission_score, fidelity_score, completeness_score, session_override)
  VALUES
    (COALESCE(sname,'(수동)'), '[수동 인증] ' || COALESCE(sname,''), NULL,
     p_posted_at, p_student_id,
     p_submit, p_mission, p_fidelity,
     (COALESCE(p_submit,0) + COALESCE(p_mission,0) + COALESCE(p_fidelity,0))::numeric,
     ARRAY[p_session_num]::smallint[])
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_manual_cert(int,int,timestamptz,smallint,smallint,smallint) TO authenticated;

-- ─────────────────────────────────────────────────────────
-- (4) 조회 RPC에 pre_absence / pre_absence_at 노출
--     (클라이언트가 사전결석 행을 출석 카운트에서 제외 + 표시)
-- ─────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_my_attendance_logs();
CREATE OR REPLACE FUNCTION public.get_my_attendance_logs()
RETURNS TABLE (
  session_date          date,
  session_type          text,
  participation_minutes smallint,
  pre_absence           boolean,
  pre_absence_at        date
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT a.session_date, a.session_type, a.participation_minutes, a.pre_absence, a.pre_absence_at
  FROM public.attendance_logs a
  WHERE a.student_id IN (
    SELECT id FROM public.cert_students
    WHERE name = (SELECT name FROM public.profiles WHERE id = auth.uid())
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_my_attendance_logs() TO authenticated;

DROP FUNCTION IF EXISTS public.get_child_attendance_logs(uuid);
CREATE OR REPLACE FUNCTION public.get_child_attendance_logs(p_child_id uuid)
RETURNS TABLE (
  session_date          date,
  session_type          text,
  participation_minutes smallint,
  pre_absence           boolean,
  pre_absence_at        date
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT a.session_date, a.session_type, a.participation_minutes, a.pre_absence, a.pre_absence_at
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

-- get_attendance_logs: pre_absence 추가 + 기존 ORDER BY 유지(페이지네이션 안정)
DROP FUNCTION IF EXISTS public.get_attendance_logs(date, date);
CREATE OR REPLACE FUNCTION public.get_attendance_logs(p_from date, p_to date)
RETURNS TABLE (
  student_id            integer,
  student_name          text,
  session_date          date,
  session_type          text,
  participation_minutes smallint,
  pre_absence           boolean,
  pre_absence_at        date
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT a.student_id, s.name AS student_name, a.session_date, a.session_type,
         a.participation_minutes, a.pre_absence, a.pre_absence_at
  FROM public.attendance_logs a
  JOIN public.cert_students s ON s.id = a.student_id
  WHERE a.session_date >= p_from AND a.session_date <= p_to
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ORDER BY a.session_date, a.student_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_attendance_logs(date, date) TO authenticated;

-- ─────────────────────────────────────────────────────────
-- (5) 클래스 출석 통계: 사전결석 행은 카운트 제외 (Phase1)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_class_attendance_stats()
RETURNS TABLE(student_name text, morning_count integer, night_count integer)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT s.name,
    COALESCE(SUM(CASE WHEN a.session_type='M' THEN 1 ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN a.session_type='N' THEN 1 ELSE 0 END), 0)::int
  FROM public.cert_students s
  LEFT JOIN public.attendance_logs a
    ON a.student_id = s.id AND a.pre_absence = false
  WHERE s.sort_order < 43
  GROUP BY s.name
  ORDER BY s.name;
$$;
