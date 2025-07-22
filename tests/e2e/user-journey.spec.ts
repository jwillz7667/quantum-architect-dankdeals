import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test('should complete full purchase journey from landing page to order confirmation', async ({
    page,
  }) => {
    // Start fresh with no age verification
    await page.context().clearCookies();
    await page.goto('/');

    // Step 1: Age Gate Verification
    await expect(page.getByText('Age Verification Required')).toBeVisible();
    await expect(page.getByText('CASH DUE ON DELIVERY')).toBeVisible();
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Should see homepage
    await expect(page.getByText('DankDeals')).toBeVisible();
    await expect(page.getByText('Categories')).toBeVisible();

    // Step 2: Browse Products
    await page.getByRole('button', { name: 'View All' }).click();
    await expect(page).toHaveURL('/categories');

    // Select a category
    await page.getByText('Flower').click();
    await page.waitForTimeout(500); // Wait for filter to apply

    // Click on a product
    const productCard = page.locator('.product-card').first();
    await productCard.click();

    // Step 3: Product Detail Page
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByText('Cash Due on Delivery')).toBeVisible();

    // Select variant if available
    const variantButtons = page.locator('button[data-variant]');
    if ((await variantButtons.count()) > 0) {
      await variantButtons.first().click();
    }

    // Add to cart
    await page.getByRole('button', { name: /add to cart/i }).click();

    // Step 4: Cart Page
    await expect(page).toHaveURL('/cart');
    await expect(page.getByText('Shopping Cart')).toBeVisible();

    // Verify item is in cart
    await expect(page.locator('.cart-item')).toHaveCount(1);

    // Proceed to checkout
    await page.getByRole('button', { name: /proceed to checkout/i }).click();

    // Step 5: Checkout - Address
    await expect(page).toHaveURL('/checkout/address');
    await expect(page.getByText(/must be 21\+/i)).toBeVisible();

    // Fill personal information
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('john.doe@example.com');
    await page.getByLabel(/phone/i).fill('6125551234');

    // Set date of birth (25 years old)
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 25);
    await page.getByLabel(/date of birth/i).fill(dob.toISOString().split('T')[0] || '');

    // Fill address
    await page.getByLabel(/street address/i).fill('123 Main Street');
    await page.getByLabel(/city/i).fill('Minneapolis');
    await page.getByLabel(/zip/i).fill('55401');

    // Continue
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 6: Checkout - Payment
    await expect(page).toHaveURL('/checkout/payment');
    await expect(page.getByText('Cash Due on Delivery')).toBeVisible();
    await expect(page.getByText(/payment required when your order arrives/i)).toBeVisible();

    // Verify tip calculator is present
    await expect(page.getByText('Tip Suggestion for Your Driver')).toBeVisible();

    // Continue to review
    await page.getByRole('button', { name: /review order/i }).click();

    // Step 7: Checkout - Review
    await expect(page).toHaveURL('/checkout/review');

    // Verify all information
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('123 Main Street')).toBeVisible();
    await expect(page.getByText('Minneapolis, MN 55401')).toBeVisible();
    await expect(page.getByText('Cash Due on Delivery')).toBeVisible();

    // Check legal notices
    await expect(page.getByText(/Minnesota Cannabis Notice/i)).toBeVisible();

    // Agree to terms
    await page.getByRole('checkbox', { name: /i agree to the terms/i }).click();

    // Place order
    await page.getByRole('button', { name: /place order/i }).click();

    // Step 8: Order Confirmation
    await expect(page).toHaveURL(/\/checkout\/complete/);
    await expect(page.getByText(/order confirmed/i)).toBeVisible();
    await expect(page.getByText(/team member will contact you/i)).toBeVisible();

    // Verify important reminders
    await expect(page.getByText(/21\+ with valid ID/i)).toBeVisible();
    await expect(page.getByText(/cash only upon delivery/i)).toBeVisible();
  });

  test('should handle returning customer with saved age verification', async ({ page }) => {
    // First visit - verify age
    await page.goto('/');
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Navigate away
    await page.goto('/categories');

    // Return to home - should not see age gate
    await page.goto('/');
    await expect(page.getByText('Age Verification Required')).not.toBeVisible();
    await expect(page.getByText('DankDeals')).toBeVisible();
  });

  test('should enforce Minnesota delivery restrictions', async ({ page }) => {
    // Skip age gate
    await page.goto('/');
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Go to delivery area page
    await page.getByText('Delivery Areas').click();
    await expect(page).toHaveURL('/delivery-area');

    // Verify Minnesota-specific information
    await expect(page.getByText(/Minneapolis/i)).toBeVisible();
    await expect(page.getByText(/St. Paul/i)).toBeVisible();
    await expect(page.getByText(/21\+ with valid government-issued ID/i)).toBeVisible();
  });

  test('should display Cash Due on Delivery throughout the journey', async ({ page }) => {
    // Skip age gate
    await page.goto('/');
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    const cashDueOnDeliveryLocations = [
      { url: '/faq', selector: 'text=/cash due on delivery/i' },
      { url: '/product/test', selector: 'text=/cash.*delivery/i' },
      { url: '/cart', selector: 'text=/cash|763-247-5378/i' },
    ];

    for (const location of cashDueOnDeliveryLocations) {
      await page.goto(location.url);
      const element = page.locator(location.selector);
      await expect(element.first()).toBeVisible();
    }
  });

  test('should handle search and filtering', async ({ page }) => {
    // Skip age gate
    await page.goto('/');
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Search for products
    const searchInput = page.getByPlaceholder('Search for products...');
    await searchInput.fill('indica');
    await searchInput.press('Enter');

    // Should still be able to see products or no results message
    await expect(page.locator('.product-card, text=/no products found/i').first()).toBeVisible();

    // Try category filter
    await page.goto('/categories');
    await page.getByText('Edibles').click();

    // URL should update with category
    await expect(page).toHaveURL(/category=edibles/);
  });

  test('should show proper error handling for underage users', async ({ page }) => {
    await page.goto('/');

    // Click "I am under 21"
    await page.getByRole('button', { name: 'I am under 21 - Exit' }).click();

    // Should redirect to Google
    await expect(page).toHaveURL('https://www.google.com/');
  });

  test('should persist cart across page navigation', async ({ page }) => {
    // Skip age gate
    await page.goto('/');
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Add item to cart from home page
    const addToCartButton = page.getByRole('button', { name: /add to cart/i }).first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
    } else {
      // Navigate to product page if no quick add
      await page.goto('/categories');
      await page.locator('.product-card').first().click();
      await page.getByRole('button', { name: /add to cart/i }).click();
    }

    // Should redirect to cart
    await expect(page).toHaveURL('/cart');

    // Navigate away
    await page.goto('/faq');

    // Return to cart
    await page.goto('/cart');

    // Item should still be there
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

  test('should validate phone number format', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/');
    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Add dummy cart data via localStorage
    await page.evaluate(() => {
      localStorage.setItem(
        'dankdeals_cart',
        JSON.stringify([
          {
            id: 'test-1',
            productId: 'product-1',
            variantId: 'variant-1',
            name: 'Test Product',
            variantName: '3.5g',
            price: 45.0,
            quantity: 1,
            imageUrl: 'test.jpg',
          },
        ])
      );
    });

    await page.goto('/checkout/address');

    // Test invalid phone format
    const phoneInput = page.getByLabel(/phone/i);
    await phoneInput.fill('123'); // Too short

    await page.getByRole('button', { name: /continue/i }).click();

    // Should show validation error
    await expect(page.getByText(/valid.*phone/i)).toBeVisible();
  });

  test('should display all legal compliance information', async ({ page }) => {
    await page.goto('/');

    // Age gate shows compliance
    await expect(
      page.getByText(/Cannabis products have not been analyzed or approved by the FDA/)
    ).toBeVisible();

    await page.getByRole('button', { name: 'I am 21 or older - Enter Site' }).click();

    // Footer should have compliance info
    await page.goto('/legal');
    await expect(page.getByText(/Licensed Cannabis Retailer/i)).toBeVisible();
    await expect(page.getByText(/Minnesota state regulations/i)).toBeVisible();
  });
});
