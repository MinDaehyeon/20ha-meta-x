-- 1. profiles에 is_test 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- 2. 테스트 학생 auth 계정 생성
--    email: test.student@meta-x.ai.kr / 비밀번호: Test1234!
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'test.student@meta-x.ai.kr',
  extensions.crypt('Test1234!', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false, 'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 3. 테스트 학생 프로필 생성
INSERT INTO public.profiles (id, name, grade, role, approval_status, target_ei, is_active, is_test)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
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

-- 4. 테스트 학부모 auth 계정 생성
--    email: test.parent@meta-x.ai.kr / 비밀번호: Test1234!
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'test.parent@meta-x.ai.kr',
  extensions.crypt('Test1234!', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false, 'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 5. 테스트 학부모 프로필 생성
INSERT INTO public.profiles (id, name, grade, role, approval_status, target_ei, is_active, is_test)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002',
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

-- 6. 학부모-학생 연결
INSERT INTO public.parent_students (parent_id, student_id)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000001'
) ON CONFLICT (parent_id, student_id) DO NOTHING;
