import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart, CartProvider } from '@/hooks/useCart';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('useCart Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      description: 'Test description',
      image_url: 'test.jpg',
      category: 'flower',
      thc_content: 20,
      cbd_content: 0,
      vendor_id: 'vendor1',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      variants: [],
      vendor: { name: 'Test Vendor', status: 'active' }
    };

    const mockVariant = {
      id: 'v1',
      name: '1g',
      price: 2000, // $20.00 in cents
      weight_grams: 1,
      inventory_count: 10,
      is_active: true
    };

    act(() => {
      result.current.addItem(mockProduct, mockVariant, 1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Test Product');
    expect(result.current.items[0].price).toBe(20); // Converted to dollars
    expect(result.current.totalItems).toBe(1);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    // First add an item
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      description: null,
      image_url: null,
      category: 'flower',
      thc_content: null,
      cbd_content: null,
      vendor_id: 'vendor1',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      variants: [],
      vendor: { name: 'Test Vendor', status: 'active' }
    };

    const mockVariant = {
      id: 'v1',
      name: '1g',
      price: 2000,
      weight_grams: 1,
      inventory_count: 10,
      is_active: true
    };

    act(() => {
      result.current.addItem(mockProduct, mockVariant, 1);
    });

    const itemId = result.current.items[0].id;

    act(() => {
      result.current.updateQuantity(itemId, 3);
    });

    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.totalItems).toBe(3);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    // First add an item
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      description: null,
      image_url: null,
      category: 'flower',
      thc_content: null,
      cbd_content: null,
      vendor_id: 'vendor1',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      variants: [],
      vendor: { name: 'Test Vendor', status: 'active' }
    };

    const mockVariant = {
      id: 'v1',
      name: '1g',
      price: 2000,
      weight_grams: 1,
      inventory_count: 10,
      is_active: true
    };

    act(() => {
      result.current.addItem(mockProduct, mockVariant, 1);
    });

    const itemId = result.current.items[0].id;

    act(() => {
      result.current.removeItem(itemId);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
  });

  it('should calculate totals correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      description: null,
      image_url: null,
      category: 'flower',
      thc_content: null,
      cbd_content: null,
      vendor_id: 'vendor1',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      variants: [],
      vendor: { name: 'Test Vendor', status: 'active' }
    };

    const mockVariant = {
      id: 'v1',
      name: '1g',
      price: 2000, // $20.00
      weight_grams: 1,
      inventory_count: 10,
      is_active: true
    };

    act(() => {
      result.current.addItem(mockProduct, mockVariant, 2);
    });

    expect(result.current.subtotal).toBe(40); // 2 * $20
    expect(result.current.taxAmount).toBe(4.1); // 10.25% tax
    expect(result.current.deliveryFee).toBe(5); // Default delivery fee
    expect(result.current.totalPrice).toBe(49.1); // 40 + 4.1 + 5
  });
});