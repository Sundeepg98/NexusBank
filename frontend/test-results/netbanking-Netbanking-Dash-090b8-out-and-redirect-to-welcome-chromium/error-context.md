# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: netbanking.spec.ts >> Netbanking Dashboard >> should logout and redirect to welcome
- Location: tests\netbanking.spec.ts:49:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/welcome/
Received string:  "http://localhost:4200/netbanking"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:4200/netbanking"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - generic [ref=e4]: NexusBank
    - generic [ref=e5]:
      - generic [ref=e6]: Home
      - generic [ref=e7]: About Us
      - generic [ref=e8]: Services
      - generic [ref=e9]: Contact
      - generic [ref=e10]: Net Banking
  - main [ref=e11]:
    - generic [ref=e14]:
      - generic [ref=e15]:
        - heading "Net Banking Dashboard" [level=1] [ref=e16]
        - paragraph [ref=e17]: Welcome back, User!
      - generic [ref=e18]:
        - generic [ref=e21] [cursor=pointer]:
          - generic [ref=e22]: 🏦
          - heading "My Accounts" [level=3] [ref=e23]
          - paragraph [ref=e24]: View your account details and balances
        - generic [ref=e27] [cursor=pointer]:
          - generic [ref=e28]: 💸
          - heading "Fund Transfer" [level=3] [ref=e29]
          - paragraph [ref=e30]: Transfer money to other accounts
        - generic [ref=e33] [cursor=pointer]:
          - generic [ref=e34]: 📊
          - heading "Transactions" [level=3] [ref=e35]
          - paragraph [ref=e36]: View your transaction history
        - generic [ref=e39] [cursor=pointer]:
          - generic [ref=e40]: 👤
          - heading "Profile" [level=3] [ref=e41]
          - paragraph [ref=e42]: Manage your account settings
      - button "Logout" [active] [ref=e44] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Netbanking Dashboard', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/welcome');
  6  |     
  7  |     await page.locator('input[type="email"]').fill('john@example.com');
  8  |     await page.locator('input[type="password"]').fill('password123');
  9  |     await page.locator('button[type="submit"]').click();
  10 |     
  11 |     await page.waitForURL(/\/netbanking/);
  12 |   });
  13 | 
  14 |   test('should display dashboard with user name', async ({ page }) => {
  15 |     await expect(page.locator('h1')).toContainText('Net Banking Dashboard');
  16 |     await expect(page.locator('text=Welcome back')).toBeVisible();
  17 |   });
  18 | 
  19 |   test('should show dashboard cards', async ({ page }) => {
  20 |     await expect(page.locator('text=My Accounts')).toBeVisible();
  21 |     await expect(page.locator('text=Fund Transfer')).toBeVisible();
  22 |     await expect(page.locator('text=Transactions')).toBeVisible();
  23 |     await expect(page.locator('text=Profile')).toBeVisible();
  24 |   });
  25 | 
  26 |   test('should toggle accounts section', async ({ page }) => {
  27 |     await page.click('text=My Accounts');
  28 |     
  29 |     await expect(page.locator('text=Your Accounts')).toBeVisible();
  30 |     await expect(page.locator('button:has-text("Create New Account")')).toBeVisible();
  31 |   });
  32 | 
  33 |   test('should toggle transfer form', async ({ page }) => {
  34 |     await page.click('text=Fund Transfer');
  35 |     
  36 |     await expect(page.locator('h2:has-text("Transfer Funds")')).toBeVisible();
  37 |     await expect(page.locator('text=From Account')).toBeVisible();
  38 |     await expect(page.locator('text=To Account Number')).toBeVisible();
  39 |     await expect(page.locator('text=Amount (USD)')).toBeVisible();
  40 |   });
  41 | 
  42 |   test('should toggle transactions section', async ({ page }) => {
  43 |     await page.click('text=Transactions');
  44 |     
  45 |     await page.waitForTimeout(1000);
  46 |     await expect(page.locator('h2:has-text("Recent Transactions")')).toBeVisible();
  47 |   });
  48 | 
  49 |   test('should logout and redirect to welcome', async ({ page }) => {
  50 |     await page.click('button:has-text("Logout")');
  51 |     
> 52 |     await expect(page).toHaveURL(/\/welcome/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  53 |   });
  54 | });
  55 | 
```