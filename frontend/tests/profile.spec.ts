import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
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

  test('should show OTP input after requesting OTP', async ({ page }) => {
    await page.click('text=Profile');
    await page.click('button:has-text("Change Password")');

    await page.locator('#currentPassword').fill('TestPass123!');
    await page.locator('#newPassword').fill('NewPass@123');
    await page.locator('#confirmPassword').fill('NewPass@123');

    await page.locator('button:has-text("Request OTP")').click();

    await page.waitForTimeout(2000);

    await expect(page.locator('#otp')).toBeVisible({ timeout: 10000 });
  });

  test('should logout from profile', async ({ page }) => {
    await page.click('text=Profile');
    await page.click('button:has-text("Logout")');
    await page.waitForURL(/\/welcome/);
  });
});
