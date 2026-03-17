-- 테스트 학부모 프로필 생성
INSERT INTO public.profiles (id, name, grade, role, approval_status, target_ei, is_active)
VALUES (
  '10950ba2-b1fe-48ef-a860-7f57c2de9bfd',
  '테스트학부모',
  '',
  'parent',
  'approved',
  0,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  approval_status = EXCLUDED.approval_status;

-- 테스트학생(고2)과 연결 (이미 있으면 무시)
INSERT INTO public.parent_students (parent_id, student_id)
VALUES (
  '10950ba2-b1fe-48ef-a860-7f57c2de9bfd',
  '032cabc2-3f32-4062-b089-3ab041f566b1'
)
ON CONFLICT (parent_id, student_id) DO NOTHING;
