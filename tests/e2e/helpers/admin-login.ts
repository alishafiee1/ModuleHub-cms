import { expect, type Page } from '@playwright/test';

/**
 * Opens the home page and waits until super-admin dev mode and card canvas are ready.
 * Requires MODULEHUB_DEV_SUPER_ADMIN=1 on the test server.
 */
export async function openHomeAsSuperAdmin(page: Page): Promise<void> {
  const authResponse = await page.request.get('/api/auth/status');
  expect(authResponse.ok()).toBeTruthy();
  const authBody = await authResponse.json() as { isSuperAdmin: boolean };
  expect(authBody.isSuperAdmin).toBe(true);

  await page.goto('/');
  await page.waitForSelector('#cardCanvas', { state: 'visible' });
  await page.waitForFunction(() => Boolean(window.CardCanvas?.getGridInnerWidth));
}

/**
 * Enters layout edit mode via the toolbar toggle.
 */
export async function enterLayoutEditMode(page: Page): Promise<void> {
  const toolbar = page.locator('.layout-edit-toolbar');
  await expect(toolbar).toBeVisible();
  const editBtn = page.locator('#layoutEditToggleBtn');
  await editBtn.click();
  await expect(page.locator('#cardCanvas.card-canvas--edit-mode')).toBeVisible();
}

/**
 * Exits layout edit mode and waits for the edit-ended lifecycle.
 */
export async function exitLayoutEditMode(page: Page): Promise<void> {
  const editBtn = page.locator('#layoutEditToggleBtn');
  await editBtn.click();
  await expect(page.locator('#cardCanvas.card-canvas--edit-mode')).toHaveCount(0);
}
