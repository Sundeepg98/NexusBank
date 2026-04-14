import { test, expect } from '@playwright/test';

test.describe('Static Pages', () => {
  test('should display about us page', async ({ page }) => {
    await page.goto('/about-us');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display contact page', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display services page', async ({ page }) => {
    await page.goto('/welcome');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/netbanking/);
    await page.goto('/services');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
