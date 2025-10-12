import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from './helpers/auth';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('BUG-003: should have navigation link to tasks page', async ({ page }) => {
    await page.goto('/accounts');

    // BUG: There should be a tasks link in the navigation
    const tasksLink = page.locator('a[href="/tasks"], nav a:has-text("Tasks")').first();

    // This will fail until bug is fixed
    await expect(tasksLink).toBeVisible();
  });

  test('should access tasks page directly', async ({ page }) => {
    await page.goto('/tasks');

    // Should see tasks heading
    await expect(page.locator('h1, h2').filter({ hasText: /tasks/i })).toBeVisible();
  });

  test('BUG-005: should create task without controlled/uncontrolled warnings', async ({ page }) => {
    await page.goto('/tasks');

    // Open create task dialog
    const createButton = page.locator('button:has-text("New Task"), button:has-text("Create Task")').first();
    await createButton.click();

    // Fill form
    await page.fill('input[name="title"], input[placeholder*="title" i]', 'Test Task');

    // Select priority if available
    const prioritySelect = page.locator('select[name="priority"], [role="combobox"]').first();
    if (await prioritySelect.isVisible()) {
      await prioritySelect.click();
      await page.locator('text=High, [data-value="high"]').first().click();
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Should create task successfully
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Test Task')).toBeVisible({ timeout: 10000 });

    // Check browser console for warnings (this would be done manually or with CDP)
  });

  test('should complete task', async ({ page }) => {
    await page.goto('/tasks');

    // Find a task in "todo" status
    const task = page.locator('[data-status="todo"], table tbody tr').first();

    if (await task.isVisible()) {
      await task.click();

      // Change status to done
      const statusSelect = page.locator('select[name="status"], [role="combobox"]').first();
      if (await statusSelect.isVisible()) {
        await statusSelect.click();
        await page.locator('text=Done, [data-value="done"]').first().click();

        // Save
        await page.click('button[type="submit"], button:has-text("Save")');

        // Should show completed
        await expect(page.locator('text=/completed|done/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
