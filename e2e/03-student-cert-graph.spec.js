// 학생 카페 인증 점수 그래프 E2E
// 테스트학생 계정에 5/20(80점), 5/24(90점) 데이터 주입되어 있음
const { test, expect } = require('@playwright/test');
const { TEST_ACCOUNTS } = require('./fixtures');

test('학생 카페 인증 점수 그래프 렌더링', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/');
  await page.getByPlaceholder('example@email.com').first().fill(TEST_ACCOUNTS.student.email);
  await page.locator('input[type="password"]').first().fill(TEST_ACCOUNTS.student.password);
  await page.getByRole('button', { name: /^로그인/ }).click();

  // /cert 또는 학생 화면 진입까지 대기
  await page.getByText(/나의 20HA 인증 현황|나의 카페 인증 현황/).first()
    .waitFor({ timeout: 30000 });

  // 그래프 카드 확인
  await expect(page.getByText('카페 인증 점수 그래프')).toBeVisible({ timeout: 15000 });

  // 미니 카드 5개 라벨
  await expect(page.getByText('내 누적 평균')).toBeVisible();
  await expect(page.getByText('80점 이상')).toBeVisible();
  await expect(page.getByText('내 최고/최저 점수')).toBeVisible();
  await expect(page.getByText('전체 누적 평균')).toBeVisible();
  await expect(page.getByText('전체 평균 대비')).toBeVisible();

  // 점수 가이드라인
  await expect(page.getByText(/점수 가이드라인/)).toBeVisible();

  // recharts SVG 렌더 확인
  const chartSvgCount = await page.locator('svg.recharts-surface').count();
  expect(chartSvgCount).toBeGreaterThan(0);
});
