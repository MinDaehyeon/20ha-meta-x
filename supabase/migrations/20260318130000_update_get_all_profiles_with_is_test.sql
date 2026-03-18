-- get_all_profiles RPC에 is_test 컬럼 포함하도록 업데이트
DROP FUNCTION IF EXISTS public.get_all_profiles();
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE (
  id uuid,
  name text,
  grade text,
  role text,
  approval_status text,
  avatar_url text,
  target_ei integer,
  is_active boolean,
  is_test boolean,
  created_at timestamptz,
  email text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.id, p.name, p.grade, p.role, p.approval_status,
    p.avatar_url, p.target_ei, p.is_active, p.is_test,
    p.created_at, u.email
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
$$;
