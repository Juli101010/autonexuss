const { test, expect } = require('@playwright/test');
const base = 'http://127.0.0.1:3001';

test('tutorial integral crea datos reales y permite revisar cola DelSol', async ({ page }) => {
  await page.goto(base + '/login.html');
  await page.fill('#email', 'admin@test.com');
  await page.fill('#password', '123456');
  await page.click('button:has-text("Entrar")');
  await page.waitForURL(/app\.html/);
  await page.goto(base + '/app.html#/dashboard');
  await page.click('.tutorial-help-btn');
  await expect(page.locator('.tutorial-card')).toContainText('Prueba integral real');
  await page.click('[data-act="demo-run"]');
  await expect(page.locator('[data-demo-out]')).toContainText('Prueba creada', { timeout: 30000 });
  await expect(page.locator('[data-act="demo-sync"]')).toBeEnabled();
  await expect(page).toHaveURL(/#\/peticiones\?petition_id=/, { timeout: 10000 });
  await page.goto(base + '/app.html#/delsol');
  await expect(page.locator('#panelDelSol')).toBeVisible();
  await expect(page.locator('#dsQueue')).toContainText(/pending|synced|error/i, { timeout: 10000 });
  await page.screenshot({ path: 'tmp_e2e_step57/tutorial-integral-real.png', fullPage: true });
});
