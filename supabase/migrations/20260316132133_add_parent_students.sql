-- 학부모-학생 연결 테이블
CREATE TABLE IF NOT EXISTS public.parent_students (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

-- RLS 활성화
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- 학부모: 자신의 연결 조회 가능
CREATE POLICY "parent_read_own"
  ON public.parent_students FOR SELECT
  USING (parent_id = auth.uid());

-- 학부모: 자녀 추가 가능 (즉시 연결)
CREATE POLICY "parent_insert_own"
  ON public.parent_students FOR INSERT
  WITH CHECK (parent_id = auth.uid());

-- 학부모: 자신의 연결 삭제 가능
CREATE POLICY "parent_delete_own"
  ON public.parent_students FOR DELETE
  USING (parent_id = auth.uid());

-- 관리자: 전체 조회/수정
CREATE POLICY "admin_all"
  ON public.parent_students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
