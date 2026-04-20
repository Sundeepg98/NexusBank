import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Login');
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeDisabled();
    
    await page.locator('input[type="email"]').fill('invalid');
    await page.locator('input[type="email"]').blur();
    
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('text=Register');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('h1')).toContainText('Create Account');
  });

  test('should show validation errors on registration form', async ({ page }) => {
    await page.goto('/register');
    
    const createButton = page.locator('button[type="submit"]');
    await expect(createButton).toBeDisabled();
    
    await page.locator('#firstName').fill('J');
    await page.locator('#firstName').blur();
    await expect(page.locator('text=At least 2 characters')).toBeVisible();
  });
});
