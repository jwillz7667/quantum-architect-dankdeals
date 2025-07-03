-- Add some sample products for demonstration
-- First, get vendor IDs
DO $$
DECLARE
    vendor1_id uuid;
    vendor2_id uuid;
    vendor3_id uuid;
    product1_id uuid;
    product2_id uuid;
    product3_id uuid;
    product4_id uuid;
BEGIN
    -- Get existing vendor IDs or create them if they don't exist
    SELECT id INTO vendor1_id FROM vendors WHERE name = 'Green Valley Dispensary' LIMIT 1;
    SELECT id INTO vendor2_id FROM vendors WHERE name = 'Premium Cannabis Collective' LIMIT 1;
    SELECT id INTO vendor3_id FROM vendors WHERE name = 'Metro Cannabis Market' LIMIT 1;
    
    -- If no vendors exist, create them
    IF vendor1_id IS NULL THEN
        INSERT INTO vendors (name, email, license_number, slug, status) 
        VALUES ('Green Valley Dispensary', 'info@greenvalley.com', 'LIC-001', 'green-valley', 'active')
        RETURNING id INTO vendor1_id;
    END IF;
    
    IF vendor2_id IS NULL THEN
        INSERT INTO vendors (name, email, license_number, slug, status) 
        VALUES ('Premium Cannabis Collective', 'info@premiumcannabis.com', 'LIC-002', 'premium-cannabis', 'active')
        RETURNING id INTO vendor2_id;
    END IF;
    
    IF vendor3_id IS NULL THEN
        INSERT INTO vendors (name, email, license_number, slug, status) 
        VALUES ('Metro Cannabis Market', 'info@metrocannabis.com', 'LIC-003', 'metro-cannabis', 'active')
        RETURNING id INTO vendor3_id;
    END IF;

    -- Insert Blue Dream product
    INSERT INTO products (name, description, category, thc_content, cbd_content, vendor_id, slug, is_active)
    VALUES (
        'Blue Dream',
        'Blue Dream is one of the most popular strains you can share with friends. This sativa-dominant hybrid offers a balanced experience with sweet berry aromas.',
        'flower',
        18.5,
        0.5,
        vendor1_id,
        'blue-dream',
        true
    ) RETURNING id INTO product1_id;

    -- Insert variants for Blue Dream
    INSERT INTO product_variants (product_id, name, price, weight_grams, inventory_count, is_active)
    VALUES 
        (product1_id, '1g', 1500, 1.0, 25, true),
        (product1_id, '3.5g (1/8 oz)', 4500, 3.5, 15, true),
        (product1_id, '7g (1/4 oz)', 8500, 7.0, 8, true);

    -- Insert OG Kush product
    INSERT INTO products (name, description, category, thc_content, cbd_content, vendor_id, slug, is_active)
    VALUES (
        'OG Kush',
        'A legendary strain with a unique terpene profile that boasts a complex aroma with notes of fuel, skunk, and spice.',
        'flower',
        22.0,
        0.3,
        vendor2_id,
        'og-kush',
        true
    ) RETURNING id INTO product2_id;

    -- Insert variants for OG Kush
    INSERT INTO product_variants (product_id, name, price, weight_grams, inventory_count, is_active)
    VALUES 
        (product2_id, '1g', 1800, 1.0, 20, true),
        (product2_id, '3.5g (1/8 oz)', 5500, 3.5, 12, true),
        (product2_id, '7g (1/4 oz)', 10500, 7.0, 6, true);

    -- Insert Berry Gummies product
    INSERT INTO products (name, description, category, thc_content, cbd_content, vendor_id, slug, is_active)
    VALUES (
        'Berry Gummies',
        'Delicious mixed berry gummies infused with premium cannabis extract. Perfect for precise dosing and great taste.',
        'edibles',
        10.0,
        0.0,
        vendor3_id,
        'berry-gummies',
        true
    ) RETURNING id INTO product3_id;

    -- Insert variants for Berry Gummies
    INSERT INTO product_variants (product_id, name, price, weight_grams, inventory_count, is_active)
    VALUES 
        (product3_id, '5mg (10-pack)', 2500, 50.0, 30, true),
        (product3_id, '10mg (10-pack)', 4500, 50.0, 25, true);

    -- Insert Pre-Roll Joints product
    INSERT INTO products (name, description, category, thc_content, cbd_content, vendor_id, slug, is_active)
    VALUES (
        'Pre-Roll Joints',
        'Premium pre-rolled joints made with top-shelf flower. Perfectly rolled and ready to enjoy.',
        'prerolls',
        20.0,
        0.5,
        vendor1_id,
        'pre-roll-joints',
        true
    ) RETURNING id INTO product4_id;

    -- Insert variants for Pre-Roll Joints
    INSERT INTO product_variants (product_id, name, price, weight_grams, inventory_count, is_active)
    VALUES 
        (product4_id, 'Single Joint (1g)', 1200, 1.0, 50, true),
        (product4_id, '3-Pack', 3200, 3.0, 20, true),
        (product4_id, '5-Pack', 5000, 5.0, 15, true);

END $$;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents',
  'id-documents',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create policy for users to upload their own ID documents
CREATE POLICY "Users can upload their own ID documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Create policy for users to view their own ID documents
CREATE POLICY "Users can view their own ID documents" ON storage.objects
FOR SELECT USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Create policy for admins to view all ID documents (for manual review)
CREATE POLICY "Admins can view all ID documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'id-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (profiles.id_verification_data->>'role' = 'admin' OR profiles.id_verification_data->>'role' = 'reviewer')
  )
);

-- Update profiles table to include admin roles in verification data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'not_submitted' CHECK (verification_status IN ('not_submitted', 'pending_review', 'approved', 'rejected'));

-- Add index for efficient querying of verification status
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);

-- Add index for efficient querying of ID verification data
CREATE INDEX IF NOT EXISTS idx_profiles_id_verification_data ON public.profiles USING GIN (id_verification_data);

-- Update the existing RLS policies for profiles table to ensure security
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for admins to view all profiles for verification purposes
CREATE POLICY "Admins can view profiles for verification" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.user_id = auth.uid() 
    AND (admin_profile.id_verification_data->>'role' = 'admin' OR admin_profile.id_verification_data->>'role' = 'reviewer')
  )
);

-- Create policy for admins to update verification status
CREATE POLICY "Admins can update verification status" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.user_id = auth.uid() 
    AND (admin_profile.id_verification_data->>'role' = 'admin' OR admin_profile.id_verification_data->>'role' = 'reviewer')
  )
);

-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;