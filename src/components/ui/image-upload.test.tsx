/**
 * ImageUpload Component Tests
 *
 * Test suite for the ImageUpload component functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUpload from './image-upload';

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn((file) => Promise.resolve(file)),
}));

describe('ImageUpload', () => {
  const mockOnChange = vi.fn();
  const _mockOnUploadComplete = vi.fn();
  const _mockOnUploadError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up any URLs created during tests
    URL.revokeObjectURL = vi.fn();
  });

  it('renders with default props', () => {
    render(<ImageUpload onChange={mockOnChange} />);

    expect(screen.getByText(/drag and drop images here/i)).toBeInTheDocument();
    expect(screen.getByText(/choose image/i)).toBeInTheDocument();
  });

  it('renders with custom label and helper text', () => {
    render(
      <ImageUpload
        onChange={mockOnChange}
        label="Product Image"
        helperText="Upload your product image"
      />
    );

    expect(screen.getByText('Product Image')).toBeInTheDocument();
    expect(screen.getByText('Upload your product image')).toBeInTheDocument();
  });

  it('handles file selection via input', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImageUpload onChange={mockOnChange} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(input.files?.[0]).toBe(file);
    });
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageUpload onChange={mockOnChange} maxFileSize={1} />
    );

    // Create a file larger than 1MB
    const largeFile = new File(
      [new ArrayBuffer(2 * 1024 * 1024)],
      'large.jpg',
      { type: 'image/jpeg' }
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/exceeds 1MB limit/i)).toBeInTheDocument();
    });
  });

  it('validates file format', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageUpload
        onChange={mockOnChange}
        acceptedFormats={['image/jpeg']}
      />
    );

    const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, invalidFile);

    await waitFor(() => {
      expect(screen.getByText(/unsupported format/i)).toBeInTheDocument();
    });
  });

  it('handles multiple files when multiple prop is true', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageUpload onChange={mockOnChange} multiple={true} />
    );

    const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [file1, file2]);

    await waitFor(() => {
      expect(input.files?.length).toBe(2);
    });
  });

  it('respects maxFiles limit', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageUpload onChange={mockOnChange} multiple={true} maxFiles={2} />
    );

    const files = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
    ];

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, files);

    await waitFor(() => {
      expect(screen.getByText(/maximum 2 images allowed/i)).toBeInTheDocument();
    });
  });

  it('handles drag and drop', async () => {
    const { container } = render(<ImageUpload onChange={mockOnChange} />);

    const dropZone = container.querySelector('[onDrop]') as HTMLElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', type: 'image/jpeg' }],
    };

    fireEvent.dragEnter(dropZone, { dataTransfer });
    expect(dropZone.className).toContain('border-primary');

    fireEvent.dragLeave(dropZone, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    await waitFor(() => {
      expect(dropZone.className).not.toContain('border-primary');
    });
  });

  it('shows preview when showPreview is true', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageUpload onChange={mockOnChange} showPreview={true} />
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:test-url'),
      writable: true,
    });

    await user.upload(input, file);

    await waitFor(() => {
      const preview = container.querySelector('img[alt="Preview"]');
      expect(preview).toBeInTheDocument();
    });
  });

  it('disables input when disabled prop is true', () => {
    const { container } = render(
      <ImageUpload onChange={mockOnChange} disabled={true} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);

    const dropZone = container.querySelector('[onClick]') as HTMLElement;
    expect(dropZone.className).toContain('opacity-50');
    expect(dropZone.className).toContain('cursor-not-allowed');
  });

  it('removes image when X button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageUpload onChange={mockOnChange} showPreview={true} />
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:test-url'),
      writable: true,
    });

    await user.upload(input, file);

    await waitFor(async () => {
      const removeButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      expect(removeButton).toBeInTheDocument();

      await user.click(removeButton);
    });

    await waitFor(() => {
      const preview = container.querySelector('img[alt="Preview"]');
      expect(preview).not.toBeInTheDocument();
    });
  });
});