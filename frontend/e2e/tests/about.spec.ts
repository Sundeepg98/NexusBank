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
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    const testPassword = 'TestPass123!';

    await page.goto('/welcome');
    await page.waitForLoadState('networkidle');

    await page.locator('a[routerlink="/register"]').click();
    await page.waitForURL(/\/register/);
    await page.waitForLoadState('networkidle');

    await page.locator('#firstName').fill('Test');
    await page.locator('#lastName').fill('User');
    await page.locator('#email').fill(testEmail);
    await page.locator('#username').fill(testUsername);
    await page.locator('#phone').fill('1234567890');
    await page.locator('#password').fill(testPassword);
    await page.locator('#confirmPassword').fill(testPassword);

    await page.waitForTimeout(500);

    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/welcome/, { timeout: 10000 });

    await page.waitForTimeout(2500);

    await page.locator('#email').fill(testEmail);
    await page.locator('#password').fill(testPassword);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/netbanking/, { timeout: 15000 });

    await page.goto('/services');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
