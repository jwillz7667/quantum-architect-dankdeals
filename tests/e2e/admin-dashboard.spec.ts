import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@dankdealsmn.com');
    await page.fill('input[type="password"]', 'adminpassword');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to home
    await page.waitForURL('/');
    
    // Navigate to admin
    await page.goto('/admin');
  });

  test('should display admin navigation', async ({ page }) => {
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Customers')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should navigate to products page', async ({ page }) => {
    await page.click('text=Products');
    await expect(page).toHaveURL('/admin/products');
    await expect(page.locator('h1:has-text("Manage Products")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Product")')).toBeVisible();
  });

  test('should add a new product', async ({ page }) => {
    await page.click('text=Products');
    await page.click('button:has-text("Add Product")');
    
    // Fill in product details
    await page.fill('input[placeholder="Product Name"]', 'Test Product');
    await page.fill('input[placeholder="Price"]', '99.99');
    await page.fill('input[placeholder="Stock"]', '10');
    
    await page.click('button:has-text("Add Product")');
    
    // Verify product was added
    await expect(page.locator('text=Test Product')).toBeVisible();
    await expect(page.locator('text=$99.99')).toBeVisible();
  });

  test('should view order details', async ({ page }) => {
    await page.click('text=Orders');
    await expect(page).toHaveURL('/admin/orders');
    
    // Click on first order view button
    const viewButton = page.locator('button[aria-label="View order"]').first();
    await viewButton.click();
    
    // Check order details dialog
    await expect(page.locator('text=Order Details')).toBeVisible();
    await expect(page.locator('text=Order ID:')).toBeVisible();
    await expect(page.locator('text=Customer:')).toBeVisible();
  });

  test('should search for customers', async ({ page }) => {
    await page.click('text=Customers');
    await expect(page).toHaveURL('/admin/customers');
    
    // Search for a customer
    await page.fill('input[placeholder="Search by email or name..."]', 'test@example.com');
    
    // Wait for search results
    await page.waitForTimeout(500); // Debounce delay
    
    // Verify search functionality
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display analytics charts', async ({ page }) => {
    await page.click('text=Analytics');
    await expect(page).toHaveURL('/admin/analytics');
    
    // Check for analytics components
    await expect(page.locator('text=Monthly Revenue')).toBeVisible();
    await expect(page.locator('text=Monthly Orders')).toBeVisible();
    await expect(page.locator('text=Average Order Value')).toBeVisible();
    await expect(page.locator('text=Daily Revenue (Last 30 Days)')).toBeVisible();
    await expect(page.locator('text=Top Products')).toBeVisible();
  });

  test('should update settings', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page).toHaveURL('/admin/settings');
    
    // Update store name
    await page.fill('input[id="storeName"]', 'New Store Name');
    await page.click('button:has-text("Save Store Settings")');
    
    // Verify success message
    await expect(page.locator('text=Store settings saved successfully')).toBeVisible();
  });

  test('non-admin users should be redirected', async ({ page }) => {
    // Logout and login as regular user
    await page.goto('/profile');
    await page.click('button:has-text("Sign Out")');
    
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'userpassword');
    await page.click('button[type="submit"]');
    
    // Try to access admin
    await page.goto('/admin');
    
    // Should be redirected to auth
    await expect(page).toHaveURL('/auth?reason=not_admin');
  });
}); 