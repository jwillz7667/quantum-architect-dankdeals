import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar', () => {
  const mockOnSearch = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input correctly', () => {
    render(
      <SearchBar
        value=""
        onChange={mockOnSearch}
        onClear={mockOnClear}
        placeholder="Search products..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Search products...');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    render(
      <SearchBar value="" onChange={mockOnSearch} onClear={mockOnClear} placeholder="Search..." />
    );

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(mockOnSearch).toHaveBeenCalledWith('test search');
  });

  it('displays current value correctly', () => {
    render(
      <SearchBar
        value="current value"
        onChange={mockOnSearch}
        onClear={mockOnClear}
        placeholder="Search..."
      />
    );

    const searchInput = screen.getByDisplayValue('current value');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    render(
      <SearchBar
        value="some text"
        onChange={mockOnSearch}
        onClear={mockOnClear}
        placeholder="Search..."
      />
    );

    // Look for clear button (usually an X icon)
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('shows clear button only when there is text', () => {
    const { rerender } = render(
      <SearchBar value="" onChange={mockOnSearch} onClear={mockOnClear} placeholder="Search..." />
    );

    // No clear button when empty
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    // Rerender with text
    rerender(
      <SearchBar
        value="search text"
        onChange={mockOnSearch}
        onClear={mockOnClear}
        placeholder="Search..."
      />
    );

    // Clear button should appear
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
