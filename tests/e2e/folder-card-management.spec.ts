import { test, expect } from '@playwright/test';
import {
  dragCardForTreeTransfer,
  enterLayoutEditMode,
  exitLayoutEditMode,
  openHomeAsSuperAdmin,
} from './helpers/admin-login';

/**
 * E2E-FCM — folder card management (Super Admin gear on folder cards).
 * Requires MODULEHUB_DEV_SUPER_ADMIN=1 (see playwright.config.ts).
 */

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

test.describe('E2E-FCM folder card management', () => {
  test('E2E-FCM-01: edit folder name and card description', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    const folderCard = page.locator('[data-id="folder-a"]');
    await expect(folderCard).toBeVisible();
    await folderCard.locator('.gear-icon').click();
    await expect(page.locator('.gear-floating-menu.is-open')).toBeVisible();
    await page.locator('.gear-float-btn[data-action="edit-meta"]').click({ force: true });
    await expect(page.locator('.swal2-popup #folder-edit-name')).toBeVisible({ timeout: 10_000 });
    await page.locator('#folder-edit-name').fill('پوشه تست E2E');
    await page.locator('#folder-edit-desc').fill('توضیح تست');
    const patchPromise = page.waitForResponse(
      (resp) => resp.url().includes('/admin/folder/folder-a') && resp.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'ذخیره' }).click();
    await patchPromise;
    await expect(folderCard.locator('.card-title')).toContainText('پوشه تست E2E');
    await expect(folderCard.locator('.card-desc')).toContainText('توضیح تست');
  });

  test('E2E-FCM-03: multiline card description preserves line breaks', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    const folderCard = page.locator('[data-id="folder-a"]');
    await folderCard.locator('.gear-icon').click();
    await page.locator('.gear-float-btn[data-action="edit-meta"]').click({ force: true });
    await page.locator('#folder-edit-desc').fill('خط اول\nخط دوم');
    await page.getByRole('button', { name: 'ذخیره' }).click();
    await page.waitForResponse(
      (resp) => resp.url().includes('/admin/folder/folder-a') && resp.request().method() === 'PATCH',
    );
    await expect(folderCard.locator('.card-desc')).toContainText('خط اول', { timeout: 10_000 });

    const descText = await folderCard.locator('.card-desc').evaluate((el) => el.textContent?.replace(/\s+/g, ' ').trim());
    expect(descText).toContain('خط اول');
    expect(descText).toContain('خط دوم');
  });

  test('E2E-FCM-04: markdown bold renders on card subtitle', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    const folderCard = page.locator('[data-id="folder-a"]');
    await folderCard.locator('.gear-icon').click();
    await page.locator('.gear-float-btn[data-action="edit-meta"]').click({ force: true });
    await page.locator('#folder-edit-desc').fill('**پررنگ**');
    await page.getByRole('button', { name: 'ذخیره' }).click();
    await page.waitForResponse(
      (resp) => resp.url().includes('/admin/folder/folder-a') && resp.request().method() === 'PATCH',
    );
    await expect(folderCard.locator('.card-desc strong')).toContainText('پررنگ', { timeout: 10_000 });
  });

  test('E2E-FCM-05: gear help shows full card description', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    const folderCard = page.locator('[data-id="folder-a"]');
    await folderCard.locator('.gear-icon').click();
    await page.locator('.gear-float-btn[data-action="help"]').click({ force: true });
    await expect(page.locator('.swal2-popup .card-description-help')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'بستن' }).click();
  });

  test('E2E-FCM-02: move folder via edit-mode drag transfer', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    await enterLayoutEditMode(page);

    const folderC = page.locator('[data-id="folder-c"]');
    const folderA = page.locator('[data-id="folder-a"]');
    await expect(folderC).toBeVisible();
    await expect(folderA).toBeVisible();

    await dragCardForTreeTransfer(page, folderC, folderA);

    await expect(page.locator('[data-id="folder-c"]')).toHaveCount(0);

    await exitLayoutEditMode(page);
    await folderA.click();
    await expect(page.locator('[data-id="folder-c"]')).toBeVisible();
  });

  test('E2E-FCM-02b: move folder to parent via back-card drag', async ({ page }) => {
    await openHomeAsSuperAdmin(page);
    await page.goto('/?folder=folder-a');
    await expect(page.locator('[data-id="folder-b"]')).toBeVisible();
    await enterLayoutEditMode(page);

    const folderB = page.locator('[data-id="folder-b"]');
    const backCard = page.locator('.back-card');
    await expect(folderB).toBeVisible();
    await expect(backCard).toBeVisible();

    await dragCardForTreeTransfer(page, folderB, backCard);

    await expect(page.locator('[data-id="folder-b"]')).toHaveCount(0);
    await exitLayoutEditMode(page);
    await page.goto('/?folder=folder-a');
    await page.locator('.back-card').click();
    await expect(page.locator('[data-id="folder-b"]')).toBeVisible();
  });
});
