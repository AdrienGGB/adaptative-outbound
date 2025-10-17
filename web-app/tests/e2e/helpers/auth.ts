import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
}

export const testUsers = {
  admin: {
    email: 'test@example.com',
    password: 'Test1234',
  },
};

/**
 * Login helper for tests
 */
export async function login(page: Page, user: TestUser = testUsers.admin) {
  await page.goto('/login');

  // Fill login form
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/(accounts|dashboard)/);
}

/**
 * Logout helper for tests
 */
export async function logout(page: Page) {
  // Find and click logout button
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out"), a:has-text("Sign out")').first();

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('/login');
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForURL(/\/(accounts|dashboard)/, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure user is logged in before test
 */
export async function ensureLoggedIn(page: Page, user: TestUser = testUsers.admin) {
  await page.goto('/accounts');

  const loggedIn = await isLoggedIn(page);

  if (!loggedIn) {
    await login(page, user);
  }
}
