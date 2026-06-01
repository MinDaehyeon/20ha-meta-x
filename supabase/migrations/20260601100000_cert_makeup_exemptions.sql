-- Make-up 대상자 수동 제외 — 학생 × 회차 단위, 사유 필수, 해제 가능
-- 운영 사유(질병/가정 일정/학교 행사 등)로 관리자가 특정 회차의 경고를 면제 처리

CREATE TABLE IF NOT EXISTS public.cert_makeup_exemptions (
  id            bigserial PRIMARY KEY,
  student_id    integer     NOT NULL REFERENCES public.cert_students(id) ON DELETE CASCADE,
  session_idx   smallint    NOT NULL CHECK (session_idx >= 1),
  reason        text        NOT NULL CHECK (length(btrim(reason)) > 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        NOT NULL,
  revoked_at    timestamptz,
  revoked_by    uuid,
  revoke_reason text
);

-- 활성 면제는 (학생, 회차) 조합당 하나만 — 같은 회차에 중복 면제 방지
CREATE UNIQUE INDEX IF NOT EXISTS cert_makeup_exemptions_active_uniq
  ON public.cert_makeup_exemptions (student_id, session_idx)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS cert_makeup_exemptions_student_idx
  ON public.cert_makeup_exemptions (student_id);

ALTER TABLE public.cert_makeup_exemptions ENABLE ROW LEVEL SECURITY;

-- RLS: 직접 접근 금지. 모든 read/write는 SECURITY DEFINER RPC 경유.
DROP POLICY IF EXISTS cert_makeup_exemptions_block ON public.cert_makeup_exemptions;
CREATE POLICY cert_makeup_exemptions_block ON public.cert_makeup_exemptions FOR ALL USING (false);

-- ────────────────────────────────────────────────────────
-- RPC: 면제 생성
-- 같은 (student, session)에 이미 활성 면제가 있으면 사유만 갱신
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_makeup_exemption(
  p_student_id  integer,
  p_session_idx smallint,
  p_reason      text
)
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id     bigint;
  v_admin  uuid := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason required';
  END IF;

  -- 활성 면제 있으면 사유만 갱신
  UPDATE public.cert_makeup_exemptions
    SET reason = p_reason, created_at = now(), created_by = v_admin
    WHERE student_id = p_student_id
      AND session_idx = p_session_idx
      AND revoked_at IS NULL
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    INSERT INTO public.cert_makeup_exemptions (student_id, session_idx, reason, created_by)
      VALUES (p_student_id, p_session_idx, p_reason, v_admin)
      RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_makeup_exemption(integer, smallint, text) TO authenticated;

-- ────────────────────────────────────────────────────────
-- RPC: 면제 해제 (소프트 삭제 — 감사 추적용 row 보존)
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.revoke_makeup_exemption(
  p_id            bigint,
  p_revoke_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.cert_makeup_exemptions
    SET revoked_at = now(), revoked_by = v_admin, revoke_reason = NULLIF(btrim(p_revoke_reason), '')
    WHERE id = p_id AND revoked_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_makeup_exemption(bigint, text) TO authenticated;

-- ────────────────────────────────────────────────────────
-- RPC: 활성 면제 목록 조회 (관리자만)
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_makeup_exemptions()
RETURNS TABLE (
  id          bigint,
  student_id  integer,
  student_name text,
  session_idx smallint,
  reason      text,
  created_at  timestamptz,
  created_by  uuid
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    e.id, e.student_id, s.name AS student_name,
    e.session_idx, e.reason, e.created_at, e.created_by
  FROM public.cert_makeup_exemptions e
  JOIN public.cert_students s ON s.id = e.student_id
  WHERE e.revoked_at IS NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ORDER BY s.name, e.session_idx;
$$;

GRANT EXECUTE ON FUNCTION public.get_makeup_exemptions() TO authenticated;
