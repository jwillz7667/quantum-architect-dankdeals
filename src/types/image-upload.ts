/**
 * Image Upload Types
 *
 * Type definitions for image upload functionality including
 * file validation, upload responses, and component props.
 */

export interface ImageFile {
  file: File;
  preview: string;
  id: string;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadedUrl?: string;
  error?: string;
}

export interface ImageUploadConfig {
  maxFileSize?: number; // in bytes, default 5MB
  maxFiles?: number;
  acceptedFormats?: string[];
  compressionOptions?: ImageCompressionOptions;
}

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  initialQuality?: number;
  alwaysKeepResolution?: boolean;
  fileType?: string;
}

export interface UploadResponse {
  url: string;
  path: string;
  error?: never;
}

export interface UploadError {
  url?: never;
  path?: never;
  error: string;
}

export type UploadResult = UploadResponse | UploadError;

export interface StorageUploadOptions {
  bucket: string;
  path: string;
  file: File | Blob;
  upsert?: boolean;
  contentType?: string;
}

export interface StorageDeleteOptions {
  bucket: string;
  paths: string[];
}

export interface ImageUploadProps {
  value?: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  onUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  showPreview?: boolean;
  compressionOptions?: ImageCompressionOptions;
  bucketName?: string;
  pathPrefix?: string;
  productId?: string;
}

export interface ProductImageUploadProps extends Omit<ImageUploadProps, 'bucketName' | 'pathPrefix'> {
  productId?: string;
  variant?: 'main' | 'gallery';
}

export interface DragState {
  isDragging: boolean;
  dragCounter: number;
}

export interface ImageValidationError {
  type: 'size' | 'format' | 'count';
  message: string;
  file?: File;
}

// Default configuration values
export const DEFAULT_IMAGE_CONFIG: Required<ImageUploadConfig> = {
  maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
  maxFiles: 10,
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  compressionOptions: {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
    alwaysKeepResolution: false,
    fileType: 'image/webp',
  },
};

export const IMAGE_MIME_TYPES = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

export const ACCEPTED_IMAGE_TYPES = Object.values(IMAGE_MIME_TYPES);