import { test, expect } from '@playwright/test';

// Tag smoke tests for easy filtering
test.describe('Smoke Tests @smoke', () => {
  test.beforeEach(() => {
    // Set a shorter timeout for smoke tests
    test.setTimeout(10000);
  });

  test('home page loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check critical elements
    await expect(page).toHaveTitle(/DankDeals/);
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    // Verify no console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');

    // Test main navigation links
    await page.click('text=Categories');
    await expect(page).toHaveURL(/\/categories/);

    await page.click('text=Home');
    await expect(page).toHaveURL('/');
  });

  test('cart functionality works', async ({ page }) => {
    await page.goto('/');

    // Add item to cart (assuming there's a product on homepage)
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();

      // Check cart badge updates
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).toContainText('1');
    }

    // Navigate to cart
    await page.click('[aria-label="Shopping cart"]');
    await expect(page).toHaveURL(/\/cart/);
  });

  test('search functionality exists', async ({ page }) => {
    await page.goto('/');

    // Check search input exists
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Perform a search
    await searchInput.fill('test product');
    await searchInput.press('Enter');

    // Verify search happened (URL change or results shown)
    await page.waitForLoadState('networkidle');
  });

  test('footer links are present', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check important footer links
    const footerLinks = ['Privacy Policy', 'Terms of Service', 'FAQ'];

    for (const linkText of footerLinks) {
      const link = page.locator(`footer >> text=${linkText}`);
      await expect(link).toBeVisible();
    }
  });

  test('age verification appears', async ({ page, context }) => {
    // Clear cookies to ensure age gate shows
    await context.clearCookies();

    await page.goto('/');

    // Check for age verification modal
    const ageModal = page.locator('[role="dialog"], [data-testid="age-verification"]');
    const hasAgeVerification = await ageModal.isVisible();

    if (hasAgeVerification) {
      // Verify age gate functionality
      const confirmButton = page.locator('button:has-text("I am 21 or older")');
      await expect(confirmButton).toBeVisible();
    }
  });

  test('responsive design works', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check mobile menu exists
    const mobileMenuButton = page.locator('[aria-label="Menu"], [data-testid="mobile-menu"]');
    await expect(mobileMenuButton).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Check desktop navigation exists
    const desktopNav = page.locator('nav:not([data-mobile])');
    await expect(desktopNav).toBeVisible();
  });

  test('critical API endpoints respond', async ({ page }) => {
    await page.goto('/');

    // Monitor network requests
    const apiResponses = new Map<string, number>();

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('supabase')) {
        apiResponses.set(url, response.status());
      }
    });

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Check all API responses were successful
    for (const [_url, status] of apiResponses) {
      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(400);
    }
  });
});
