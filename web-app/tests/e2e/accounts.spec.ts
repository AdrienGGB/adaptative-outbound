import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from './helpers/auth';

test.describe('Accounts', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('should display accounts list', async ({ page }) => {
    await page.goto('/accounts');

    // Should see accounts heading
    await expect(page.locator('h1, h2').filter({ hasText: /accounts/i })).toBeVisible();

    // Should see create account button
    const createButton = page.locator('button:has-text("New Account"), button:has-text("Create Account"), a:has-text("New Account")').first();
    await expect(createButton).toBeVisible();
  });

  test('should create new account', async ({ page }) => {
    await page.goto('/accounts');

    // Click create account button
    const createButton = page.locator('button:has-text("New Account"), button:has-text("Create Account"), a:has-text("New Account")').first();
    await createButton.click();

    // Generate unique account name
    const accountName = `Test Corp ${Date.now()}`;

    // Fill form
    await page.fill('input[name="name"], input[placeholder*="name" i]', accountName);

    // Select industry if available
    const industrySelect = page.locator('select[name="industry"], [role="combobox"]').first();
    if (await industrySelect.isVisible()) {
      await industrySelect.click();
      await page.locator('text=Technology, [data-value="technology"]').first().click();
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success or redirect to account detail
    await page.waitForTimeout(2000);
    await expect(page.locator(`text=${accountName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should view account detail', async ({ page }) => {
    await page.goto('/accounts');

    // Click on first account
    const firstAccount = page.locator('table tbody tr, [data-testid="account-item"]').first();
    await firstAccount.click();

    // Should navigate to account detail page
    await page.waitForURL(/\/accounts\/[a-f0-9-]+/);

    // Should see account name
    await expect(page.locator('h1, h2')).toBeVisible();

    // Should see action buttons
    await expect(page.locator('button:has-text("Add Contact"), button:has-text("Log Activity")')).toHaveCount(2);
  });

  test('should edit account', async ({ page }) => {
    await page.goto('/accounts');

    // Click on first account
    const firstAccount = page.locator('table tbody tr').first();
    await firstAccount.click();

    // Wait for account detail page
    await page.waitForURL(/\/accounts\/[a-f0-9-]+/);

    // Click edit button
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Edit Account")').first();
    await editButton.click();

    // Should open edit form
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 5000 });

    // Modify account name
    const newName = `Updated Account ${Date.now()}`;
    await page.fill('input[name="name"]', newName);

    // Submit
    await page.click('button[type="submit"]');

    // Should show updated name
    await expect(page.locator(`text=${newName}`)).toBeVisible({ timeout: 10000 });
  });
});
