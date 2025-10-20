import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from './helpers/auth';

test.describe('Contacts', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('should display contacts list', async ({ page }) => {
    await page.goto('/contacts');

    // Should see contacts heading
    await expect(page.locator('h1, h2').filter({ hasText: /contacts/i })).toBeVisible();

    // Should see create contact button
    const createButton = page.locator('button:has-text("New Contact"), button:has-text("Create Contact"), a:has-text("New Contact")').first();
    await expect(createButton).toBeVisible();
  });

  test('should create new contact', async ({ page }) => {
    await page.goto('/contacts');

    // Click create contact button
    const createButton = page.locator('button:has-text("New Contact"), button:has-text("Create Contact"), a:has-text("New Contact")').first();
    await createButton.click();

    // Fill form
    await page.fill('input[name="first_name"], input[placeholder*="First"]', 'John');
    await page.fill('input[name="last_name"], input[placeholder*="Last"]', 'Doe');
    await page.fill('input[name="email"], input[placeholder*="email" i], input[type="email"]', 'john.doe.test@example.com');
    await page.fill('input[name="title"], input[placeholder*="title" i]', 'CEO');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message or redirect to contact detail
    await page.waitForTimeout(2000);

    // Verify contact was created (either on list or detail page)
    await expect(page.locator('text=John Doe, text=john.doe.test@example.com').first()).toBeVisible({ timeout: 10000 });
  });

  test('BUG-001: should be able to edit contact', async ({ page }) => {
    await page.goto('/contacts');

    // Click on first contact
    const firstContact = page.locator('table tbody tr, [data-testid="contact-item"]').first();
    await firstContact.click();

    // Wait for contact detail page
    await page.waitForURL(/\/contacts\/[a-f0-9-]+/);

    // Find and click edit button
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Edit Contact")').first();

    // This should be visible
    await expect(editButton).toBeVisible();

    // BUG: This will fail because onClick handler is missing
    await editButton.click();

    // Should open edit form/dialog
    // If bug is fixed, this should pass
    await expect(page.locator('input[name="first_name"], input[placeholder*="First"]')).toBeVisible({ timeout: 5000 });
  });

  test('BUG-006: should reset form after creating contact', async ({ page }) => {
    await page.goto('/contacts');

    // Click create contact button
    const createButton = page.locator('button:has-text("New Contact"), button:has-text("Create Contact")').first();
    await createButton.click();

    // Fill form with first contact
    await page.fill('input[name="first_name"], input[placeholder*="First"]', 'Alice');
    await page.fill('input[name="last_name"], input[placeholder*="Last"]', 'Smith');
    await page.fill('input[name="email"], input[type="email"]', 'alice.smith@test.com');

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Open create dialog again
    await page.goto('/contacts');
    await createButton.click();

    // BUG: Form should be empty, but previous data might still be there
    const firstNameValue = await page.locator('input[name="first_name"], input[placeholder*="First"]').inputValue();
    const lastNameValue = await page.locator('input[name="last_name"], input[placeholder*="Last"]').inputValue();
    const emailValue = await page.locator('input[type="email"]').inputValue();

    // These should all be empty
    expect(firstNameValue).toBe('');
    expect(lastNameValue).toBe('');
    expect(emailValue).toBe('');
  });

  test('BUG-004: should preserve dialog state when window loses focus', async ({ page }) => {
    await page.goto('/accounts');

    // Click on first account
    const firstAccount = page.locator('table tbody tr, [data-testid="account-item"]').first();
    await firstAccount.click();

    // Click "Add Contact" button
    const addContactButton = page.locator('button:has-text("Add Contact")').first();
    await addContactButton.click();

    // Fill in some data
    await page.fill('input[name="first_name"], input[placeholder*="First"]', 'Test');
    await page.fill('input[name="last_name"], input[placeholder*="Last"]', 'User');
    await page.fill('input[name="email"], input[type="email"]', 'test.user@example.com');

    // Simulate window focus loss by opening a new tab
    const newPage = await page.context().newPage();
    await newPage.goto('about:blank');
    await page.waitForTimeout(500);

    // Close the new tab to return focus
    await newPage.close();
    await page.waitForTimeout(500);

    // BUG: Data should still be there
    const firstNameValue = await page.locator('input[name="first_name"], input[placeholder*="First"]').inputValue();
    const lastNameValue = await page.locator('input[name="last_name"], input[placeholder*="Last"]').inputValue();
    const emailValue = await page.locator('input[type="email"]').inputValue();

    expect(firstNameValue).toBe('Test');
    expect(lastNameValue).toBe('User');
    expect(emailValue).toBe('test.user@example.com');
  });
});
