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

  test('should show OTP input after requesting OTP', async ({ page }) => {
    await page.click('text=Profile');
    await page.click('text=Change Password');
    await page.fill('input[placeholder*="current"]', 'password123');
    await page.fill('input[placeholder*="new"]', 'NewPass@123');
    await page.fill('input[placeholder*="Confirm"]', 'NewPass@123');
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    const toast = page.locator('.toast-message, .toast, [class*="toast"]').first();
    const toastVisible = await toast.isVisible().catch(() => false);
    if (toastVisible) {
      const toastText = await toast.textContent();
      console.log('Toast message:', toastText);
    }
    
    await expect(page.locator('input[placeholder*="6-digit"]')).toBeVisible();
  });

  test('should logout from profile', async ({ page }) => {
    await page.click('text=Profile');
    await page.click('button:has-text("Logout")');
    await page.waitForURL(/\/welcome/);
  });
});
