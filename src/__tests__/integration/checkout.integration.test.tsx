import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
        in: () => Promise.resolve({ data: [] }),
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
  vendor: { name: 'Test Vendor', status: 'active' },
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
  });

  it('should complete full checkout flow from cart to confirmation', () => {
    // Start with item in cart
    const cartItem = {
      id: 'cart-item-1',
      productId: mockProduct.id,
      variantId: mockVariant.id,
      name: mockProduct.name,
      variantName: mockVariant.name,
      price: 45.0, // Converted to dollars
      quantity: 2,
      imageUrl: mockProduct.image_url,
    };

    localStorage.setItem('dankdeals_cart', JSON.stringify([cartItem]));

    render(<App />, {
      wrapper: createWrapper(['/cart']),
    });

    // Verify we're on cart page with items
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(screen.getByText('Test Strain')).toBeInTheDocument();
    expect(screen.getByText('3.5g')).toBeInTheDocument();

    // Click checkout button
    const checkoutButton = screen.getByRole('button', { name: /proceed to checkout/i });
    fireEvent.click(checkoutButton);

    // Should navigate to address page
    expect(screen.getByText(/delivery information/i)).toBeInTheDocument();

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
    expect(screen.getByText(/payment method/i)).toBeInTheDocument();

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

  it('should enforce age verification during checkout', () => {
    render(<App />, {
      wrapper: createWrapper(['/checkout/address']),
    });

    // Fill form with underage date of birth
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();

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

  it('should validate all required fields', () => {
    render(<App />, {
      wrapper: createWrapper(['/checkout/address']),
    });

    // Try to continue without filling fields
    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    // Should show validation errors
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
  });

  it('should display Cash Due on Delivery prominently', () => {
    render(<App />, {
      wrapper: createWrapper(['/checkout/payment']),
    });

    // Check Cash Due on Delivery is visible and emphasized
    expect(screen.getByText('Cash Due on Delivery')).toBeInTheDocument();
    expect(screen.getByText(/payment in cash required/i)).toBeInTheDocument();
    expect(screen.getByText(/please have exact cash ready/i)).toBeInTheDocument();
  });

  it('should calculate and display order totals correctly', () => {
    const cartItems = [
      {
        id: 'item-1',
        productId: 'product-1',
        variantId: 'variant-1',
        name: 'Product 1',
        variantName: '3.5g',
        price: 45.0,
        quantity: 2,
        imageUrl: 'test.jpg',
      },
      {
        id: 'item-2',
        productId: 'product-2',
        variantId: 'variant-2',
        name: 'Product 2',
        variantName: '7g',
        price: 80.0,
        quantity: 1,
        imageUrl: 'test2.jpg',
      },
    ];

    localStorage.setItem('dankdeals_cart', JSON.stringify(cartItems));

    render(<App />, {
      wrapper: createWrapper(['/cart']),
    });

    // Check subtotal (45*2 + 80 = 170)
    expect(screen.getByText('$170.00')).toBeInTheDocument();

    // Check tax is calculated (170 * 0.1025 = 17.43)
    expect(screen.getByText(/\$17\.4[23]/)).toBeInTheDocument();

    // Check delivery fee
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  it('should redirect to cart if checkout accessed with empty cart', () => {
    localStorage.setItem('dankdeals_cart', JSON.stringify([]));

    render(<App />, {
      wrapper: createWrapper(['/checkout/address']),
    });

    // Should redirect to cart page
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});
