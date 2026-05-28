// 인증 E2E — 로그인 / 잘못된 비밀번호
const { test, expect } = require('@playwright/test');
const { TEST_ACCOUNTS } = require('./fixtures');

test.describe.configure({ mode: 'serial' });

async function login(page, email, password) {
  await page.goto('/');
  await page.getByPlaceholder('example@email.com').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /^로그인/ }).click();
}

test('관리자 로그인 → /users 진입', async ({ page }) => {
  test.setTimeout(90000);
  await login(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
  await page.waitForURL(/\/users/, { timeout: 30000 });
  await expect(page.getByText('회원 관리').first()).toBeVisible({ timeout: 10000 });
});

test('학생 로그인 → 인증현황 또는 대시보드 진입', async ({ page }) => {
  test.setTimeout(90000);
  await login(page, TEST_ACCOUNTS.student.email, TEST_ACCOUNTS.student.password);
  // 학생은 ROSTER2 멤버면 /cert, 아니면 /dashboard 또는 /
  await page.waitForURL(url => !/\/$/.test(url.pathname) || url.pathname === '/', { timeout: 30000 }).catch(()=>{});
  // 로그인 후 어딘가 진입했음을 확인 — 본문에 학생 화면 시그니처가 있어야
  const ok = await Promise.race([
    page.getByText(/나의 20HA 인증 현황|나의 카페 인증 현황/).first().waitFor({ timeout: 20000 }).then(()=>true).catch(()=>false),
    page.getByText(/메타인지|학습 기록|EI/).first().waitFor({ timeout: 20000 }).then(()=>true).catch(()=>false),
  ]);
  expect(ok).toBe(true);
});

test('잘못된 비밀번호 → 에러 표시 + 로그인 화면 유지', async ({ page }) => {
  test.setTimeout(60000);
  await login(page, TEST_ACCOUNTS.admin.email, 'wrong-password-xxx');
  // 에러 메시지 — 한글/영문 모두 허용
  await expect(
    page.locator('body').getByText(/비밀번호|틀렸|올바르지|Invalid|credentials|실패/i)
  ).toBeVisible({ timeout: 15000 });
  // 로그인 폼이 여전히 보여야 (로그인 후 /users 같은 곳으로 이동 안 함)
  await expect(page.getByPlaceholder('example@email.com').first()).toBeVisible();
});
