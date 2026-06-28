# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flows >> should show error for invalid credentials
- Location: tests\e2e\auth.spec.ts:41:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('div[role="alert"]')
Expected substring: "Invalid login credentials"
Error: strict mode violation: locator('div[role="alert"]') resolved to 2 elements:
    1) <div role="alert" class="login-module__2dj2eq__errorBanner">Invalid login credentials</div> aka getByText('Invalid login credentials')
    2) <div role="alert" aria-live="assertive" id="__next-route-announcer__"></div> aka locator('[id="__next-route-announcer__"]')

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('div[role="alert"]')
    5 × locator resolved to <div role="alert" aria-live="assertive" id="__next-route-announcer__"></div>
      - unexpected value ""

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
    - generic [ref=e3]:
        - heading "Job Hunt Agent" [level=1] [ref=e4]
        - generic [ref=e5]:
            - alert [ref=e6]: Invalid login credentials
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
    - button "Open Next.js Dev Tools" [ref=e21] [cursor=pointer]:
        - img [ref=e22]
    - alert [ref=e25]
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
  19 |     await page.waitForURL('**/jobs');
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
  49 |     const toast = page.locator('div[role="alert"]');
  50 |     await expect(toast).toBeVisible();
> 51 |     await expect(toast).toContainText('Invalid login credentials');
     |                         ^ Error: expect(locator).toContainText(expected) failed
  52 |   });
  53 | });
  54 |
```
