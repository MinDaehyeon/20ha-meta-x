-- 닉네임 기반 자동 배정 트리거
-- INSERT 시: cert_students에 동일 naver_nickname이 1명뿐이면 자동 배정
-- 2명 이상이면 건드리지 않음 (수동 배정 대상)

CREATE OR REPLACE FUNCTION public.auto_assign_by_nickname()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  matched_id INTEGER;
  match_count INTEGER;
BEGIN
  -- 이미 배정된 경우 스킵
  IF NEW.assigned_student_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 닉네임 없으면 스킵
  IF NEW.naver_nickname IS NULL OR NEW.naver_nickname = '' THEN
    RETURN NEW;
  END IF;

  -- 동일 닉네임 학생 수 확인
  SELECT COUNT(*), MIN(id)
    INTO match_count, matched_id
    FROM public.cert_students
   WHERE naver_nickname = NEW.naver_nickname;

  -- 정확히 1명일 때만 자동 배정
  IF match_count = 1 THEN
    NEW.assigned_student_id := matched_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_cert ON public.cafe_certifications;
CREATE TRIGGER trg_auto_assign_cert
  BEFORE INSERT ON public.cafe_certifications
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_by_nickname();

-- 기존 미배정 인증글에도 소급 적용 (닉네임 1:1 매칭인 것만)
UPDATE public.cafe_certifications c
SET assigned_student_id = s.id
FROM public.cert_students s
WHERE c.assigned_student_id IS NULL
  AND c.naver_nickname IS NOT NULL
  AND c.naver_nickname = s.naver_nickname
  AND (
    SELECT COUNT(*) FROM public.cert_students
     WHERE naver_nickname = c.naver_nickname
  ) = 1;
