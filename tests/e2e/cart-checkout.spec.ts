// tests/e2e/cart-checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cart and Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should load homepage and navigate to product', async ({ page }) => {
    // Check homepage loads
    await expect(page).toHaveTitle(/DankDeals/i);

    // Wait for products to load using actual class names
    await page.waitForSelector('.product-card', { timeout: 10000 });

    // Click on first product card
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.click();

    // Should navigate to product detail page
    expect(page.url()).toContain('/product/');

    // Wait for product detail page to load
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('should add product to cart', async ({ page }) => {
    // Navigate directly to a product page
    await page.goto('/product/runtz');
    await page.waitForLoadState('networkidle');

    // Wait for add to cart button - using text content
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCartButton).toBeVisible({ timeout: 10000 });

    // Click add to cart
    await addToCartButton.click();

    // Should see a toast notification or cart update
    // Cart icon in bottom nav should show count
    await page.waitForTimeout(1000); // Give time for cart update

    // Navigate to cart
    await page.goto('/cart');

    // Should see the product in cart
    await expect(page.locator('.product-card')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate through basic pages', async ({ page }) => {
    // Test navigation to key pages
    const pages = [
      { path: '/categories', title: /categories/i },
      { path: '/faq', title: /faq/i },
      { path: '/cart', title: /cart/i },
    ];

    for (const { path, title } of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle(title, { timeout: 10000 });
    }
  });
});
