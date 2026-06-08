-- 챌린지 명단: 학생/학부모/연락처 분리 + 부가정보(meta) 저장
ALTER TABLE public.challenge_participants ALTER COLUMN name DROP NOT NULL;       -- 학생 이름 없을 수 있음(학부모만)
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS parent_name text;
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS meta jsonb;

-- 기존 (challenge_key, name) 유니크 제거 → (학생·학부모·연락처) 조합 유니크로
ALTER TABLE public.challenge_participants DROP CONSTRAINT IF EXISTS challenge_participants_challenge_key_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS challenge_participants_uniq
  ON public.challenge_participants (challenge_key, coalesce(name,''), coalesce(parent_name,''), coalesce(phone,''));

-- 명단 일괄 설정 RPC: 단순 이름 목록 입력(관리자 UI용). 새 유니크에 맞춰 ON CONFLICT 갱신.
CREATE OR REPLACE FUNCTION public.set_challenge_participants(p_key text, p_names text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.challenge_participants WHERE challenge_key = p_key;
  INSERT INTO public.challenge_participants (challenge_key, name)
  SELECT DISTINCT p_key, trim(n) FROM unnest(p_names) AS n WHERE trim(n) <> ''
  ON CONFLICT (challenge_key, coalesce(name,''), coalesce(parent_name,''), coalesce(phone,'')) DO NOTHING;
END; $$;
