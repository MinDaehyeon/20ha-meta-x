// E2E 공용 fixtures
// - 테스트 계정 정보
// - 회원가입 cleanup 헬퍼

const { createClient } = require('@supabase/supabase-js');

const TEST_ACCOUNTS = {
  admin:   { email: 'admin@meta-x.ai.kr',         password: '12345678' },
  student: { email: 'test.student@meta-x.ai.kr',  password: 'Test1234!' },
  parent:  { email: 'test.parent@meta-x.ai.kr',   password: 'TestParent1234!' },
};

// e2e 회원가입 테스트용 일회성 이메일 생성
function makeE2eEmail() {
  const ts = Date.now();
  return `e2e+${ts}@meta-x.ai.kr`;
}

// SERVICE_ROLE_KEY 로 직접 정리 — 로컬에서만 동작 (.env 키 필요)
function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 환경변수에 없습니다. .env 확인.');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// 'e2e+' 시작 이메일을 모두 삭제 (auth.users + profiles cascade)
async function cleanupE2eUsers() {
  const sb = adminClient();
  // auth.users는 service_role의 admin API로만 접근
  const { data, error } = await sb.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const targets = (data?.users || []).filter(u => u.email && u.email.startsWith('e2e+'));
  let deleted = 0;
  for (const u of targets) {
    const { error: delErr } = await sb.auth.admin.deleteUser(u.id);
    if (!delErr) deleted++;
  }
  return { found: targets.length, deleted };
}

module.exports = { TEST_ACCOUNTS, makeE2eEmail, cleanupE2eUsers };
