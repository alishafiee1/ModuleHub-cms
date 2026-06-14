import { test, expect } from '@playwright/test';
import {
  enterLayoutEditModeViaGear,
  exitLayoutEditMode,
  openCardBackgroundFromGear,
  openHomeAsSuperAdmin,
} from './helpers/admin-login';

/**
 * E2E-GMU — gear menu unification (layout edit + palette from floating menu).
 */

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

test.describe('E2E-GMU gear menu unification', () => {
  test('E2E-GMU-01: toggle layout edit from folder gear syncs toolbar', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    const folderCard = page.locator('[data-id="folder-a"]');
    await expect(folderCard.locator('.gear-icon')).toBeVisible();

    await enterLayoutEditModeViaGear(page, folderCard);
    await expect(folderCard.locator('.gear-icon')).toBeVisible();
    await expect(folderCard.locator('.card-drag-handle')).toBeVisible();

    await exitLayoutEditMode(page);
    await expect(page.locator('#layoutEditToggleBtn')).not.toHaveClass(/is-active/);
  });

  test('E2E-GMU-01b: exit layout edit from folder gear', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    const folderCard = page.locator('[data-id="folder-a"]');
    await enterLayoutEditModeViaGear(page, folderCard);

    await folderCard.locator('.gear-icon').click();
    const menu = page.locator('.gear-floating-menu.is-open');
    await expect(menu).toBeVisible();
    await menu.locator('.gear-float-btn[data-action="layout-edit"]').evaluate((btn) => {
      (btn as HTMLButtonElement).click();
    });
    await page.waitForFunction(
      () => !document.getElementById('cardCanvas')?.classList.contains('card-canvas--edit-mode'),
      undefined,
      { timeout: 15_000 },
    );
    await expect(page.locator('#layoutEditToggleBtn')).not.toHaveClass(/is-active/);
  });

  test('E2E-GMU-02: open card background picker from gear menu', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    const folderCard = page.locator('[data-id="folder-a"]');
    await openCardBackgroundFromGear(page, folderCard);
    await page.getByRole('button', { name: 'انصراف' }).click();
  });

  test('E2E-GMU-03: module gear opens floating menu and manage dialog', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    const moduleCard = page.locator('[data-id="node-mod-1"]');
    await expect(moduleCard).toBeVisible();
    await expect(moduleCard.locator('.status-badge')).toBeVisible();
    await expect(moduleCard.locator('.card-resource-hint')).toHaveCount(0);

    await moduleCard.locator('.gear-icon').click();
    await expect(page.locator('.gear-floating-menu.is-open')).toBeVisible();
    await page.locator('.gear-float-btn[data-action="manage"]').click({ force: true });
    await expect(page.locator('.swal-gear-dialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.gear-action-btn', { hasText: 'مشاهده لاگ' })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('E2E-GMU-04: module gear help dialog', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    const moduleCard = page.locator('[data-id="node-mod-1"]');
    await moduleCard.locator('.gear-icon').click();
    await expect(page.locator('.gear-floating-menu.is-open')).toBeVisible();
    await page.locator('.gear-float-btn[data-action="help"]').click({ force: true });
    await expect(page.locator('.swal2-popup .folder-admin-help')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'بستن' }).click();
  });
});
