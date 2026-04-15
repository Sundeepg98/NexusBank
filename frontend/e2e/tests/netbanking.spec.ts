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
    await page.click('h3:has-text("Fund Transfer")');
    await expect(page.locator('text=Single Transfer')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.click('button:has-text("Logout")');
    await page.evaluate(() => localStorage.clear());
    await page.waitForURL('**/welcome', { timeout: 5000 });
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('should complete transfer with OTP verification', async ({ page }) => {
    await page.click('h3:has-text("Fund Transfer")');
    await expect(page.locator('text=Single Transfer')).toBeVisible();

    const toAccountInput = page.locator('input#toAccount');
    const amountInput = page.locator('input#amount');

    await toAccountInput.fill('1234567890');
    await amountInput.fill('100');

    await page.click('button[type="submit"]:has-text("Transfer")');

    await page.waitForTimeout(2000);

    const otpInput = page.locator('input#otp');
    await expect(otpInput).toBeVisible({ timeout: 5000 });

    const toast = page.locator('.toast-message').first();
    const toastText = await toast.textContent().catch(() => '');
    const otpMatch = toastText?.match(/OTP is:\s*(\d{6})/);

    if (otpMatch) {
      await otpInput.fill(otpMatch[1]);
    } else {
      await otpInput.fill('123456');
    }

    await page.click('button[type="submit"]:has-text("Confirm Transfer")');

    await page.waitForTimeout(2000);

    await expect(page.locator('text=Transfer successful')).toBeVisible({ timeout: 5000 });
  });

  test('should cancel transfer during OTP step', async ({ page }) => {
    await page.click('h3:has-text("Fund Transfer")');

    const toAccountInput = page.locator('input#toAccount');
    const amountInput = page.locator('input#amount');

    await toAccountInput.fill('1234567890');
    await amountInput.fill('50');

    await page.click('button[type="submit"]:has-text("Transfer")');

    await page.waitForTimeout(1500);

    const otpInput = page.locator('input#otp');
    await expect(otpInput).toBeVisible({ timeout: 5000 });

    await page.click('button:has-text("Cancel"):not(.btn-secondary)');

    await expect(page.locator('text=Single Transfer')).toBeVisible();
    await expect(otpInput).not.toBeVisible();
  });

  test('should show validation errors for invalid transfer', async ({ page }) => {
    await page.click('h3:has-text("Fund Transfer")');

    await page.click('button[type="submit"]:has-text("Transfer")');

    await expect(page.locator('text=Account number is required')).toBeVisible();
    await expect(page.locator('text=Amount is required')).toBeVisible();
  });

  test('should show batch transfer form', async ({ page }) => {
    await page.click('h3:has-text("Fund Transfer")');
    await page.click('button:has-text("Batch Transfer")');

    await expect(page.locator('text=Recipients')).toBeVisible();
    await expect(page.locator('button:has-text("+ Add Another Recipient")')).toBeVisible();
  });

  test('should add and remove recipients in batch transfer', async ({ page }) => {
    await page.click('h3:has-text("Fund Transfer")');
    await page.click('button:has-text("Batch Transfer")');

    await page.click('button:has-text("+ Add Another Recipient")');

    const recipients = page.locator('.recipient-group');
    await expect(recipients).toHaveCount(2);

    await page.click('button:has-text("Remove").first()');

    await expect(recipients).toHaveCount(1);
  });

  test('should view transactions and download statement', async ({ page }) => {
    await page.click('h3:has-text("Transactions")');

    await page.waitForTimeout(1000);

    const transactionsSection = page.locator('text=Recent Transactions');
    await expect(transactionsSection).toBeVisible();

    const downloadButton = page.locator('button:has-text("Download Statement")');
    await expect(downloadButton).toBeVisible();
  });

  test('should view transaction detail modal', async ({ page }) => {
    await page.click('h3:has-text("Transactions")');

    await page.waitForTimeout(1500);

    const transactionItem = page.locator('.transaction-item').first();
    const transactionExists = await transactionItem.isVisible().catch(() => false);

    if (transactionExists) {
      await transactionItem.click();

      await expect(page.locator('text=Transaction Details')).toBeVisible();
      await expect(page.locator('text=Transaction ID')).toBeVisible();
      await expect(page.locator('text=Amount')).toBeVisible();

      await page.click('.close-btn');

      await expect(page.locator('text=Transaction Details')).not.toBeVisible();
    }
  });
});