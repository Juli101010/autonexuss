const { test, expect } = require('@playwright/test');
const base = 'http://127.0.0.1:3001';

test('admin UI routes, tutorial and DelSol panel render natively', async ({ page }) => {
  await page.goto(base + '/login.html');
  await expect(page.locator('text=Acceso al sistema')).toBeVisible();
  await page.fill('#email', 'admin@test.com');
  await page.fill('#password', '123456');
  await page.click('button:has-text("Entrar")');
  await page.waitForURL(/app\.html/);
  await expect(page.locator('[data-route="dashboard"]')).toBeVisible();

  await page.goto(base + '/app.html#/dashboard');
  await expect(page.locator('.app-kpi-link[data-goto="peticiones"]')).toBeVisible();
  await page.locator('.app-kpi-link[data-goto="peticiones"]').first().click();
  await expect(page).toHaveURL(/#\/peticiones/);
  await expect(page.locator('#panelPeticiones')).toBeVisible();
  await expect(page.locator('text=Admin — Peticiones')).toHaveCount(0);

  await page.goto(base + '/app.html#/facturacion');
  await expect(page.locator('#factBody')).toBeVisible();
  await expect(page.locator('text=Peticiones listas para facturar')).toBeVisible();

  await page.goto(base + '/app.html#/controles');
  await expect(page.locator('#panelControlesNative')).toBeVisible();
  await expect(page.locator('text=Ledger')).toBeVisible();

  await page.goto(base + '/app.html#/citas');
  await expect(page.locator('#panelCitas')).toBeVisible();
  await expect(page.locator('text=Flujo de citas')).toBeVisible();
  await expect(page.locator('pre')).toHaveCount(0);

  await page.goto(base + '/app.html#/delsol');
  await expect(page.locator('#panelDelSol')).toBeVisible();
  await expect(page.locator('#dsMode')).toContainText(/live|mock|read_only/i, { timeout: 10000 });
  await expect(page.locator('#dsQueue')).toBeVisible();

  await page.click('.tutorial-help-btn');
  await expect(page.locator('.tutorial-card')).toBeVisible();
  await expect(page.locator('.tutorial-card')).toContainText('Ingreso operativo');
  const box = await page.locator('.tutorial-card').boundingBox();
  expect(box.width).toBeGreaterThan(250);
  expect(box.height).toBeGreaterThan(150);
  await page.screenshot({ path: 'tmp_e2e_step57/ui-admin-final.png', fullPage: true });
});

test('registro crea usuario no admin y entra al portal', async ({ page }) => {
  const email = `usuario-${Date.now()}@example.test`;
  await page.goto(base + '/register.html');
  await expect(page.locator('text=Crear cuenta')).toBeVisible();
  await page.fill('#email', email);
  await page.fill('#password', 'ClaveSegura123');
  await page.click('button:has-text("Crear cuenta de usuario")');
  await page.waitForURL(/app\.html#\/peticiones/);
  await expect(page.locator('#whoami')).toContainText('ARTIST');
  await expect(page.locator('[data-route="peticiones"]')).toBeVisible();
  await page.screenshot({ path: 'tmp_e2e_step57/ui-artist-register-final.png', fullPage: true });
});
