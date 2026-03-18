-- OTP 인증 시 "미입력" 프로필 자동 생성 트리거 제거
-- 가입 폼 완료(handleSignup) 시에만 프로필이 생성되어야 함
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
