// @ts-check
/* E2E 配置：真实 Chromium 打开本地静态服务器跑全站冒烟 */
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 1, /* 兜底高负载下的瞬态布局误报；持续失败重试后仍会暴露 */
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    headless: true
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'node tools/e2e-server.js',
    url: 'http://localhost:4173/',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
