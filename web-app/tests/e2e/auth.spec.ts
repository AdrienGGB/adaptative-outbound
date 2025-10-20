import { test, expect } from '@playwright/test';
import { login, logout, testUsers } from './helpers/auth';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await login(page, testUsers.admin);

    // Should be redirected to accounts page
    await expect(page).toHaveURL(/\/(accounts|dashboard)/);

    // Should see user interface elements
    const accountsLink = page.locator('a:has-text("Accounts"), text=Accounts').first();
    await expect(accountsLink).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    await login(page, testUsers.admin);
    await logout(page);

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
  });
});
