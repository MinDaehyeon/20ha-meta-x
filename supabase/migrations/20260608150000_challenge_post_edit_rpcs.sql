-- 참여자 학생이름 채우기 + 글 회차 변경 RPC (관리자)
CREATE OR REPLACE FUNCTION public.set_challenge_participant_name(p_id bigint, p_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.challenge_participants SET name = NULLIF(trim(p_name), '') WHERE id = p_id;
END; $$;

CREATE OR REPLACE FUNCTION public.set_challenge_post_round(p_post_id bigint, p_round int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.challenge_posts SET parsed_round = p_round WHERE id = p_post_id;
END; $$;
