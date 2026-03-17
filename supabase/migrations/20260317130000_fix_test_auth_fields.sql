-- 깨진 테스트 auth.users 삭제 (profiles는 CASCADE로 함께 삭제됨)
-- Admin API로 재생성 예정
DELETE FROM auth.users
WHERE id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002'
);
