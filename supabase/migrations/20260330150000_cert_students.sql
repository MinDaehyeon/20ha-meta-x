-- 참석자 명단 테이블 (profiles와 별개)
CREATE TABLE public.cert_students (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  grade        TEXT,
  naver_nickname TEXT,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cert_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON public.cert_students
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 인증글에 수동 배정 컬럼 추가
ALTER TABLE public.cafe_certifications
  ADD COLUMN IF NOT EXISTS assigned_student_id INTEGER
    REFERENCES public.cert_students(id) ON DELETE SET NULL;

-- 명단 조회
CREATE OR REPLACE FUNCTION public.get_cert_students()
RETURNS SETOF public.cert_students
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM public.cert_students ORDER BY sort_order, name;
$$;

-- 명단 추가/수정 (p_id=NULL이면 INSERT, 있으면 UPDATE)
CREATE OR REPLACE FUNCTION public.upsert_cert_student(
  p_id             int     DEFAULT NULL,
  p_name           text    DEFAULT '',
  p_grade          text    DEFAULT NULL,
  p_naver_nickname text    DEFAULT NULL,
  p_sort_order     int     DEFAULT 0
)
RETURNS public.cert_students
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v public.cert_students;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO public.cert_students(name, grade, naver_nickname, sort_order)
      VALUES(p_name, p_grade, p_naver_nickname, p_sort_order)
      RETURNING * INTO v;
  ELSE
    UPDATE public.cert_students
      SET name=p_name, grade=p_grade, naver_nickname=p_naver_nickname, sort_order=p_sort_order
      WHERE id=p_id
      RETURNING * INTO v;
  END IF;
  RETURN v;
END;
$$;

-- 명단 삭제
CREATE OR REPLACE FUNCTION public.delete_cert_student(p_id int)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM public.cert_students WHERE id = p_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 인증글 → 학생 수동 배정 (p_student_id=NULL이면 배정 해제)
CREATE OR REPLACE FUNCTION public.assign_cert_to_student(
  p_cert_id    bigint,
  p_student_id int DEFAULT NULL
)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.cafe_certifications
    SET assigned_student_id = p_student_id
    WHERE id = p_cert_id
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 출석표용: 지정 기간 인증글 전체 조회 (학생 배정 정보 포함)
CREATE OR REPLACE FUNCTION public.get_attendance_certs(
  p_from timestamptz,
  p_to   timestamptz
)
RETURNS TABLE (
  id                  bigint,
  naver_nickname      text,
  post_title          text,
  post_url            text,
  posted_at           timestamptz,
  is_valid_format     boolean,
  title_match_status  text,
  assigned_student_id integer
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id, naver_nickname, post_title, post_url, posted_at,
         is_valid_format, title_match_status, assigned_student_id
  FROM public.cafe_certifications
  WHERE posted_at BETWEEN p_from AND p_to
  ORDER BY posted_at;
$$;