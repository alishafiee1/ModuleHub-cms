import { expect, type Locator, type Page } from '@playwright/test';

/** Debounce wait after drag/resize before reading saved grid state */
export const LAYOUT_SAVE_DEBOUNCE_MS = 700;

/**
 * Returns the center point of a card's edit-mode drag handle.
 */
async function getCardDragHandleCenter(card: Locator): Promise<{ x: number; y: number }> {
  const handle = card.locator('.card-drag-handle');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

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
 * Enters layout edit mode via gear floating menu on a card.
 */
export async function enterLayoutEditModeViaGear(page: Page, card: Locator): Promise<void> {
  await card.locator('.gear-icon').click();
  const menu = page.locator('.gear-floating-menu.is-open');
  await expect(menu).toBeVisible();
  await menu.locator('.gear-float-btn[data-action="layout-edit"]').click({ force: true });
  await page.waitForFunction(
    () => document.getElementById('cardCanvas')?.classList.contains('card-canvas--edit-mode'),
    undefined,
    { timeout: 15_000 },
  );
  await expect(page.locator('#layoutEditToggleBtn')).toHaveClass(/is-active/);
}

/**
 * Opens card background picker from gear floating menu.
 */
export async function openCardBackgroundFromGear(page: Page, card: Locator): Promise<void> {
  await card.locator('.gear-icon').click();
  const menu = page.locator('.gear-floating-menu.is-open');
  await expect(menu).toBeVisible();
  await menu.locator('.gear-float-btn[data-action="card-background"]').click({ force: true });
  await expect(page.locator('.swal2-popup')).toContainText('پس‌زمینه کارت', { timeout: 10_000 });
}

/**
 * Exits layout edit mode via gear floating menu on a card.
 */
export async function exitLayoutEditModeViaGear(page: Page, card: Locator): Promise<void> {
  await card.locator('.gear-icon').click();
  const menu = page.locator('.gear-floating-menu.is-open');
  await expect(menu).toBeVisible();
  const exitClick = menu.locator('.gear-float-btn[data-action="layout-edit"]').click({ force: true });
  await exitClick;
  await page.waitForFunction(
    () => !document.getElementById('cardCanvas')?.classList.contains('card-canvas--edit-mode'),
    undefined,
    { timeout: 15_000 },
  );
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
  const { x: startX, y: startY } = await getCardDragHandleCenter(card);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + offsetX, startY + offsetY, { steps: 24 });
  await page.mouse.up();
  await page.waitForTimeout(LAYOUT_SAVE_DEBOUNCE_MS);
}

/**
 * Returns true when the response is a layout-tree reparent PATCH (not card grid save).
 */
function isLayoutTreeReparentPatch(resp: import('@playwright/test').Response, nodeId: string): boolean {
  if (resp.request().method() !== 'PATCH') {
    return false;
  }
  const url = resp.url();
  if (url.includes('/cards')) {
    return false;
  }
  return url.includes(`/admin/folder/${nodeId}`) || url.includes(`/admin/layout-node/${nodeId}`);
}

/**
 * Performs dwell drag from source handle onto target center (no confirm).
 */
async function performTreeTransferDrag(
  page: Page,
  source: Locator,
  target: Locator,
  dwellMs: number,
): Promise<void> {
  const { x: startX, y: startY } = await getCardDragHandleCenter(source);
  const tgtBox = await target.boundingBox();
  expect(tgtBox).not.toBeNull();
  const endX = tgtBox!.x + tgtBox!.width / 2;
  const endY = tgtBox!.y + tgtBox!.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  const steps = 32;
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    const x = startX + (endX - startX) * ratio;
    const y = startY + (endY - startY) * ratio;
    await page.mouse.move(x, y);
    await page.waitForTimeout(20);
  }

  await page.waitForTimeout(dwellMs);
  await page.mouse.up();

  await expect(page.locator('.transfer-confirm-btn')).toBeVisible({ timeout: 10_000 });
}

/**
 * Drags a card onto another card, dwells for tree transfer, releases, and confirms.
 */
export async function dragCardForTreeTransfer(
  page: Page,
  source: Locator,
  target: Locator,
  dwellMs = 100,
): Promise<void> {
  const sourceId = await source.getAttribute('data-id');
  expect(sourceId).toBeTruthy();

  await performTreeTransferDrag(page, source, target, dwellMs);

  const transferPatch = page.waitForResponse(
    (resp) => isLayoutTreeReparentPatch(resp, sourceId!),
    { timeout: 20_000 },
  );

  await page.locator('.transfer-confirm-btn').click({ force: true });
  await transferPatch;
  await page.waitForResponse(
    (resp) => resp.url().includes('/api/layout') && resp.request().method() === 'GET',
    { timeout: 20_000 },
  );
  await page.waitForTimeout(LAYOUT_SAVE_DEBOUNCE_MS);
}

/**
 * Drags for tree transfer then cancels via backdrop click (card should restore grid).
 */
export async function dragCardForTreeTransferAndCancel(
  page: Page,
  source: Locator,
  target: Locator,
  dwellMs = 600,
): Promise<void> {
  await performTreeTransferDrag(page, source, target, dwellMs);
  const canvasBox = await page.locator('#cardCanvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  await page.mouse.click(
    canvasBox!.x + canvasBox!.width / 2,
    canvasBox!.y + Math.min(120, canvasBox!.height / 2),
  );
  await expect(page.locator('.transfer-confirm-btn')).toHaveCount(0);
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
