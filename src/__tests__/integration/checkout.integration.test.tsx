import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import { CartProvider } from '@/hooks/CartProvider';
import type { Product, ProductVariant } from '@/hooks/useProducts';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        in: (field: string, values: string[]) => {
          // Return the test products if they're in the requested IDs
          const validProducts = [];
          if (values.includes('test-product-123')) {
            validProducts.push({ id: 'test-product-123' });
          }
          if (values.includes('product-1')) {
            validProducts.push({ id: 'product-1' });
          }
          if (values.includes('product-2')) {
            validProducts.push({ id: 'product-2' });
          }
          return Promise.resolve({
            data: validProducts,
            error: null,
          });
        },
      }),
      insert: () => Promise.resolve({ data: { id: 'test-order-123' }, error: null }),
    }),
  },
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock useProducts hook
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

// Mock cookies to simulate age verification already completed
vi.mock('@/lib/cookies', () => ({
  getCookie: vi.fn(() => 'true'), // User is age verified
  setCookie: vi.fn(),
}));

// Mock the CartProvider to return controlled cart data
const mockUseCart = vi.fn(() => ({
  items: [],
  totalItems: 0,
  subtotal: 0,
  taxAmount: 0,
  deliveryFee: 5.0,
  totalPrice: 5.0,
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  isLoading: false,
  addItem: vi.fn(),
  clearCart: vi.fn(),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: mockUseCart,
}));

// Mock product data
const mockProduct: Product = {
  id: 'test-product-123',
  name: 'Test Strain',
  description: 'Test description',
  image_url: 'https://example.com/image.jpg',
  category: 'flower',
  thc_content: 22.5,
  cbd_content: 0.5,
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  variants: [],
};

const mockVariant: ProductVariant = {
  id: 'variant-123',
  name: '3.5g',
  price: 4500, // $45.00 in cents
  weight_grams: 3.5,
  inventory_count: 10,
  is_active: true,
};

