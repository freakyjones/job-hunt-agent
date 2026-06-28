import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  test('should sign up, log out, and log back in', async ({ page }) => {
    // 1. Navigate to Login Page
    await page.goto('/login');

    // 2. Fill out Sign up form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // Click Sign up
    await page.click('button:has-text("Sign up")');

    // 3. Verify successful redirection to jobs page
    await page.waitForURL('**/jobs');

    // Verify logged in state by checking for the Sign Out button
    const signOutBtn = page.locator('button:has-text("Sign Out")');
    await expect(signOutBtn).toBeVisible();

    // 4. Log out
    await signOutBtn.click();

    // 5. Verify redirection back to login page
    await page.waitForURL('**/login');

    // 6. Log back in with the created credentials
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button:has-text("Log in")');

    // 7. Verify successful login
    await page.waitForURL('**/jobs');
    await expect(signOutBtn).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'WrongPassword!123');
    await page.click('button:has-text("Log in")');

    // Inline error banner should appear
    const toast = page
      .locator('div[role="alert"]')
      .filter({ hasText: 'Invalid login credentials' });
    await expect(toast).toBeVisible();
  });
});
