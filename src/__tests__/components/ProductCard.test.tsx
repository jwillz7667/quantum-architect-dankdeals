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
    minPrice: 25,
    maxPrice: 35,
    category: 'flower',
    imageUrl: '/test-image.jpg',
    thcContent: 20,
  };

  it('renders product information correctly', () => {
    render(<ProductCard {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$25-$35')).toBeInTheDocument();
  });

  it('displays price range correctly', () => {
    render(<ProductCard {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByText('$25-$35')).toBeInTheDocument();
  });

  it('handles missing optional props gracefully', () => {
    const minimalProps = {
      id: 'test-product-2',
      name: 'Minimal Product',
      minPrice: 30,
      maxPrice: 45,
      category: 'edibles',
    };

    render(<ProductCard {...minimalProps} />, { wrapper: TestWrapper });

    expect(screen.getByText('Minimal Product')).toBeInTheDocument();
    expect(screen.getByText('$30-$45')).toBeInTheDocument();
  });

  it('displays different price range correctly', () => {
    render(<ProductCard {...defaultProps} minPrice={35} maxPrice={50} />, { wrapper: TestWrapper });

    expect(screen.getByText('$35-$50')).toBeInTheDocument();
  });

  it('handles loading state appropriately', () => {
    render(<ProductCard {...defaultProps} />, { wrapper: TestWrapper });

    // Should render without crashing
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('displays category badge correctly', () => {
    const concentratesProps = {
      ...defaultProps,
      category: 'concentrates',
    };

    render(<ProductCard {...concentratesProps} />, { wrapper: TestWrapper });

    // Category only appears on hover, so we check the element exists
    const categoryElement = screen.getByText('concentrates');
    expect(categoryElement).toBeInTheDocument();
  });

  it('renders with product image container', () => {
    render(<ProductCard {...defaultProps} />, { wrapper: TestWrapper });

    // The image component uses lazy loading with intersection observer
    // so we check for the container instead
    const imageContainer = screen.getByText('Test Product').closest('article');
    expect(imageContainer).toBeInTheDocument();

    // Verify the product card structure is correct
    expect(imageContainer).toHaveAttribute('aria-label', 'View Test Product details');
  });

  it('shows price range in correct format', () => {
    const expensiveProps = {
      ...defaultProps,
      minPrice: 99.99,
      maxPrice: 149.99,
    };

    render(<ProductCard {...expensiveProps} />, { wrapper: TestWrapper });

    expect(screen.getByText('$100-$150')).toBeInTheDocument();
  });
});
