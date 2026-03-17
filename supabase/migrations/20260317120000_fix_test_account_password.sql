-- 테스트 계정 비밀번호 해시 수정 (올바른 bcrypt $2b$ 포맷)
UPDATE auth.users
SET encrypted_password = '$2b$10$RUmYaTWxMg.b.cbcLP6G6uFho1lAKnbjRnYQ42TJDy/0wmV/rakyK'
WHERE email IN ('test.student@meta-x.ai.kr', 'test.parent@meta-x.ai.kr');
