// 학생 카페 인증 점수 그래프 E2E
// 테스트학생 계정에 이미 5/20(80점), 5/24(90점) 데이터 주입되어 있음
const { test, expect } = require('@playwright/test');
const { TEST_ACCOUNTS } = require('./fixtures');

test('학생 카페 인증 점수 그래프 렌더링', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder(/example@email\.com/).fill(TEST_ACCOUNTS.student.email);
  await page.locator('input[type="password"]').fill(TEST_ACCOUNTS.student.password);
  await page.getByRole('button', { name: /로그인/ }).click();
  await page.waitForURL(/\/cert/, { timeout: 15000 });

  // 그래프 카드 진입 확인
  await expect(page.getByText('카페 인증 점수 그래프')).toBeVisible({ timeout: 10000 });

  // 미니 카드 5개 라벨
  await expect(page.getByText('내 누적 평균')).toBeVisible();
  await expect(page.getByText('80점 이상')).toBeVisible();
  await expect(page.getByText('내 최고/최저 점수')).toBeVisible();
  await expect(page.getByText('전체 누적 평균')).toBeVisible();
  await expect(page.getByText('전체 평균 대비')).toBeVisible();

  // 점수 가이드라인 노출
  await expect(page.getByText(/점수 가이드라인/)).toBeVisible();

  // 그래프 SVG가 그려졌는지 (recharts ComposedChart 컨테이너 내부 svg)
  const chartSvgCount = await page.locator('svg.recharts-surface').count();
  expect(chartSvgCount).toBeGreaterThan(0);
});
