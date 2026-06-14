import { test, expect } from '@playwright/test';

/**
 * E2E-FCM — folder card management (Super Admin gear on folder cards).
 * Requires MODULEHUB_DEV_SUPER_ADMIN=1 (see playwright.config.ts).
 */

test.describe('E2E-FCM folder card management', () => {
  test('E2E-FCM-01: edit folder name and card description', async ({ page }) => {
    await page.goto('/');
    const folderCard = page.locator('.folder-card').first();
    await expect(folderCard).toBeVisible();
    await folderCard.locator('.gear-icon').click();
    await page.locator('.gear-action-btn[data-action="edit-meta"]').click();
    await page.locator('#folder-edit-name').fill('پوشه تست E2E');
    await page.locator('#folder-edit-desc').fill('توضیح تست');
    await page.getByRole('button', { name: 'ذخیره' }).click();
    await expect(folderCard.locator('.card-title')).toContainText('پوشه تست E2E');
    await expect(folderCard.locator('.card-desc')).toContainText('توضیح تست');
  });
});
