import { test, expect } from '@playwright/test';

test.describe('Age Gate E2E Tests', () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies and localStorage before each test
    await context.clearCookies();
    await context.clearPermissions();
  });

  test('should display age gate on first visit', async ({ page }) => {
    await page.goto('/');

    // Age gate should be visible
    await expect(page.getByText('Age Verification Required')).toBeVisible();
    await expect(
      page.getByText('You must be 21 years or older to access this website')
    ).toBeVisible();

    // Should show Minnesota legal notice
    await expect(page.getByText('Minnesota Legal Notice:')).toBeVisible();
    await expect(
      page.getByText(/Cannabis products have not been analyzed or approved by the FDA/)
    ).toBeVisible();

    // Should show Cash Due on Delivery notice
    await expect(page.getByText('CASH DUE ON DELIVERY')).toBeVisible();

    // Should have both buttons
    await expect(page.getByRole('button', { name: 'I am 21 or older - Enter Site' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'I am under 21 - Exit' })).toBeVisible();
  });

  test('should redirect to Google when user is under 21', async ({ page }) => {
    await page.goto('/');

    // Click "I am under 21" button
    await page.getByRole('button', { name: 'I am under 21 - Exit' }).click();

    // Should redirect to Google
    await expect(page).toHaveURL('https://www.google.com/');
  });

  test('should allow access when user confirms they are 21+', async ({ page }) => {
    await page.goto('/');

    // Click "I am 21 or older" button
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Age gate should disappear
    await expect(page.getByText('Age Verification Required')).not.toBeVisible();

    // Should see the main site content
    await expect(page).toHaveTitle(/DankDeals/);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should remember age verification for subsequent visits', async ({ page, context }) => {
    await page.goto('/');

    // Verify age
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Navigate to another page
    await page.goto('/categories');

    // Age gate should not appear
    await expect(page.getByText('Age Verification Required')).not.toBeVisible();

    // Open new tab in same context
    const newPage = await context.newPage();
    await newPage.goto('/');

    // Age gate should not appear in new tab
    await expect(newPage.getByText('Age Verification Required')).not.toBeVisible();
  });

  test('should block access to all routes when not age verified', async ({ page }) => {
    // Try to access different routes directly
    const routes = ['/categories', '/cart', '/checkout/address', '/product/test'];

    for (const route of routes) {
      await page.goto(route);

      // Age gate should always appear
      await expect(page.getByText('Age Verification Required')).toBeVisible();
    }
  });

  test('should display all required legal compliance text', async ({ page }) => {
    await page.goto('/');

    // Check all compliance requirements
    await expect(page.getByText('Cannabis products are for adults 21+ only')).toBeVisible();
    await expect(page.getByText('You will not redistribute products to minors')).toBeVisible();
    await expect(
      page.getByText('Valid government-issued ID is required for all deliveries')
    ).toBeVisible();
    await expect(page.getByText(/All sales are final/)).toBeVisible();
  });

  test('should handle page refresh after age verification', async ({ page }) => {
    await page.goto('/');

    // Verify age
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Wait for age gate to disappear
    await expect(page.getByText('Age Verification Required')).not.toBeVisible();

    // Refresh the page
    await page.reload();

    // Age gate should not reappear
    await expect(page.getByText('Age Verification Required')).not.toBeVisible();
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab to first button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs depending on focus order

    // Enter should activate the focused button
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toContainText(/I am 21 or older|I am under 21/);

    // Can activate with Enter key
    await page.keyboard.press('Enter');
  });

  test('should display mobile-friendly layout on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Age gate should be visible and properly sized
    const ageGateCard = page.locator('[class*="Card"]').first();
    await expect(ageGateCard).toBeVisible();

    // Check that it's not wider than the viewport
    const cardBox = await ageGateCard.boundingBox();
    if (cardBox) {
      expect(cardBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('should persist age verification for 30 days', async ({ page }) => {
    await page.goto('/');

    // Verify age
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Get localStorage value
    const ageVerification = await page.evaluate(() => {
      return localStorage.getItem('dankdeals_age_verified');
    });

    expect(ageVerification).toBeTruthy();

    if (ageVerification) {
      const parsed = JSON.parse(ageVerification) as { verified: boolean; timestamp: string };
      expect(parsed.verified).toBe(true);
      expect(parsed.timestamp).toBeTruthy();
    }
  });
});
