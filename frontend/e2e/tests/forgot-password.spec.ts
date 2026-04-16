import { test, expect } from '@playwright/test';

test.describe('Forgot Password Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('should show forgot password form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Forgot Password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate email field', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('should show invalid email error', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should proceed to OTP step after email submission', async ({ page }) => {
    const testEmail = 'test@nexusbank.com';
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[formcontrolname="otp"]', { timeout: 5000 });
    await expect(page.locator('h2')).toContainText('Reset Password');
    await expect(page.locator('text=/sent to.*' + testEmail + '/')).toBeVisible();
  });

  test('should reset password successfully with valid OTP', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@nexusbank.com');
    await page.click('button[type="submit"]');

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/auth/forgot-password') && resp.status() === 200
    );
    const response = await responsePromise;
    const responseBody = await response.json();
    const otpFromResponse = responseBody.otp || responseBody.data?.otp;

    await page.waitForSelector('input[formcontrolname="otp"]', { timeout: 5000 });
    await page.fill('input[formcontrolname="otp"]', otpFromResponse || '123456');
    await page.fill('input[formcontrolname="newPassword"]', 'NewPass123!');
    await page.fill('input[formcontrolname="confirmPassword"]', 'NewPass123!');
    await page.click('button[type="submit"]');

    await page.waitForSelector('.success-card, text=Password Reset Successful', { timeout: 5000 });
    await expect(page.locator('h2')).toContainText('Password Reset Successful');
  });

  test('should navigate to login when clicking login link', async ({ page }) => {
    await page.click('a[routerLink="/login"]');
    await page.waitForURL('**/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should go back to email step from OTP step', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@nexusbank.com');
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[formcontrolname="otp"]', { timeout: 5000 });
    await page.click('a:has-text("Back to email")');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Forgot Password');
  });

  test('should show password requirements error', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@nexusbank.com');
    await page.click('button[type="submit"]');

    await page.waitForSelector('input[formcontrolname="otp"]', { timeout: 5000 });
    await page.fill('input[formcontrolname="otp"]', '123456');
    await page.fill('input[formcontrolname="newPassword"]', 'weak');
    await page.fill('input[formcontrolname="confirmPassword"]', 'weak');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should show password mismatch error', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@nexusbank.com');
    await page.click('button[type="submit"]');

    await page.waitForSelector('input[formcontrolname="otp"]', { timeout: 5000 });
    await page.fill('input[formcontrolname="otp"]', '123456');
    await page.fill('input[formcontrolname="newPassword"]', 'ValidPass123!');
    await page.fill('input[formcontrolname="confirmPassword"]', 'DifferentPass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should redirect to login after successful password reset', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@nexusbank.com');
    await page.click('button[type="submit"]');

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/auth/forgot-password') && resp.status() === 200
    );
    const response = await responsePromise;
    const responseBody = await response.json();
    const otpFromResponse = responseBody.otp || responseBody.data?.otp;

    await page.waitForSelector('input[formcontrolname="otp"]', { timeout: 5000 });
    await page.fill('input[formcontrolname="otp"]', otpFromResponse || '123456');
    await page.fill('input[formcontrolname="newPassword"]', 'NewPass123!');
    await page.fill('input[formcontrolname="confirmPassword"]', 'NewPass123!');
    await page.click('button[type="submit"]');

    await page.waitForSelector('.success-card, text=Password Reset Successful', { timeout: 5000 });
    await page.click('button:has-text("Go to Login")');
    await page.waitForURL('**/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
