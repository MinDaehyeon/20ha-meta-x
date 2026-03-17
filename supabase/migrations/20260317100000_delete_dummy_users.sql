-- 더미 데이터 계정 삭제 (김아란, 박소율 제외)
-- auth.users 삭제 시 CASCADE로 profiles, study_logs 등 함께 삭제됨

DELETE FROM auth.users
WHERE email IN (
  'test@20ha.kr',
  'student01@20ha.kr',
  'student02@20ha.kr',
  'student03@20ha.kr',
  'student04@20ha.kr',
  'student05@20ha.kr',
  'student06@20ha.kr',
  'student07@20ha.kr',
  'student08@20ha.kr',
  'student09@20ha.kr',
  'student10@20ha.kr',
  'mdhyun1324@gmail.com',
  'test.parent@meta-x.ai.kr'
);
