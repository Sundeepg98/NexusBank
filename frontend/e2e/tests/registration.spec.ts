import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should show registration form', async ({ page }) => {
    await expect(page.locator('input[formcontrolname="username"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="email"]')).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    const timestamp = Date.now();
    await page.fill('input[formcontrolname="username"]', `testuser${timestamp}`);
    await page.fill('input[formcontrolname="email"]', `test${timestamp}@example.com`);
    await page.fill('input[formcontrolname="password"]', 'Test1234!');
    await page.fill('input[formcontrolname="confirmPassword"]', 'Test1234!');
    await page.fill('input[formcontrolname="firstName"]', 'Test');
    await page.fill('input[formcontrolname="lastName"]', 'User');
    await page.fill('input[formcontrolname="phone"]', '1234567890');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/welcome', { timeout: 5000 });
  });
});