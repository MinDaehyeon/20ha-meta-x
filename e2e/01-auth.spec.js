// 인증 E2E — 로그인 / 잘못된 비밀번호 / 로그아웃
const { test, expect } = require('@playwright/test');
const { TEST_ACCOUNTS } = require('./fixtures');

async function fillLogin(page, email, password) {
  await page.goto('/');
  await page.getByPlaceholder(/example@email\.com/).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /로그인/ }).click();
}

test.describe('로그인', () => {
  test('관리자 로그인 → /users 진입', async ({ page }) => {
    await fillLogin(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await expect(page).toHaveURL(/\/users/, { timeout: 15000 });
    await expect(page.getByText('회원 관리')).toBeVisible();
  });

  test('학생 로그인 → 인증현황 화면', async ({ page }) => {
    await fillLogin(page, TEST_ACCOUNTS.student.email, TEST_ACCOUNTS.student.password);
    // 학생은 2기 인증현황 페이지로 자동 진입
    await expect(page).toHaveURL(/\/cert/, { timeout: 15000 });
    await expect(page.getByText(/나의 20HA 인증 현황|나의 카페 인증 현황/)).toBeVisible();
  });

  test('잘못된 비밀번호 → 에러 메시지', async ({ page }) => {
    await fillLogin(page, TEST_ACCOUNTS.admin.email, 'wrong-password-xxx');
    // 에러 텍스트는 supabase 메시지가 한글로 매핑된 형태 (틀린/올바르지 않은/Invalid 등)
    await expect(page.getByText(/비밀번호|틀렸|올바르지|Invalid/)).toBeVisible({ timeout: 10000 });
    // 로그인 화면에 머물러야 함
    await expect(page).toHaveURL(/^https:\/\/[^/]+\/?$/);
  });
});
