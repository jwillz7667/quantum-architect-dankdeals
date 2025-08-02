import { supabase } from '@/integrations/supabase/client';

/**
 * Get the public URL for a logo stored in Supabase Storage
 * @param fileName - The name of the logo file
 * @returns The public URL of the logo
 */
export const getLogoUrl = (fileName: string): string => {
  const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
  return data.publicUrl;
};

/**
 * Get the white logo URL
 * @returns The public URL of the white logo
 */
export const getWhiteLogoUrl = (): string => {
  return getLogoUrl('white-logo-trans.webp');
};

// Logo constants for easy access
export const LOGO_URLS = {
  WHITE_TRANS: 'white-logo-trans.webp',
} as const;
