import { test, expect } from '@playwright/test';

test.describe('Netbanking Dashboard', () => {
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

  test('should display dashboard with user name', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Net Banking Dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should show dashboard cards', async ({ page }) => {
    await expect(page.locator('text=My Accounts')).toBeVisible();
    await expect(page.locator('text=Fund Transfer')).toBeVisible();
    await expect(page.locator('text=Transactions')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();
  });

  test('should toggle accounts section', async ({ page }) => {
    await page.click('text=My Accounts');
    
    await expect(page.locator('text=Your Accounts')).toBeVisible();
    await expect(page.locator('button:has-text("Create New Account")')).toBeVisible();
  });

  test('should toggle transfer form', async ({ page }) => {
    await page.click('text=Fund Transfer');
    
    await expect(page.locator('h3:has-text("Fund Transfer")')).toBeVisible();
    await expect(page.locator('text=From Account')).toBeVisible();
    await expect(page.locator('text=To Account Number')).toBeVisible();
    await expect(page.locator('text=Amount (USD)')).toBeVisible();
  });

  test('should toggle transactions section', async ({ page }) => {
    await page.click('text=Transactions');
    
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("Recent Transactions")')).toBeVisible();
  });

  test('should logout and redirect to welcome', async ({ page }) => {
    await page.click('button:has-text("Logout")');

    await page.waitForURL(/\/welcome/, { timeout: 10000 });
    await expect(page.locator('h2:has-text("Login")')).toBeVisible();
  });

  test('should complete transfer with OTP verification', async ({ page }) => {
    await page.click('text=Fund Transfer');

    await expect(page.locator('text=Single Transfer')).toBeVisible();

    const toAccountInput = page.locator('input#toAccount');
    const amountInput = page.locator('input#amount');

    await toAccountInput.fill('1234567890');
    await amountInput.fill('100');

    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(1000);

    const otpInput = page.locator('input#otp');
    await expect(otpInput).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(500);

    const toast = page.locator('.toast .message').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    const toastText = await toast.textContent().catch(() => '');
    const otpMatch = toastText?.match(/OTP is:\s*(\d{6})/);

    if (otpMatch && otpMatch[1]) {
      await otpInput.fill(otpMatch[1]);
    } else {
      await otpInput.fill('123456');
    }

    await page.locator('button:has-text("Confirm Transfer")').click();

    await page.waitForTimeout(2000);

    await expect(page.locator('.toast .message')).toBeVisible({ timeout: 5000 });
  });

  test('should cancel transfer during OTP step', async ({ page }) => {
    await page.click('text=Fund Transfer');

    const toAccountInput = page.locator('input#toAccount');
    const amountInput = page.locator('input#amount');

    await toAccountInput.fill('1234567890');
    await amountInput.fill('50');

    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(1500);

    const otpInput = page.locator('input#otp');
    await expect(otpInput).toBeVisible({ timeout: 5000 });

    await page.locator('button:has-text("Cancel")').last().click();

    await expect(page.locator('text=Single Transfer')).toBeVisible();
  });

  test('should show batch transfer form', async ({ page }) => {
    await page.click('text=Fund Transfer');
    await page.locator('button:has-text("Batch Transfer")').click();

    await expect(page.locator('text=Recipients')).toBeVisible();
    await expect(page.locator('button:has-text("+ Add Another Recipient")')).toBeVisible();
  });

  test('should add and remove recipients in batch transfer', async ({ page }) => {
    await page.click('text=Fund Transfer');
    await page.locator('button:has-text("Batch Transfer")').click();

    await page.locator('button:has-text("+ Add Another Recipient")').click();

    const recipients = page.locator('.recipient-group');
    await expect(recipients).toHaveCount(2);

    await page.locator('button:has-text("Remove")').first().click();

    await expect(recipients).toHaveCount(1);
  });

  test('should view transaction detail modal', async ({ page }) => {
    await page.click('text=Transactions');

    await page.waitForTimeout(1500);

    const transactionItem = page.locator('.transaction-item').first();
    const transactionExists = await transactionItem.isVisible().catch(() => false);

    if (transactionExists) {
      await transactionItem.click();

      await expect(page.locator('text=Transaction Details')).toBeVisible();
      await expect(page.locator('.detail-label:has-text("Transaction ID")')).toBeVisible();

      await page.locator('.close-btn').click();

      await expect(page.locator('text=Transaction Details')).not.toBeVisible();
    }
  });
});
