-- 가입 미완성 auth 계정 정리 함수
-- 이메일 인증 후 가입하기 누르지 않고 이탈한 계정을 자동 삭제
-- 완성된 프로필(이름 있음)이 있는 계정은 절대 삭제하지 않음
CREATE OR REPLACE FUNCTION public.cleanup_incomplete_signup(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_has_complete_profile boolean;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id
      AND name IS NOT NULL
      AND name != ''
      AND name != '미입력'
  ) INTO v_has_complete_profile;

  IF v_has_complete_profile THEN
    RETURN false; -- 정상 가입자 → 건드리지 않음
  END IF;

  DELETE FROM auth.users WHERE id = v_user_id;
  RETURN true;
END;
$$;
