import { expect, test } from '@playwright/test';

test.describe('@admin Access Control', () => {
  test('redirects unauthenticated visitors to the login screen', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('body')).toContainText(/sign in/i);
  });

  test.fixme('allows administrators to create and update products', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.locator('h1, h2')).toContainText(/product/i);
  });
});
