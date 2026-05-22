-- ════════════════════════════════════════════════════════════════
-- 만점 테스트 (Manjeom Test)
--   1) manjeom_tests        : 시험지 메타정보
--   2) manjeom_questions    : 문항 은행 (시험지와 독립, 재사용 가능)
--   3) manjeom_test_questions: 시험지-문항 매핑 (순서 보존)
--   4) manjeom_assignments  : 학생 배정
--   5) manjeom_attempts     : 시도 기록
-- ════════════════════════════════════════════════════════════════

-- ── 1) manjeom_tests ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.manjeom_tests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  is_published boolean NOT NULL DEFAULT false,
  created_by   uuid REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_manjeom_tests_published ON public.manjeom_tests(is_published);

-- ── 2) manjeom_questions (문항 은행) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.manjeom_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  q_type      text NOT NULL CHECK (q_type IN ('short','mcq')),
  prompt      text NOT NULL,
  image_url   text,
  choices     jsonb,          -- mcq: ["보기1","보기2",...]
  answers     jsonb NOT NULL, -- short: ["3/2","1 1/2","1.5"]  / mcq: ["보기2"] or 인덱스
  tags        text[],
  created_by  uuid REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_manjeom_questions_type ON public.manjeom_questions(q_type);

-- ── 3) manjeom_test_questions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.manjeom_test_questions (
  test_id      uuid NOT NULL REFERENCES public.manjeom_tests(id) ON DELETE CASCADE,
  question_id  uuid NOT NULL REFERENCES public.manjeom_questions(id) ON DELETE RESTRICT,
  q_order      int  NOT NULL,
  PRIMARY KEY (test_id, question_id),
  UNIQUE (test_id, q_order)
);
CREATE INDEX IF NOT EXISTS idx_mtq_test ON public.manjeom_test_questions(test_id);

-- ── 4) manjeom_assignments ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.manjeom_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id     uuid NOT NULL REFERENCES public.manjeom_tests(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (test_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON public.manjeom_assignments(student_id);

-- ── 5) manjeom_attempts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.manjeom_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      uuid NOT NULL REFERENCES public.manjeom_tests(id) ON DELETE CASCADE,
  student_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_no   int  NOT NULL,
  answers      jsonb NOT NULL, -- {question_id_str: "학생 답안"}
  wrong_q_ids  jsonb NOT NULL, -- [question_id, ...]
  is_pass      boolean NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (test_id, student_id, attempt_no)
);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON public.manjeom_attempts(student_id, test_id);

-- ════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.manjeom_tests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manjeom_questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manjeom_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manjeom_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manjeom_attempts       ENABLE ROW LEVEL SECURITY;

-- 헬퍼: admin 여부
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ── manjeom_tests RLS ──
DROP POLICY IF EXISTS p_tests_admin_all   ON public.manjeom_tests;
DROP POLICY IF EXISTS p_tests_student_read ON public.manjeom_tests;
CREATE POLICY p_tests_admin_all ON public.manjeom_tests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- 학생/학부모: 본인/자녀에게 배정된 시험지만 SELECT
CREATE POLICY p_tests_student_read ON public.manjeom_tests
  FOR SELECT USING (
    is_published = true AND (
      EXISTS (SELECT 1 FROM public.manjeom_assignments a
              WHERE a.test_id = manjeom_tests.id AND a.student_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.manjeom_assignments a
                 JOIN public.parent_students ps ON ps.student_id = a.student_id
                 WHERE a.test_id = manjeom_tests.id AND ps.parent_id = auth.uid())
    )
  );

-- ── manjeom_questions RLS ──
DROP POLICY IF EXISTS p_questions_admin_all   ON public.manjeom_questions;
DROP POLICY IF EXISTS p_questions_student_read ON public.manjeom_questions;
CREATE POLICY p_questions_admin_all ON public.manjeom_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- 학생/학부모: 본인/자녀에게 배정된 시험지에 포함된 문항만 SELECT
CREATE POLICY p_questions_student_read ON public.manjeom_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.manjeom_test_questions mtq
      JOIN public.manjeom_assignments a ON a.test_id = mtq.test_id
      WHERE mtq.question_id = manjeom_questions.id
        AND (a.student_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.parent_students ps
                        WHERE ps.student_id = a.student_id AND ps.parent_id = auth.uid()))
    )
  );

