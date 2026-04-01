-- 명단 가나다순 정렬: sort_order 0으로 초기화 후 RPC에서 name 기준 정렬
UPDATE public.cert_students SET sort_order = 0;

-- get_cert_students: 가나다순(name) 정렬로 변경
CREATE OR REPLACE FUNCTION public.get_cert_students()
RETURNS SETOF public.cert_students
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM public.cert_students ORDER BY name;
$$;
