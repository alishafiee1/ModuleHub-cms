import { expect, test } from '@playwright/test';
import {
  dragCardByOffset,
  enterLayoutEditMode,
  exitLayoutEditMode,
  getFirstCardCol,
  openHomeAsSuperAdmin,
  switchEditDevice,
} from './helpers/admin-login';

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

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

  test('E2E-DCL-02b: second layout read does not re-derive', async ({ request }) => {
    const first = await request.get('/api/layout');
    expect(first.ok()).toBeTruthy();
    const firstBody = await first.json() as {
      derivedLayoutsSaved?: boolean;
      tree: { children: Array<{ cardGridMobile?: { col: number } }> };
    };
    const mobileColFirst = firstBody.tree.children[0].cardGridMobile?.col;

    const second = await request.get('/api/layout');
    expect(second.ok()).toBeTruthy();
    const secondBody = await second.json() as {
      derivedLayoutsSaved?: boolean;
      tree: { children: Array<{ cardGridMobile?: { col: number } }> };
    };

    expect(secondBody.derivedLayoutsSaved).toBeFalsy();
    expect(secondBody.tree.children[0].cardGridMobile?.col).toBe(mobileColFirst);
  });

  test('corner-coverage: tablet viewport grid fills canvas width', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await openHomeAsSuperAdmin(page);

    const metrics = await page.evaluate(() => {
      const inner = window.CardCanvas.getGridInnerWidth();
      const shellWidth = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--app-shell-width') || '0',
      );
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
        shellWidth,
        wrapperWidth,
        leftCornerLeft,
        rightCornerRight,
        maxRight: inner + pad,
      };
    });

    expect(metrics.shellWidth).toBeGreaterThanOrEqual(880);
    expect(metrics.inner).toBeGreaterThan(750);
    expect(metrics.inner).toBeLessThanOrEqual(metrics.wrapperWidth);
    expect(metrics.leftCornerLeft).toBeGreaterThanOrEqual(0);
    expect(metrics.rightCornerRight).toBeLessThanOrEqual(metrics.maxRight + 1);
  });

  test('E2E-DCL-05: desktop shell caps width and grid fills canvas on wide viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHomeAsSuperAdmin(page);

    const metrics = await page.evaluate(() => {
      const inner = window.CardCanvas.getGridInnerWidth();
      const wrapper = document.querySelector('#cardsWrapper');
      const wrapperWidth = wrapper?.getBoundingClientRect().width ?? 0;
      const shell = document.querySelector('.demo-container');
      const shellWidth = shell?.getBoundingClientRect().width ?? 0;
      const pad = 12;
      const gap = 10;
      const columns = 30;
      const cellWidth = inner / columns;
      const rightCornerRight = pad + 27 * cellWidth + gap / 2 + 3 * cellWidth - gap;
      return {
        inner,
        shellWidth,
        wrapperWidth,
        rightCornerRight,
        maxRight: inner + pad,
      };
    });

    expect(metrics.shellWidth).toBeGreaterThan(1200);
    expect(metrics.shellWidth).toBeLessThanOrEqual(1296);
    expect(metrics.inner).toBeGreaterThan(1100);
    // Grid fills measured wrapper — no dead zone on the right
    expect(metrics.inner).toBeCloseTo(metrics.wrapperWidth - 24, 0);
    expect(metrics.rightCornerRight).toBeLessThanOrEqual(metrics.maxRight + 1);
  });

  test('save-persist: drag then exit edit survives reload', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openHomeAsSuperAdmin(page);
    await enterLayoutEditMode(page);

    const card = page.locator('.card-canvas-item').first();
    await expect(card).toBeVisible();
    const beforeCol = await card.getAttribute('data-col');

    await dragCardByOffset(page, card, 320);

    const afterCol = await card.getAttribute('data-col');
    expect(afterCol).not.toBe(beforeCol);

    await exitLayoutEditMode(page);
    await page.reload();
    await page.waitForSelector('#cardCanvas');
    await page.waitForTimeout(500);

    const cardAfterReload = page.locator('.card-canvas-item').first();
    await expect(cardAfterReload).toHaveAttribute('data-col', afterCol!);
  });

  test('E2E-DCL-01: separate PC and mobile edits show mobile layout at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openHomeAsSuperAdmin(page);
    await enterLayoutEditMode(page);

    const card = page.locator('.card-canvas-item').first();
    await expect(card).toBeVisible();

    await dragCardByOffset(page, card, 280);
    const colDesktop = await getFirstCardCol(page);

    await switchEditDevice(page, 'mobile');
    await dragCardByOffset(page, card, -120);
    const colMobile = await getFirstCardCol(page);
    expect(colMobile).not.toBe(colDesktop);

    await exitLayoutEditMode(page);

    await page.setViewportSize({ width: 390, height: 800 });
    await page.waitForTimeout(400);

    const colAtMobileViewport = await getFirstCardCol(page);
    expect(colAtMobileViewport).toBe(colMobile);
    expect(colAtMobileViewport).not.toBe(colDesktop);
  });

  test('E2E-DCL-03: exit edit shows layout without hard refresh', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openHomeAsSuperAdmin(page);
    await enterLayoutEditMode(page);

    const card = page.locator('.card-canvas-item').first();
    await dragCardByOffset(page, card, 200);
    const colAfterDrag = await getFirstCardCol(page);

    await exitLayoutEditMode(page);
    await expect(page.locator('#cardCanvas.card-canvas--edit-mode')).toHaveCount(0);

    const colInViewMode = await getFirstCardCol(page);
    expect(colInViewMode).toBe(colAfterDrag);
  });

  test('E2E-DCL-04: crossing 1024px switches to tablet breakpoint layout', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openHomeAsSuperAdmin(page);

    const desktopBreakpoint = await page.evaluate(() => window.CardCanvas.getEffectiveBreakpoint());
    expect(desktopBreakpoint).toBe('desktop');
    const colDesktop = await getFirstCardCol(page);

    await page.setViewportSize({ width: 900, height: 800 });
    await page.waitForTimeout(400);

    const tabletBreakpoint = await page.evaluate(() => window.CardCanvas.getEffectiveBreakpoint());
    expect(tabletBreakpoint).toBe('tablet');

    const layout = await page.request.get('/api/layout');
    const body = await layout.json() as {
      tree: { children: Array<{ cardGrid?: { col: number }; cardGridTablet?: { col: number } }> };
    };
    const node = body.tree.children[0];
    expect(node.cardGridTablet).toBeDefined();

    const colTablet = await getFirstCardCol(page);
    expect(colTablet).toBe(String(node.cardGridTablet!.col));
    if (node.cardGrid && node.cardGridTablet && node.cardGrid.col !== node.cardGridTablet.col) {
      expect(colTablet).not.toBe(colDesktop);
    }
  });

  test('edit toolbar shows device switchers in edit mode', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openHomeAsSuperAdmin(page);
    await enterLayoutEditMode(page);

    await expect(page.locator('#layoutDeviceDesktop')).toBeVisible();
    await expect(page.locator('#layoutDeviceTablet')).toBeVisible();
    await expect(page.locator('#layoutDeviceMobile')).toBeVisible();

    await switchEditDevice(page, 'tablet');
  });
});
