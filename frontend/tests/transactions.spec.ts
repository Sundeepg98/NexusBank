import { test, expect } from '@playwright/test';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
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
