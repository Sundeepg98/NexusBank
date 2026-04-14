import { test, expect } from '@playwright/test';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/welcome');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/netbanking/);
  });

  test('should show transactions section', async ({ page }) => {
    await page.click('text=Transactions');
    await expect(page.locator('text=Recent Transactions')).toBeVisible();
  });

  test('should display download statement button', async ({ page }) => {
    await page.click('text=Transactions');
    await expect(page.locator('text=Download Statement')).toBeVisible();
  });
});
