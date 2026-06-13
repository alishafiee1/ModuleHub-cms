import { expect, test } from '@playwright/test';
import {
  enterLayoutEditMode,
  exitLayoutEditMode,
  openHomeAsSuperAdmin,
} from './helpers/admin-login';

  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60_000);

test.describe('device-card-layout', () => {
  test('E2E-DCL-02: legacy cardGrid derives tablet/mobile on first layout read', async ({ request }) => {
    const response = await request.get('/api/layout');
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as {
      derivedLayoutsSaved?: boolean;
      tree: { children: Array<{ cardGridTablet?: unknown; cardGridMobile?: unknown }> };
    };
    const child = body.tree.children[0];
    expect(child.cardGridTablet).toBeDefined();
    expect(child.cardGridMobile).toBeDefined();
    expect(body.derivedLayoutsSaved).toBe(true);
  });

  test('corner-coverage: tablet viewport grid fills canvas width', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await openHomeAsSuperAdmin(page);

    const metrics = await page.evaluate(() => {
      const inner = window.CardCanvas.getGridInnerWidth();
      const wrapper = document.querySelector('#cardsWrapper');
      const wrapperWidth = wrapper?.getBoundingClientRect().width ?? 0;
      const pad = 12;
      const gap = 10;
      const columns = 30;
      const cellWidth = inner / columns;
      const rightCornerLeft = pad + 27 * cellWidth + gap / 2;
      const rightCornerRight = rightCornerLeft + 3 * cellWidth - gap;
      const leftCornerLeft = pad + 0 * cellWidth + gap / 2;
      return {
        inner,
        wrapperWidth,
        leftCornerLeft,
        rightCornerRight,
        maxRight: inner + pad,
      };
    });

    expect(metrics.inner).toBeGreaterThan(750);
    expect(metrics.inner).toBeLessThanOrEqual(metrics.wrapperWidth);
    expect(metrics.leftCornerLeft).toBeGreaterThanOrEqual(0);
    expect(metrics.rightCornerRight).toBeLessThanOrEqual(metrics.maxRight + 1);
  });

  test('save-persist: drag then exit edit survives reload', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openHomeAsSuperAdmin(page);
    await enterLayoutEditMode(page);

    const card = page.locator('.card-canvas-item').first();
    await expect(card).toBeVisible();
    const beforeCol = await card.getAttribute('data-col');
    const box = await card.boundingBox();
    expect(box).not.toBeNull();

    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 320, startY, { steps: 24 });
    await page.mouse.up();
    await page.waitForTimeout(700);

    const afterCol = await card.getAttribute('data-col');
    expect(afterCol).not.toBe(beforeCol);

    await exitLayoutEditMode(page);
    await page.reload();
    await page.waitForSelector('#cardCanvas');
    await page.waitForTimeout(500);

    const cardAfterReload = page.locator('.card-canvas-item').first();
    await expect(cardAfterReload).toHaveAttribute('data-col', afterCol!);
  });

  test('E2E-DCL-01: viewport 390px uses mobile breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openHomeAsSuperAdmin(page);

    const desktopInner = await page.evaluate(() => window.CardCanvas.getGridInnerWidth());
    await page.setViewportSize({ width: 390, height: 800 });
    await page.waitForTimeout(300);

    const mobileInner = await page.evaluate(() => window.CardCanvas.getGridInnerWidth());
    expect(mobileInner).toBeLessThan(desktopInner);
    expect(mobileInner).toBeGreaterThan(300);
  });

  test('edit toolbar shows device switchers in edit mode', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openHomeAsSuperAdmin(page);
    await enterLayoutEditMode(page);

    await expect(page.locator('#layoutDeviceDesktop')).toBeVisible();
    await expect(page.locator('#layoutDeviceTablet')).toBeVisible();
    await expect(page.locator('#layoutDeviceMobile')).toBeVisible();

    await page.locator('#layoutDeviceTablet').click();
    await expect(page.locator('.layout-edit-toolbar')).toHaveAttribute('data-active-device', 'tablet');
    await expect(page.locator('#cardCanvas')).toHaveAttribute('data-active-device', 'tablet');
  });
});
