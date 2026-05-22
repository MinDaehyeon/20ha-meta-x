-- ════════════════════════════════════════════════════════════════
-- 만점 테스트 보완:
--   1) 문항 시퀀스 ID (Q-1, Q-2, ...) 부여
--   2) get_child_manjeom_tests RPC 권한 버그 픽스 (학생 본인 호출 허용)
-- ════════════════════════════════════════════════════════════════

-- ── 1) seq 컬럼 추가 + 백필 ─────────────────────────
ALTER TABLE public.manjeom_questions
  ADD COLUMN IF NOT EXISTS seq SERIAL UNIQUE;

-- 기존 행 created_at 순서로 재정렬 (SERIAL 추가 시 순서 보장 안 됨)
-- 단, UNIQUE 제약이 있어 임시로 NULL 처리 후 채워야 함
DO $$
DECLARE
  r record;
  i int := 1;
BEGIN
  -- 임시로 큰 값으로 밀어두기
  UPDATE public.manjeom_questions SET seq = seq + 10000;
  FOR r IN
    SELECT id FROM public.manjeom_questions ORDER BY created_at, id
  LOOP
    UPDATE public.manjeom_questions SET seq = i WHERE id = r.id;
    i := i + 1;
  END LOOP;
  -- 시퀀스 다음값을 최댓값+1로 재설정
  PERFORM setval(
    pg_get_serial_sequence('public.manjeom_questions', 'seq'),
    GREATEST(coalesce((SELECT max(seq) FROM public.manjeom_questions), 0), 1),
    true
  );
END $$;

-- ── 2) get_child_manjeom_tests RPC 권한 픽스 ────────
-- 학생 본인이 자기 ID로 호출하는 경우도 허용
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
      auth.uid() = p_child_id  -- 학생 본인
      OR public.is_admin()
      OR EXISTS (SELECT 1 FROM public.parent_students ps
                 WHERE ps.student_id = p_child_id AND ps.parent_id = auth.uid())
    )
  ORDER BY t.created_at DESC;
$$;
