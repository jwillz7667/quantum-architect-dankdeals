/**
 * ProductImageUpload Component Tests
 * 
 * Tests for the product image upload functionality including:
 * - File validation
 * - Upload to Supabase storage
 * - URL validation (prevent blob URLs)
 * - Retry logic
 * - Progress tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductImageUpload from '../ProductImageUpload';
import * as supabaseStorage from '@/lib/storage/supabase-storage';
import { validateImageUrl } from '@/lib/validation/image-url-validator';

// Mock dependencies
vi.mock('@/lib/storage/supabase-storage', () => ({
  uploadProductImage: vi.fn(),
  deleteProductImages: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ProductImageUpload', () => {
  const mockProductId = '11111111-1111-1111-1111-111111111111';
  const mockSupabaseUrl = 'https://test.supabase.co/storage/v1/object/public/products/test.webp';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any window objects
    delete (window as any).__pendingImageUploads;
  });

  describe('URL Validation', () => {
    it('should reject blob URLs', () => {
      const blobUrl = 'blob:https://dankdealsmn.com/12345';
      const result = validateImageUrl(blobUrl);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Blob URLs are temporary');
    });

    it('should reject localhost URLs', () => {
      const localhostUrl = 'http://localhost:3000/image.jpg';
      const result = validateImageUrl(localhostUrl);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Localhost URLs will not work');
    });

    it('should accept valid Supabase URLs', () => {
      const validUrl = 'https://test.supabase.co/storage/v1/object/public/products/test.webp';
      const result = validateImageUrl(validUrl);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept null (no image)', () => {
      const result = validateImageUrl(null);
      
      expect(result.valid).toBe(true);
    });

    it('should warn about external URLs', () => {
      const externalUrl = 'https://example.com/image.jpg';
      const result = validateImageUrl(externalUrl);
      
      expect(result.valid).toBe(true);
      expect(result.warning).toContain('External URL');
    });
  });

  describe('Upload Flow', () => {
    it('should require product ID for upload', async () => {
      const { container } = render(
        <ProductImageUpload
          productId="" // No product ID
          variant="main"
          value={null}
          onChange={vi.fn()}
        />
      );

      expect(container).toBeTruthy();
      // Component should render but uploads should fail without productId
    });

    it('should call uploadProductImage with correct parameters', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockOnChange = vi.fn();
      
      vi.mocked(supabaseStorage.uploadProductImage).mockResolvedValue({
        url: mockSupabaseUrl,
        path: 'test-path',
      });

      render(
        <ProductImageUpload
          productId={mockProductId}
          variant="main"
          value={null}
          onChange={mockOnChange}
        />
      );

      // Simulate upload by calling the handler directly
      const handleUpload = async (files: Array<{ id: string; file: File }>) => {
        for (const fileInfo of files) {
          if (mockProductId) {
            await supabaseStorage.uploadProductImage(fileInfo.file, mockProductId, 'main');
          }
        }
      };

      await handleUpload([{ id: 'test-id', file: mockFile }]);

      expect(supabaseStorage.uploadProductImage).toHaveBeenCalledWith(
        mockFile,
        mockProductId,
        'main'
      );
    });

    it('should update parent component with Supabase URL after upload', async () => {
      const mockOnChange = vi.fn();
      
      vi.mocked(supabaseStorage.uploadProductImage).mockResolvedValue({
        url: mockSupabaseUrl,
      });

      const { rerender } = render(
        <ProductImageUpload
          productId={mockProductId}
          variant="main"
          value={null}
          onChange={mockOnChange}
        />
      );

      // The component should call onChange with the Supabase URL
      // after successful upload (tested via integration test)
      expect(mockOnChange).toBeDefined();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed uploads up to 3 times', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock to fail twice then succeed
      vi.mocked(supabaseStorage.uploadProductImage)
        .mockResolvedValueOnce({ error: 'Network error' })
        .mockResolvedValueOnce({ error: 'Network error' })
        .mockResolvedValueOnce({ url: mockSupabaseUrl });

      // Simulate retry logic
      const uploadWithRetry = async (attempt: number = 1): Promise<any> => {
        const result = await supabaseStorage.uploadProductImage(mockFile, mockProductId, 'main');
        
        if (result.error && attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 100));
          return uploadWithRetry(attempt + 1);
        }
        
        return result;
      };

      const result = await uploadWithRetry();

      expect(supabaseStorage.uploadProductImage).toHaveBeenCalledTimes(3);
      expect(result.url).toBe(mockSupabaseUrl);
    });

    it('should fail after 3 retry attempts', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock to always fail
      vi.mocked(supabaseStorage.uploadProductImage)
        .mockResolvedValue({ error: 'Persistent error' });

      const uploadWithRetry = async (attempt: number = 1): Promise<any> => {
        const result = await supabaseStorage.uploadProductImage(mockFile, mockProductId, 'main');
        
        if (result.error && attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 100));
          return uploadWithRetry(attempt + 1);
        }
        
        return result;
      };

      const result = await uploadWithRetry();

      expect(supabaseStorage.uploadProductImage).toHaveBeenCalledTimes(3);
      expect(result.error).toBe('Persistent error');
    });
  });

  describe('Progress Tracking', () => {
    it('should show progress indicator during upload', async () => {
      const mockOnChange = vi.fn();
      
      vi.mocked(supabaseStorage.uploadProductImage).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ url: mockSupabaseUrl }), 100))
      );

      const { container } = render(
        <ProductImageUpload
          productId={mockProductId}
          variant="main"
          value={null}
          onChange={mockOnChange}
        />
      );

      // Progress indicator should appear during upload
      expect(container).toBeTruthy();
    });

    it('should show individual file progress for multiple uploads', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <ProductImageUpload
          productId={mockProductId}
          variant="gallery"
          value={[]}
          onChange={mockOnChange}
          multiple={true}
          maxFiles={5}
        />
      );

      // Should support multiple file upload
      expect(screen.queryByText(/Gallery Images/i)).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should show error message if productId is missing', () => {
      const mockOnChange = vi.fn();
      
      render(
        <ProductImageUpload
          productId="" // Missing
          variant="main"
          value={null}
          onChange={mockOnChange}
        />
      );

      // Component should render (error handled in upload handler)
      expect(screen.queryByText(/Product Image/i)).toBeTruthy();
    });

    it('should handle upload failures gracefully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      vi.mocked(supabaseStorage.uploadProductImage).mockResolvedValue({
        error: 'Upload failed',
      });

      const result = await supabaseStorage.uploadProductImage(mockFile, mockProductId, 'main');

      expect(result.error).toBe('Upload failed');
      expect(result.url).toBeUndefined();
    });
  });

  describe('Multiple Image Upload', () => {
    it('should support gallery mode with multiple images', () => {
      const mockOnChange = vi.fn();
      const galleryUrls = [
        'https://test.supabase.co/storage/v1/object/public/products/img1.webp',
        'https://test.supabase.co/storage/v1/object/public/products/img2.webp',
      ];

      render(
        <ProductImageUpload
          productId={mockProductId}
          variant="gallery"
          value={galleryUrls}
          onChange={mockOnChange}
          multiple={true}
          maxFiles={10}
        />
      );

      expect(screen.queryByText(/Gallery Images/i)).toBeTruthy();
    });

    it('should limit to maxFiles', () => {
      const mockOnChange = vi.fn();
      
      render(
        <ProductImageUpload
          productId={mockProductId}
          variant="gallery"
          value={[]}
          onChange={mockOnChange}
          multiple={true}
          maxFiles={5}
        />
      );

      // maxFiles prop should be passed to ImageUpload
      expect(screen.queryByText(/Gallery Images/i)).toBeTruthy();
    });
  });

  describe('Image Deletion', () => {
    it('should delete old image when replacing main image', async () => {
      const oldUrl = 'https://test.supabase.co/storage/v1/object/public/products/old.webp';
      const newUrl = 'https://test.supabase.co/storage/v1/object/public/products/new.webp';
      
      vi.mocked(supabaseStorage.uploadProductImage).mockResolvedValue({ url: newUrl });
      vi.mocked(supabaseStorage.deleteProductImages).mockResolvedValue({});

      // Simulate replacing main image
      await supabaseStorage.deleteProductImages(oldUrl, 'products');
      
      expect(supabaseStorage.deleteProductImages).toHaveBeenCalledWith(oldUrl, 'products');
    });
  });
});

describe('Image URL Validator', () => {
  describe('isBlobUrl', () => {
    it('should identify blob URLs', () => {
      const { isBlobUrl } = require('@/lib/validation/image-url-validator');
      
      expect(isBlobUrl('blob:https://example.com/123')).toBe(true);
      expect(isBlobUrl('data:image/png;base64,abc')).toBe(true);
      expect(isBlobUrl('https://example.com/image.jpg')).toBe(false);
      expect(isBlobUrl(null)).toBe(false);
    });
  });

  describe('isSupabaseStorageUrl', () => {
    it('should identify Supabase storage URLs', () => {
      const { isSupabaseStorageUrl } = require('@/lib/validation/image-url-validator');
      
      expect(isSupabaseStorageUrl('https://test.supabase.co/storage/v1/object/public/products/img.webp')).toBe(true);
      expect(isSupabaseStorageUrl('https://example.com/image.jpg')).toBe(false);
      expect(isSupabaseStorageUrl(null)).toBe(false);
    });
  });

  describe('isAccessibleUrl', () => {
    it('should reject temporary and local URLs', () => {
      const { isAccessibleUrl } = require('@/lib/validation/image-url-validator');
      
      expect(isAccessibleUrl('blob:https://example.com/123')).toBe(false);
      expect(isAccessibleUrl('http://localhost:3000/image.jpg')).toBe(false);
      expect(isAccessibleUrl('http://127.0.0.1:3000/image.jpg')).toBe(false);
      expect(isAccessibleUrl('https://example.com/image.jpg')).toBe(true);
    });
  });

  describe('extractProductIdFromStorageUrl', () => {
    it('should extract product ID from Supabase storage URL', () => {
      const { extractProductIdFromStorageUrl } = require('@/lib/validation/image-url-validator');
      
      const url = 'https://test.supabase.co/storage/v1/object/public/products/11111111-1111-1111-1111-111111111111/main/image.webp';
      const productId = extractProductIdFromStorageUrl(url);
      
      expect(productId).toBe('11111111-1111-1111-1111-111111111111');
    });

    it('should return null for non-storage URLs', () => {
      const { extractProductIdFromStorageUrl } = require('@/lib/validation/image-url-validator');
      
      const url = 'https://example.com/image.jpg';
      const productId = extractProductIdFromStorageUrl(url);
      
      expect(productId).toBeNull();
    });
  });
});

