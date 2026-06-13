import { expect, type Locator, type Page } from '@playwright/test';

/** Debounce wait after drag/resize before reading saved grid state */
export const LAYOUT_SAVE_DEBOUNCE_MS = 700;

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

/**
 * Reads data-col from the first card on the canvas.
 */
export async function getFirstCardCol(page: Page): Promise<string> {
  const col = await page.locator('.card-canvas-item').first().getAttribute('data-col');
  expect(col).not.toBeNull();
  return col!;
}

/**
 * Drags a card by pixel offset from its center (edit mode).
 */
export async function dragCardByOffset(
  page: Page,
  card: Locator,
  offsetX: number,
  offsetY = 0,
): Promise<void> {
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  const startX = box!.x + box!.width / 2;
  const startY = box!.y + box!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + offsetX, startY + offsetY, { steps: 24 });
  await page.mouse.up();
  await page.waitForTimeout(LAYOUT_SAVE_DEBOUNCE_MS);
}

/**
 * Switches the active edit device (PC / tablet / mobile) in layout toolbar.
 */
export async function switchEditDevice(
  page: Page,
  device: 'desktop' | 'tablet' | 'mobile',
): Promise<void> {
  const buttonId = {
    desktop: '#layoutDeviceDesktop',
    tablet: '#layoutDeviceTablet',
    mobile: '#layoutDeviceMobile',
  }[device];
  await page.locator(buttonId).click();
  await expect(page.locator('.layout-edit-toolbar')).toHaveAttribute('data-active-device', device);
  await expect(page.locator('#cardCanvas')).toHaveAttribute('data-active-device', device);
}
