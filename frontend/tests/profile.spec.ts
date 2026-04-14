import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/welcome');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/netbanking/);
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.click('text=Profile');
    await page.waitForURL(/\/profile/);
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('should display profile information', async ({ page }) => {
    await page.click('text=Profile');
    await expect(page.locator('text=Username')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
  });

  test('should show change password form', async ({ page }) => {
    await page.click('text=Profile');
    await page.click('text=Change Password');
    await expect(page.locator('input[placeholder*="current"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="new"]').first()).toBeVisible();
  });

  test('should logout from profile', async ({ page }) => {
    await page.click('text=Profile');
    await page.click('button:has-text("Logout")');
    await page.waitForURL(/\/welcome/);
  });
});
