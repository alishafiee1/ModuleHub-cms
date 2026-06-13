import { expect, test } from '@playwright/test';

const MODULE_PASSWORD = 'module-e2e-pass';

test.describe('Module Manager WAN flow', () => {
  test('guest sees gear on password-protected module and can authenticate', async ({ page }) => {
    const authResponse = await page.request.get('/api/auth/status');
    expect(authResponse.ok()).toBeTruthy();
    const authBody = await authResponse.json() as { isSuperAdmin: boolean };
    expect(authBody.isSuperAdmin).toBe(false);

    await page.goto('/');
    await page.waitForSelector('#cardCanvas', { state: 'visible' });

    const gear = page.locator('.card-canvas-item[data-module-id="mod-mm"] .gear-icon');
    await expect(gear).toBeVisible();

    await gear.click();
    await page.locator('.swal2-deny').click();

    await page.waitForSelector('.swal2-input');
    await page.fill('.swal2-input', MODULE_PASSWORD);
    await page.locator('.swal2-confirm').click();

    await expect.poll(async () => {
      const status = await page.request.get('/api/auth/status');
      const body = await status.json() as { managedModuleIds: string[] };
      return body.managedModuleIds.includes('mod-mm');
    }).toBe(true);

    await page.locator('.gear-action-btn[data-action="start"]').click();

    await expect.poll(async () => {
      const layout = await page.request.get('/api/layout');
      const body = await layout.json() as { modules: Record<string, { status: string }> };
      return body.modules['mod-mm']?.status;
    }).toBe('running');
  });
});
