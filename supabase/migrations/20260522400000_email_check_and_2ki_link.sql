-- ════════════════════════════════════════════════════════════════
-- 1) 비밀번호 찾기: 가입된 이메일 사전 체크
-- 2) 2기 학생 회원가입 시 자동 연동
-- ════════════════════════════════════════════════════════════════

-- ── 1) 이메일 존재 여부 (비밀번호 찾기 사전 체크) ─────────────
-- 보안 고려: 이메일 enumeration 가능 — 사용자 UX 우선 요구사항
CREATE OR REPLACE FUNCTION public.auth_email_exists(p_email text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(p_email)
  );
$$;
GRANT EXECUTE ON FUNCTION public.auth_email_exists(text) TO anon, authenticated;

-- ── 2) cert_students에 profiles 링크 컬럼 ───────────────────
ALTER TABLE public.cert_students
  ADD COLUMN IF NOT EXISTS linked_profile_id uuid
    UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 가입 시 자동 연동 RPC
--   같은 이름 unlinked 2기(sort_order < 43) 정확히 1명이면 링크
--   동명이인 / 매칭 없음 / 이미 링크됨 → 무시
CREATE OR REPLACE FUNCTION public.try_link_2ki_on_signup(p_profile_id uuid, p_name text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count int;
  v_id    int;
BEGIN
  IF p_profile_id IS NULL OR p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'invalid_input');
  END IF;

  -- 이미 다른 cert_students에 링크되어 있으면 패스
  IF EXISTS (SELECT 1 FROM public.cert_students WHERE linked_profile_id = p_profile_id) THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'already_linked');
  END IF;

  SELECT count(*), min(id) INTO v_count, v_id
  FROM public.cert_students
  WHERE name = p_name
    AND sort_order < 43
    AND linked_profile_id IS NULL;

  IF v_count = 0 THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'no_match');
  ELSIF v_count > 1 THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'ambiguous', 'match_count', v_count);
  ELSE
    UPDATE public.cert_students SET linked_profile_id = p_profile_id WHERE id = v_id;
    RETURN jsonb_build_object('linked', true, 'cert_student_id', v_id);
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_link_2ki_on_signup(uuid, text) TO authenticated;

-- 관리자가 수동으로 링크 가능
CREATE OR REPLACE FUNCTION public.admin_link_2ki(p_cert_student_id int, p_profile_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin only'; END IF;
  UPDATE public.cert_students SET linked_profile_id = p_profile_id WHERE id = p_cert_student_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_link_2ki(int, uuid) TO authenticated;
