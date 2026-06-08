-- 크롤된 글을 명단(참여자)에 수동 연결하기 위한 컬럼 + RPC
-- 자동 매칭(뒤4자리/이름)은 프론트에서 계산, 수동 연결만 영구 저장
ALTER TABLE public.challenge_posts
  ADD COLUMN IF NOT EXISTS participant_id bigint REFERENCES public.challenge_participants(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.set_challenge_post_participant(p_post_id bigint, p_participant_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.challenge_posts SET participant_id = p_participant_id WHERE id = p_post_id;
END; $$;