const createWrapper = (initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <CartProvider>{children}</CartProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Checkout Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    mockToast.mockClear();
    // Reset cart mock to empty state
    mockUseCart.mockReturnValue({
      items: [],
      totalItems: 0,
      subtotal: 0,
      taxAmount: 0,
      deliveryFee: 5.0,
      totalPrice: 5.0,
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      isLoading: false,
      addItem: vi.fn(),
      clearCart: vi.fn(),
    });
  });

  it('should complete full checkout flow from cart to confirmation', async () => {
    // Start with item in cart
    const cartItem = {
      id: 'cart-item-1',
      productId: mockProduct.id,
      variantId: mockVariant.id,
      name: mockProduct.name,
      price: 45.0, // Converted to dollars
      quantity: 2,
      image: mockProduct.image_url,
      variant: {
        name: mockVariant.name,
        weight_grams: mockVariant.weight_grams,
      },
      category: mockProduct.category,
    };

    // Configure the cart mock with our test data
    mockUseCart.mockReturnValue({
      items: [cartItem],
      totalItems: 2,
      subtotal: 90.0, // 45 * 2
      taxAmount: 9.23, // 90 * 0.1025
      deliveryFee: 5.0,
      totalPrice: 104.23,
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      isLoading: false,
      addItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(<App />, {
      wrapper: createWrapper(['/cart']),
    });

    // Wait for lazy-loaded component and verify we're on cart page with items
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /shopping cart/i })).toBeInTheDocument();
    });
    expect(screen.getByText('Test Strain')).toBeInTheDocument();
    expect(screen.getByText(/3\.5g.*3\.5g/)).toBeInTheDocument();

    // Click checkout button
    const checkoutButton = screen.getByRole('button', { name: /proceed to checkout/i });
    fireEvent.click(checkoutButton);

    // Should navigate to address page
    await waitFor(() => {
      expect(screen.getByText(/personal information/i)).toBeInTheDocument();
    });

    // Fill out personal information
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.getByLabelText(/phone/i);
    const dobInput = screen.getByLabelText(/date of birth/i);

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '6125551234' } });
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });

    // Fill out address
    const streetInput = screen.getByLabelText(/street address/i);
    const cityInput = screen.getByLabelText(/city/i);
    const zipInput = screen.getByLabelText(/zip code/i);

    fireEvent.change(streetInput, { target: { value: '123 Main St' } });
    fireEvent.change(cityInput, { target: { value: 'Minneapolis' } });
    fireEvent.change(zipInput, { target: { value: '55401' } });

    // Continue to payment
    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    // Should be on payment page
    await waitFor(() => {
      expect(screen.getByText(/payment method/i)).toBeInTheDocument();
    });

    // Verify Cash Due on Delivery is selected
    expect(screen.getByText('Cash Due on Delivery')).toBeInTheDocument();
    expect(screen.getByText(/payment required when your order arrives/i)).toBeInTheDocument();

    // Continue to review
    const reviewButton = screen.getByRole('button', { name: /review order/i });
    fireEvent.click(reviewButton);

    // Should be on review page
    expect(screen.getByText(/review your order/i)).toBeInTheDocument();

    // Check all information is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Minneapolis, MN 55401')).toBeInTheDocument();
    expect(screen.getByText('Cash Due on Delivery')).toBeInTheDocument();

    // Agree to terms
    const termsCheckbox = screen.getByRole('checkbox', { name: /i agree to the terms/i });
    fireEvent.click(termsCheckbox);

    // Place order
    const placeOrderButton = screen.getByRole('button', { name: /place order/i });
    fireEvent.click(placeOrderButton);

    // Should show success page
    expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();

    // Should clear cart
    const storedCart = localStorage.getItem('dankdeals_cart');
    expect(storedCart).toBe('[]');
  });

  it('should enforce age verification during checkout', async () => {
    render(<App />, {
      wrapper: createWrapper(['/checkout/address']),
    });

    // Wait for component to load and fill form with underage date of birth
    await waitFor(() => {
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    });

    const dobInput = screen.getByLabelText(/date of birth/i);
    const underageDate = new Date();
    underageDate.setFullYear(underageDate.getFullYear() - 18); // 18 years old

    fireEvent.change(dobInput, {
      target: { value: underageDate.toISOString().split('T')[0] },
    });

    // Try to continue
    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    // Should show age error
    expect(screen.getByText(/must be 21 or older/i)).toBeInTheDocument();
  });

  it('should validate all required fields', async () => {
    render(<App />, {
      wrapper: createWrapper(['/checkout/address']),
    });

    // Wait for component to load, then try to continue without filling fields
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  it('should display Cash Due on Delivery prominently', async () => {
    render(<App />, {
      wrapper: createWrapper(['/checkout/payment']),
    });

    // Wait for component to load and check Cash Due on Delivery is visible and emphasized
    await waitFor(() => {
      expect(screen.getByText('Cash Due on Delivery')).toBeInTheDocument();
    });
    expect(screen.getByText(/payment in cash required/i)).toBeInTheDocument();
    expect(screen.getByText(/please have exact cash ready/i)).toBeInTheDocument();
  });

  it('should calculate and display order totals correctly', async () => {
    const cartItems = [
      {
        id: 'item-1',
        productId: 'product-1',
        variantId: 'variant-1',
        name: 'Product 1',
        price: 45.0,
        quantity: 2,
        image: 'test.jpg',
        variant: {
          name: '3.5g',
          weight_grams: 3.5,
        },
        category: 'flower',
      },
      {
        id: 'item-2',
        productId: 'product-2',
        variantId: 'variant-2',
        name: 'Product 2',
        price: 80.0,
        quantity: 1,
        image: 'test2.jpg',
        variant: {
          name: '7g',
          weight_grams: 7.0,
        },
        category: 'flower',
      },
    ];

    // Configure the cart mock with calculation test data
    mockUseCart.mockReturnValue({
      items: cartItems,
      totalItems: 3,
      subtotal: 170.0, // (45*2) + (80*1) = 170
      taxAmount: 17.43, // 170 * 0.1025 = 17.425 ≈ 17.43
      deliveryFee: 5.0,
      totalPrice: 192.43,
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      isLoading: false,
      addItem: vi.fn(),
      clearCart: vi.fn(),
    });

    render(<App />, {
      wrapper: createWrapper(['/cart']),
    });

    // Wait for component to load and check subtotal (45*2 + 80 = 170)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /shopping cart/i })).toBeInTheDocument();
    });
    expect(screen.getByText('$170.00')).toBeInTheDocument();

    // Check tax is calculated (170 * 0.1025 = 17.43)
    expect(screen.getByText(/\$17\.4[23]/)).toBeInTheDocument();

    // Check delivery fee
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  it('should redirect to cart if checkout accessed with empty cart', async () => {
    localStorage.setItem('dankdeals_cart', JSON.stringify([]));

    render(<App />, {
      wrapper: createWrapper(['/checkout/address']),
    });

    // Wait for component to load and should redirect to cart page
    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
  });
});
