import { test, expect } from '@playwright/test';

test.describe('Netbanking Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/welcome');
    
    await page.locator('input[type="email"]').fill('john@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForURL(/\/netbanking/);
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
});
