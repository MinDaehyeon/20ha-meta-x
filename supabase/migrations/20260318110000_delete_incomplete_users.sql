-- 가입 미완료(미입력) 계정 삭제
-- auth.users 삭제 시 profiles는 CASCADE로 자동 삭제
DELETE FROM auth.users
WHERE id IN (
  SELECT id FROM public.profiles WHERE name = '미입력'
);

-- 혹시 profiles만 있고 auth.users 없는 경우 정리
DELETE FROM public.profiles WHERE name = '미입력';

-- 테스트용 SMTP 체크 계정 삭제
DELETE FROM auth.users WHERE email = 'test.smtp.check@gmail.com';
