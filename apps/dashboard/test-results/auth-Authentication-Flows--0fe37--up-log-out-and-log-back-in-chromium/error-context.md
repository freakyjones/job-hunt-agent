# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flows >> should sign up, log out, and log back in
- Location: tests\e2e\auth.spec.ts:7:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/jobs" until "load"
  navigated to "http://localhost:3001/login"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
    - generic [ref=e3]:
        - heading "Job Hunt Agent" [level=1] [ref=e4]
        - generic [ref=e5]:
            - alert [ref=e6]: Email address "test-1782678246440@example.com" is invalid
            - generic [ref=e7]:
                - generic [ref=e8]: Email
                - textbox "Email" [ref=e9]:
                    - /placeholder: you@example.com
            - generic [ref=e10]:
                - generic [ref=e11]: Password
                - textbox "Password" [ref=e12]
            - generic [ref=e13]:
                - button "Log in" [ref=e14] [cursor=pointer]
                - button "Sign up" [ref=e15] [cursor=pointer]
    - alert [ref=e16]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Authentication Flows', () => {
  4  |   const testEmail = `test-${Date.now()}@example.com`;
  5  |   const testPassword = 'Password123!';
  6  |
  7  |   test('should sign up, log out, and log back in', async ({ page }) => {
  8  |     // 1. Navigate to Login Page
  9  |     await page.goto('/login');
  10 |
  11 |     // 2. Fill out Sign up form
  12 |     await page.fill('input[name="email"]', testEmail);
  13 |     await page.fill('input[name="password"]', testPassword);
  14 |
  15 |     // Click Sign up
  16 |     await page.click('button:has-text("Sign up")');
  17 |
  18 |     // 3. Verify successful redirection to jobs page
> 19 |     await page.waitForURL('**/jobs');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  20 |
  21 |     // Verify logged in state by checking for the Sign Out button
  22 |     const signOutBtn = page.locator('button:has-text("Sign Out")');
  23 |     await expect(signOutBtn).toBeVisible();
  24 |
  25 |     // 4. Log out
  26 |     await signOutBtn.click();
  27 |
  28 |     // 5. Verify redirection back to login page
  29 |     await page.waitForURL('**/login');
  30 |
  31 |     // 6. Log back in with the created credentials
  32 |     await page.fill('input[name="email"]', testEmail);
  33 |     await page.fill('input[name="password"]', testPassword);
  34 |     await page.click('button:has-text("Log in")');
  35 |
  36 |     // 7. Verify successful login
  37 |     await page.waitForURL('**/jobs');
  38 |     await expect(signOutBtn).toBeVisible();
  39 |   });
  40 |
  41 |   test('should show error for invalid credentials', async ({ page }) => {
  42 |     await page.goto('/login');
  43 |
  44 |     await page.fill('input[name="email"]', 'invalid@example.com');
  45 |     await page.fill('input[name="password"]', 'WrongPassword!123');
  46 |     await page.click('button:has-text("Log in")');
  47 |
  48 |     // Inline error banner should appear
  49 |     const toast = page
  50 |       .locator('div[role="alert"]')
  51 |       .filter({ hasText: 'Invalid login credentials' });
  52 |     await expect(toast).toBeVisible();
  53 |   });
  54 | });
  55 |
```
