import { test, expect } from '@playwright/test';

test.describe('Netbanking Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/welcome');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/netbanking');
  });

  test('should display dashboard with cards', async ({ page }) => {
    await expect(page.locator('text=My Accounts')).toBeVisible();
    await expect(page.locator('text=Fund Transfer')).toBeVisible();
    await expect(page.locator('text=Transactions')).toBeVisible();
  });

  test('should show accounts section', async ({ page }) => {
    await page.click('text=My Accounts');
    await expect(page.locator('text=Your Accounts')).toBeVisible();
    await expect(page.locator('button:has-text("Create New Account")')).toBeVisible();
  });

  test('should show transfer form', async ({ page }) => {
    await page.click('text=Fund Transfer');
    await expect(page.locator('text=Single Transfer')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.click('button:has-text("Logout")');
    await page.evaluate(() => localStorage.clear());
    await page.waitForURL('**/welcome', { timeout: 5000 });
    await expect(page.locator('text=Login')).toBeVisible();
  });
});