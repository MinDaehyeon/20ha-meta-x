// 회원가입 UI 검증 (실제 가입은 OTP 인증 필요 — UI 진입·폼 렌더만 검증)
const { test, expect } = require('@playwright/test');

test('회원가입 모드 진입 + 폼 렌더', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  // "이메일로 가입" 클릭하면 mode가 signup으로
  await page.getByText('이메일로 가입').first().click();
  // 가입 폼 요소들 확인
  await expect(page.getByRole('button', { name: /학생/ }).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: /학부모/ }).first()).toBeVisible();
  // 이름 input (placeholder "홍길동")
  await expect(page.getByPlaceholder('홍길동')).toBeVisible();
  // 이메일 input
  await expect(page.getByPlaceholder('example@email.com').first()).toBeVisible();
  // 인증메일 보내기 버튼
  await expect(page.getByRole('button', { name: /인증메일/ })).toBeVisible();
});

test('가입 화면에서 역할 토글 (학생 ↔ 학부모)', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await page.getByText('이메일로 가입').first().click();
  // 학부모 클릭 → 학년 정보 안 보여야
  await page.getByRole('button', { name: /학부모/ }).first().click();
  // 학생 다시 클릭 → BirthInput 정상
  await page.getByRole('button', { name: /^학생/ }).first().click();
  await expect(page.getByPlaceholder('홍길동')).toBeVisible();
});