-- ── manjeom_test_questions RLS ──
DROP POLICY IF EXISTS p_mtq_admin_all   ON public.manjeom_test_questions;
DROP POLICY IF EXISTS p_mtq_student_read ON public.manjeom_test_questions;
CREATE POLICY p_mtq_admin_all ON public.manjeom_test_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY p_mtq_student_read ON public.manjeom_test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.manjeom_assignments a
      WHERE a.test_id = manjeom_test_questions.test_id
        AND (a.student_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.parent_students ps
                        WHERE ps.student_id = a.student_id AND ps.parent_id = auth.uid()))
    )
  );

-- ── manjeom_assignments RLS ──
DROP POLICY IF EXISTS p_assignments_admin_all   ON public.manjeom_assignments;
DROP POLICY IF EXISTS p_assignments_student_read ON public.manjeom_assignments;
CREATE POLICY p_assignments_admin_all ON public.manjeom_assignments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY p_assignments_student_read ON public.manjeom_assignments
  FOR SELECT USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parent_students ps
               WHERE ps.student_id = manjeom_assignments.student_id AND ps.parent_id = auth.uid())
  );

-- ── manjeom_attempts RLS ──
DROP POLICY IF EXISTS p_attempts_admin_all ON public.manjeom_attempts;
DROP POLICY IF EXISTS p_attempts_own_read  ON public.manjeom_attempts;
DROP POLICY IF EXISTS p_attempts_own_ins   ON public.manjeom_attempts;
CREATE POLICY p_attempts_admin_all ON public.manjeom_attempts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY p_attempts_own_read ON public.manjeom_attempts
  FOR SELECT USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parent_students ps
               WHERE ps.student_id = manjeom_attempts.student_id AND ps.parent_id = auth.uid())
  );
