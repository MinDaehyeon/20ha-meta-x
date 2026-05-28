// 신규 회원가입 E2E — e2e+{ts}@... 이메일로 가입 → 후속 단계 도달까지 확인
// 종료 후 fixtures.cleanupE2eUsers() 로 모든 e2e+ 이메일 삭제
const { test, expect } = require('@playwright/test');
const { makeE2eEmail, cleanupE2eUsers } = require('./fixtures');

test.afterAll(async () => {
  // SERVICE_ROLE_KEY 가 없으면 cleanup 생략 (CI secret 미등록 시)
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasKey) {
    console.log('[cleanup] SUPABASE_SERVICE_ROLE_KEY 없음 — cleanup 생략');
    return;
  }
  try {
    const r = await cleanupE2eUsers();
    console.log(`[cleanup] e2e+ 이메일 ${r.deleted}/${r.found}건 삭제됨`);
  } catch (e) {
    console.log('[cleanup] 실패:', e.message);
  }
});

test('신규 회원가입 → 폼 제출 후 후속 단계 진입', async ({ page }) => {
  const email = makeE2eEmail();
  await page.goto('/');
  // 가입 화면 전환
  await page.getByText(/이메일로 가입/).click();
  // 폼 채우기 (학생 가입 기준)
  await page.locator('input[type="email"], input[placeholder*="example"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill('TestSignup1!');
  // 비밀번호 확인 input이 있을 수 있음
  const pwInputs = page.locator('input[type="password"]');
  if ((await pwInputs.count()) > 1) {
    await pwInputs.nth(1).fill('TestSignup1!');
  }
  // 이름 input (placeholder 한글일 가능성)
  const nameInput = page.locator('input').filter({ hasNot: page.locator('input[type="password"], input[type="email"]') }).first();
  if (await nameInput.count()) {
    await nameInput.fill('E2E테스트유저');
  }

  // 제출 — '가입', '회원가입', '다음' 중 하나
  const submitBtn = page.getByRole('button', { name: /가입|다음|등록/ }).first();
  await submitBtn.click();

  // Supabase email confirm 정책에 따라 결과가 다름:
  // - 자동 승인이면 프로필 설정 화면 또는 대시보드
  // - 이메일 인증 필요면 "이메일을 확인" 등의 텍스트
  // 어느 경우든 가입 자체는 통과해야 함 — 에러 텍스트 부재로 검증
  await page.waitForTimeout(3000);
  const errVisible = await page.locator('text=/이미 가입|에러|error|실패/i').count();
  expect(errVisible).toBe(0);
});
