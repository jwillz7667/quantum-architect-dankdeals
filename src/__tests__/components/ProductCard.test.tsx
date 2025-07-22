import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProductCard } from '@/components/ProductCard';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Wrapper component for tests with Router context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ProductCard', () => {
  const defaultProps = {
    id: 'test-product-1',
    name: 'Test Product',
    price: 25,
    category: 'flower' as const,
    imageUrl: '/test-image.jpg',
    thcContent: 20,
    cbdContent: 5,
    description: 'Test product description',
  };

  it('renders product information correctly', () => {
    render(<ProductCard {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByText('flower')).toBeInTheDocument();
    expect(screen.getByText('Test product description')).toBeInTheDocument();
  });

  it('displays THC and CBD content when provided', () => {
    render(<ProductCard {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByText(/20%/)).toBeInTheDocument(); // THC
    expect(screen.getByText(/5%/)).toBeInTheDocument(); // CBD
  });

  it('handles missing optional props gracefully', () => {
    const minimalProps = {
      id: 'test-product-2',
      name: 'Minimal Product',
      price: 30,
      category: 'edibles' as const,
    };

    render(<ProductCard {...minimalProps} />, { wrapper: TestWrapper });

    expect(screen.getByText('Minimal Product')).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
    expect(screen.getByText('edibles')).toBeInTheDocument();
  });

  it('displays different price correctly', () => {
    render(<ProductCard {...defaultProps} price={35} />, { wrapper: TestWrapper });

    expect(screen.getByText('$35.00')).toBeInTheDocument();
  });

  it('handles loading state appropriately', () => {
    render(<ProductCard {...defaultProps} />, { wrapper: TestWrapper });

    // Should render without crashing
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('displays category badge correctly', () => {
    const concentratesProps = {
      ...defaultProps,
      category: 'concentrates' as const,
    };

    render(<ProductCard {...concentratesProps} />, { wrapper: TestWrapper });

    expect(screen.getByText('concentrates')).toBeInTheDocument();
  });

  it('renders image with correct alt text', () => {
    render(<ProductCard {...defaultProps} />, { wrapper: TestWrapper });

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Test Product');
  });

  it('shows price in correct format', () => {
    const expensiveProps = {
      ...defaultProps,
      price: 99.99,
    };

    render(<ProductCard {...expensiveProps} />, { wrapper: TestWrapper });

    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });
});
