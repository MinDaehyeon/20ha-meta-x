-- 테스트 학생 프로필
INSERT INTO public.profiles (id, name, grade, role, approval_status, target_ei, is_active, is_test)
VALUES (
  '333d7ec3-4d63-4fd9-8b82-0ef825efd02e',
  '테스트학생',
  '고2',
  'student',
  'approved',
  81,
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  grade = EXCLUDED.grade,
  role = EXCLUDED.role,
  approval_status = EXCLUDED.approval_status,
  is_test = EXCLUDED.is_test;

-- 테스트 학부모 프로필
INSERT INTO public.profiles (id, name, grade, role, approval_status, target_ei, is_active, is_test)
VALUES (
  'c9ca37d6-7a4d-4602-8ca8-46b74ec9f4ec',
  '테스트학부모',
  '',
  'parent',
  'approved',
  0,
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  approval_status = EXCLUDED.approval_status,
  is_test = EXCLUDED.is_test;

-- 학부모-학생 연결
INSERT INTO public.parent_students (parent_id, student_id)
VALUES (
  'c9ca37d6-7a4d-4602-8ca8-46b74ec9f4ec',
  '333d7ec3-4d63-4fd9-8b82-0ef825efd02e'
) ON CONFLICT (parent_id, student_id) DO NOTHING;
