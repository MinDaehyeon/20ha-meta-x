// Playwright E2E 설정
// 동작: dev preview URL을 기본 대상으로 핵심 사용자 플로우 검증
// 실행: npm run test:e2e (headless) / npm run test:e2e:ui (UI 모드)

const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
// 로컬에서만 .env 로드 (CI는 env로 직접 주입). 파일 없으면 조용히 무시
try { require('dotenv').config({ path: path.join(__dirname, '../../.env') }); } catch (_) {}

module.exports = defineConfig({
  testDir: './e2e',
  // 회원가입 cleanup이 DB 공유 → 순차 실행 강제
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://20ha-meta-x-git-dev-mindaehyeons-projects.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // CI(Linux) 에서 동작하는 표준 설정. 로컬 Windows는 OS 정책으로 pipe 차단되어 미동작.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