-- 학생 본인 INSERT만 허용 (submit RPC 우회 막기: RPC는 SECURITY DEFINER로 우회)
CREATE POLICY p_attempts_own_ins ON public.manjeom_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- 정답 비교 헬퍼
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.normalize_short(s text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(regexp_replace(coalesce(s,''), '\s+', '', 'g'));
$$;

-- ════════════════════════════════════════════════════════════════
-- RPC
-- ════════════════════════════════════════════════════════════════

-- 학생: 본인 배정 시험지 목록 + 시도 요약
CREATE OR REPLACE FUNCTION public.get_my_manjeom_tests()
RETURNS TABLE(
  test_id        uuid,
  title          text,
  description    text,
  question_count int,
  attempt_count  int,
  is_passed      boolean,
  last_attempt_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT t.id, t.title, t.description,
         (SELECT count(*)::int FROM public.manjeom_test_questions mtq WHERE mtq.test_id = t.id),
         (SELECT count(*)::int FROM public.manjeom_attempts at
            WHERE at.test_id = t.id AND at.student_id = auth.uid()),
         EXISTS (SELECT 1 FROM public.manjeom_attempts at
                 WHERE at.test_id = t.id AND at.student_id = auth.uid() AND at.is_pass = true),
         (SELECT max(at.submitted_at) FROM public.manjeom_attempts at
            WHERE at.test_id = t.id AND at.student_id = auth.uid())
  FROM public.manjeom_tests t
  JOIN public.manjeom_assignments a ON a.test_id = t.id AND a.student_id = auth.uid()
  WHERE t.is_published = true
  ORDER BY t.created_at DESC;
$$;

-- 학부모: 자녀 배정 시험지 목록
CREATE OR REPLACE FUNCTION public.get_child_manjeom_tests(p_child_id uuid)
RETURNS TABLE(
  test_id        uuid,
  title          text,
  description    text,
  question_count int,
  attempt_count  int,
  is_passed      boolean,
  last_attempt_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT t.id, t.title, t.description,
         (SELECT count(*)::int FROM public.manjeom_test_questions mtq WHERE mtq.test_id = t.id),
         (SELECT count(*)::int FROM public.manjeom_attempts at
            WHERE at.test_id = t.id AND at.student_id = p_child_id),
         EXISTS (SELECT 1 FROM public.manjeom_attempts at
                 WHERE at.test_id = t.id AND at.student_id = p_child_id AND at.is_pass = true),
         (SELECT max(at.submitted_at) FROM public.manjeom_attempts at
            WHERE at.test_id = t.id AND at.student_id = p_child_id)
  FROM public.manjeom_tests t
  JOIN public.manjeom_assignments a ON a.test_id = t.id AND a.student_id = p_child_id
  WHERE t.is_published = true
    AND (
      public.is_admin()
      OR EXISTS (SELECT 1 FROM public.parent_students ps
                 WHERE ps.student_id = p_child_id AND ps.parent_id = auth.uid())
    )
  ORDER BY t.created_at DESC;
$$;

-- 학생: 시험지 상세(문항 + 본인 마지막 시도 답안 복원)
CREATE OR REPLACE FUNCTION public.get_my_manjeom_test_detail(p_test_id uuid, p_student_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_sid uuid := COALESCE(p_student_id, auth.uid());
  v_allowed boolean;
  v_last_answers jsonb;
  v_is_passed boolean;
  v_questions jsonb;
  v_test jsonb;
BEGIN
  -- 권한: 본인 또는 부모 또는 admin
  SELECT (
    public.is_admin()
    OR v_sid = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parent_students ps
               WHERE ps.student_id = v_sid AND ps.parent_id = auth.uid())
  ) INTO v_allowed;
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  SELECT to_jsonb(t) - 'created_by' INTO v_test
  FROM public.manjeom_tests t WHERE t.id = p_test_id AND t.is_published = true;
  IF v_test IS NULL THEN
    RETURN NULL;
  END IF;

  -- 문항 목록 (정답은 절대 반환하지 않음)
  SELECT jsonb_agg(jsonb_build_object(
    'id', q.id,
    'q_type', q.q_type,
    'prompt', q.prompt,
    'image_url', q.image_url,
    'choices', q.choices,
    'q_order', mtq.q_order
  ) ORDER BY mtq.q_order) INTO v_questions
  FROM public.manjeom_test_questions mtq
  JOIN public.manjeom_questions q ON q.id = mtq.question_id
  WHERE mtq.test_id = p_test_id;

  -- 마지막 시도 답안
  SELECT at.answers, at.is_pass
    INTO v_last_answers, v_is_passed
  FROM public.manjeom_attempts at
  WHERE at.test_id = p_test_id AND at.student_id = v_sid
  ORDER BY at.attempt_no DESC LIMIT 1;

  RETURN jsonb_build_object(
    'test', v_test,
    'questions', COALESCE(v_questions, '[]'::jsonb),
    'last_answers', COALESCE(v_last_answers, '{}'::jsonb),
    'is_passed', COALESCE(v_is_passed, false)
  );
END;
$$;

-- 학생: 답안 제출 (서버 채점)
CREATE OR REPLACE FUNCTION public.submit_manjeom_attempt(p_test_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_assigned boolean;
  v_next_no int;
  v_wrong jsonb := '[]'::jsonb;
  v_is_pass boolean;
  v_total int := 0;
  v_q record;
  v_student_ans text;
  v_correct boolean;
  v_ans_arr jsonb;
  v_ans_elem jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- 배정 확인
  SELECT EXISTS (
    SELECT 1 FROM public.manjeom_assignments
    WHERE test_id = p_test_id AND student_id = v_uid
  ) INTO v_assigned;
  IF NOT v_assigned THEN RAISE EXCEPTION 'not assigned'; END IF;

  -- 이미 통과했으면 재제출 방지
  IF EXISTS (SELECT 1 FROM public.manjeom_attempts
             WHERE test_id = p_test_id AND student_id = v_uid AND is_pass = true) THEN
    RAISE EXCEPTION 'already passed';
  END IF;

  -- 다음 attempt_no
  SELECT COALESCE(max(attempt_no), 0) + 1 INTO v_next_no
  FROM public.manjeom_attempts WHERE test_id = p_test_id AND student_id = v_uid;

  -- 문항별 채점
  FOR v_q IN
    SELECT q.id, q.q_type, q.answers
    FROM public.manjeom_test_questions mtq
    JOIN public.manjeom_questions q ON q.id = mtq.question_id
    WHERE mtq.test_id = p_test_id
    ORDER BY mtq.q_order
  LOOP
    v_total := v_total + 1;
    v_student_ans := p_answers ->> (v_q.id::text);
    v_correct := false;
    v_ans_arr := v_q.answers;

    IF v_q.q_type = 'short' THEN
      FOR v_ans_elem IN SELECT * FROM jsonb_array_elements(v_ans_arr) LOOP
        IF public.normalize_short(v_student_ans) = public.normalize_short(v_ans_elem #>> '{}') THEN
          v_correct := true; EXIT;
        END IF;
      END LOOP;
    ELSE
      -- mcq: 정확히 일치
      FOR v_ans_elem IN SELECT * FROM jsonb_array_elements(v_ans_arr) LOOP
        IF (v_ans_elem #>> '{}') = coalesce(v_student_ans, '') THEN
          v_correct := true; EXIT;
        END IF;
      END LOOP;
    END IF;

    IF NOT v_correct THEN
      v_wrong := v_wrong || to_jsonb(v_q.id::text);
    END IF;
  END LOOP;

  v_is_pass := (jsonb_array_length(v_wrong) = 0 AND v_total > 0);

  INSERT INTO public.manjeom_attempts(test_id, student_id, attempt_no, answers, wrong_q_ids, is_pass)
  VALUES (p_test_id, v_uid, v_next_no, p_answers, v_wrong, v_is_pass);

  -- 학생에게는 틀린 문항 id를 알려주지 않음
  RETURN jsonb_build_object('attempt_no', v_next_no, 'is_pass', v_is_pass);
END;
$$;

-- 관리자: 시험지별 학생 결과 요약
CREATE OR REPLACE FUNCTION public.get_manjeom_results_by_test(p_test_id uuid)
RETURNS TABLE(
  student_id uuid,
  student_name text,
  attempt_count int,
  is_passed boolean,
  pass_attempt_no int,
  last_attempt_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT a.student_id,
         p.name,
         (SELECT count(*)::int FROM public.manjeom_attempts at
            WHERE at.test_id = p_test_id AND at.student_id = a.student_id),
         EXISTS (SELECT 1 FROM public.manjeom_attempts at
                 WHERE at.test_id = p_test_id AND at.student_id = a.student_id AND at.is_pass = true),
         (SELECT min(at.attempt_no) FROM public.manjeom_attempts at
            WHERE at.test_id = p_test_id AND at.student_id = a.student_id AND at.is_pass = true),
         (SELECT max(at.submitted_at) FROM public.manjeom_attempts at
            WHERE at.test_id = p_test_id AND at.student_id = a.student_id)
  FROM public.manjeom_assignments a
  JOIN public.profiles p ON p.id = a.student_id
  WHERE a.test_id = p_test_id
    AND public.is_admin()
  ORDER BY p.name;
$$;

-- 관리자: 시험지 시도 상세 (한 학생의 모든 시도)
CREATE OR REPLACE FUNCTION public.get_manjeom_attempts_detail(p_test_id uuid, p_student_id uuid)
RETURNS TABLE(
  attempt_no int,
  is_pass boolean,
  submitted_at timestamptz,
  wrong_q_ids jsonb,
  answers jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT at.attempt_no, at.is_pass, at.submitted_at, at.wrong_q_ids, at.answers
  FROM public.manjeom_attempts at
  WHERE at.test_id = p_test_id AND at.student_id = p_student_id
    AND public.is_admin()
  ORDER BY at.attempt_no;
$$;

-- 관리자: 학생별 시험지 결과 요약
CREATE OR REPLACE FUNCTION public.get_manjeom_results_by_student(p_student_id uuid)
RETURNS TABLE(
  test_id uuid,
  title text,
  attempt_count int,
  is_passed boolean,
  pass_attempt_no int,
  last_attempt_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT t.id, t.title,
         (SELECT count(*)::int FROM public.manjeom_attempts at
            WHERE at.test_id = t.id AND at.student_id = p_student_id),
         EXISTS (SELECT 1 FROM public.manjeom_attempts at
                 WHERE at.test_id = t.id AND at.student_id = p_student_id AND at.is_pass = true),
         (SELECT min(at.attempt_no) FROM public.manjeom_attempts at
            WHERE at.test_id = t.id AND at.student_id = p_student_id AND at.is_pass = true),
         (SELECT max(at.submitted_at) FROM public.manjeom_attempts at
            WHERE at.test_id = t.id AND at.student_id = p_student_id)
  FROM public.manjeom_assignments a
  JOIN public.manjeom_tests t ON t.id = a.test_id
  WHERE a.student_id = p_student_id
    AND public.is_admin()
  ORDER BY t.created_at DESC;
$$;

-- 관리자: 시험지 통계 (평균 시도 — 통과자 기준)
CREATE OR REPLACE FUNCTION public.get_manjeom_test_stats(p_test_id uuid)
RETURNS TABLE(
  assigned_count int,
  pass_count int,
  in_progress_count int,
  avg_pass_attempts numeric
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH per_student AS (
    SELECT a.student_id,
           (SELECT count(*) FROM public.manjeom_attempts at
              WHERE at.test_id = p_test_id AND at.student_id = a.student_id) AS attempts,
           (SELECT min(at.attempt_no) FROM public.manjeom_attempts at
              WHERE at.test_id = p_test_id AND at.student_id = a.student_id AND at.is_pass = true) AS pass_no
    FROM public.manjeom_assignments a
    WHERE a.test_id = p_test_id
  )
  SELECT
    (SELECT count(*)::int FROM per_student),
    (SELECT count(*)::int FROM per_student WHERE pass_no IS NOT NULL),
    (SELECT count(*)::int FROM per_student WHERE pass_no IS NULL AND attempts > 0),
    (SELECT round(avg(pass_no)::numeric, 2) FROM per_student WHERE pass_no IS NOT NULL)
  WHERE public.is_admin();
$$;

-- 관리자: 시험지에 문항 매핑 일괄 교체 (transaction-safe)
CREATE OR REPLACE FUNCTION public.set_manjeom_test_questions(p_test_id uuid, p_question_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_qid uuid;
  v_i int := 1;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin only'; END IF;
  DELETE FROM public.manjeom_test_questions WHERE test_id = p_test_id;
  FOREACH v_qid IN ARRAY p_question_ids LOOP
    INSERT INTO public.manjeom_test_questions(test_id, question_id, q_order)
    VALUES (p_test_id, v_qid, v_i);
    v_i := v_i + 1;
  END LOOP;
END;
$$;

-- 관리자: 학생 배정 diff 적용
CREATE OR REPLACE FUNCTION public.set_manjeom_assignments(p_test_id uuid, p_student_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sid uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin only'; END IF;
  -- 제거된 배정 삭제 (attempts는 RESTRICT 아님 → CASCADE 위험. 명시적으로 attempts 보존 위해 ON DELETE CASCADE 동작 인지)
  DELETE FROM public.manjeom_assignments
   WHERE test_id = p_test_id AND NOT (student_id = ANY(p_student_ids));
  -- 신규 배정 추가
  FOREACH v_sid IN ARRAY p_student_ids LOOP
    INSERT INTO public.manjeom_assignments(test_id, student_id)
    VALUES (p_test_id, v_sid)
    ON CONFLICT (test_id, student_id) DO NOTHING;
  END LOOP;
END;
$$;

-- ════════════════════════════════════════════════════════════════
-- 이미지 Storage 버킷
-- ════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('manjeom-images', 'manjeom-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 읽기는 누구나, 쓰기/삭제는 admin만
DROP POLICY IF EXISTS p_manjeom_img_read   ON storage.objects;
DROP POLICY IF EXISTS p_manjeom_img_write  ON storage.objects;
DROP POLICY IF EXISTS p_manjeom_img_update ON storage.objects;
DROP POLICY IF EXISTS p_manjeom_img_delete ON storage.objects;
CREATE POLICY p_manjeom_img_read ON storage.objects
  FOR SELECT USING (bucket_id = 'manjeom-images');
CREATE POLICY p_manjeom_img_write ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'manjeom-images' AND public.is_admin());
CREATE POLICY p_manjeom_img_update ON storage.objects
  FOR UPDATE USING (bucket_id = 'manjeom-images' AND public.is_admin());
CREATE POLICY p_manjeom_img_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'manjeom-images' AND public.is_admin());
