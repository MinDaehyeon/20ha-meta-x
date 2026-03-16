-- 학부모가 연결된 자녀의 프로필을 읽을 수 있도록 허용
CREATE POLICY "parent_read_child_profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_students ps
      WHERE ps.parent_id = auth.uid()
        AND ps.student_id = profiles.id
    )
  );
