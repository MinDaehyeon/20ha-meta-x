-- cert 개선: score 컬럼, 새 매칭 트리거, get_cert_records 업데이트

-- 1. score 컬럼 추가
ALTER TABLE public.cafe_certifications
  ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT NULL;

-- 2. score 업데이트 RPC
CREATE OR REPLACE FUNCTION public.update_cert_score(
  p_cert_id bigint,
  p_score   numeric DEFAULT NULL
)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.cafe_certifications
  SET score = p_score
  WHERE id = p_cert_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 3. auto_assign 트리거 업데이트
--    1차: parsed_name + parsed_code(전화 뒷4자리) → cert_students 매칭
--    2차: naver_nickname → cert_students.naver_nicknames[] 배열 매칭
CREATE OR REPLACE FUNCTION public.auto_assign_by_nickname()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  matched_id INTEGER;
BEGIN
  IF NEW.assigned_student_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 1차: 제목 파싱 결과(이름+전화코드)로 매칭
  IF NEW.parsed_name IS NOT NULL AND NEW.parsed_code IS NOT NULL THEN
    SELECT id INTO matched_id
    FROM public.cert_students
    WHERE name = NEW.parsed_name
      AND RIGHT(REPLACE(COALESCE(phone, ''), '-', ''), 4) = NEW.parsed_code
    LIMIT 1;

    IF matched_id IS NOT NULL THEN
      NEW.assigned_student_id := matched_id;
      RETURN NEW;
    END IF;
  END IF;

  -- 2차: naver_nickname이 naver_nicknames 배열에 있는지 확인
  IF NEW.naver_nickname IS NOT NULL AND NEW.naver_nickname <> '' THEN
    SELECT id INTO matched_id
    FROM public.cert_students
    WHERE NEW.naver_nickname = ANY(COALESCE(naver_nicknames, '{}'))
    LIMIT 1;

    IF matched_id IS NOT NULL THEN
      NEW.assigned_student_id := matched_id;
      RETURN NEW;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. 매칭 성공 시 naver_nickname 자동 등록 (AFTER INSERT)
CREATE OR REPLACE FUNCTION public.auto_update_student_nickname()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.assigned_student_id IS NOT NULL AND NEW.naver_nickname IS NOT NULL THEN
    UPDATE public.cert_students
    SET naver_nicknames = array_append(COALESCE(naver_nicknames, '{}'), NEW.naver_nickname)
    WHERE id = NEW.assigned_student_id
      AND NOT (NEW.naver_nickname = ANY(COALESCE(naver_nicknames, '{}')));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_update_nickname ON public.cafe_certifications;
CREATE TRIGGER trg_auto_update_nickname
  AFTER INSERT ON public.cafe_certifications
  FOR EACH ROW EXECUTE FUNCTION public.auto_update_student_nickname();

-- 5. get_cert_records: cert_students JOIN으로 학생이름, score, crawled_at 추가
DROP FUNCTION IF EXISTS public.get_cert_records(text, int);

CREATE OR REPLACE FUNCTION public.get_cert_records(
  p_status text DEFAULT NULL,
  p_limit  int  DEFAULT 500
)
RETURNS TABLE (
  id                   bigint,
  naver_nickname       text,
  post_title           text,
  post_url             text,
  posted_at            timestamptz,
  crawled_at           timestamptz,
  is_valid_format      boolean,
  parsed_name          text,
  parsed_grade         text,
  parsed_code          text,
  title_match_status   text,
  assigned_student_id  integer,
  matched_student_name text,
  score                numeric
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    c.id, c.naver_nickname, c.post_title, c.post_url, c.posted_at, c.crawled_at,
    c.is_valid_format, c.parsed_name, c.parsed_grade, c.parsed_code,
    c.title_match_status, c.assigned_student_id,
    s.name AS matched_student_name,
    c.score
  FROM public.cafe_certifications c
  LEFT JOIN public.cert_students s ON s.id = c.assigned_student_id
  WHERE (p_status IS NULL OR c.title_match_status = p_status)
  ORDER BY c.posted_at DESC
  LIMIT p_limit;
$$;
