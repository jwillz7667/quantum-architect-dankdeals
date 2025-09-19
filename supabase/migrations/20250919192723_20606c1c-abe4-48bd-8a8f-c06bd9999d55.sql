-- Complete database setup for product listings and image storage - Fixed Version

-- Ensure the products storage bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products', 
  'products', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create comprehensive RLS policies for product image storage
-- Policy 1: Anyone can view product images (public read)
CREATE POLICY "Public can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'products');

-- Policy 2: Admins can upload product images
CREATE POLICY "Admins can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'products' 
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR 
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
);

-- Policy 3: Admins can update product images
CREATE POLICY "Admins can update product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'products' 
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR 
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
);

-- Policy 4: Admins can delete product images  
CREATE POLICY "Admins can delete product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'products' 
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR 
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
);

-- Create indexes for better performance on product queries
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- Create index for product variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON public.product_variants(is_active);

-- Add unique constraint for product slug (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_product_slug' 
    AND table_name = 'products'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT unique_product_slug UNIQUE (slug);
  END IF;
END $$;

-- Create a function to generate product slugs automatically
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Only generate slug if it's NULL, empty, or name has changed
  IF NEW.slug IS NOT NULL AND NEW.slug != '' AND (TG_OP = 'INSERT' OR OLD.name = NEW.name) THEN
    RETURN NEW;
  END IF;
  
  -- Generate base slug from product name
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'product';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate slugs (drop existing first)
DROP TRIGGER IF EXISTS trigger_generate_product_slug ON public.products;
CREATE TRIGGER trigger_generate_product_slug
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_product_slug();

-- Add search vector column for full-text search (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'search_vector' 
    AND table_schema = 'public'
  ) THEN
    -- Add the search vector column
    ALTER TABLE public.products ADD COLUMN search_vector tsvector;
    
    -- Create GIN index for full-text search
    CREATE INDEX idx_products_search_vector ON public.products USING GIN(search_vector);
    
    -- Create function to update search vectors
    CREATE OR REPLACE FUNCTION public.update_product_search_vector()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(NEW.strain_type, '') || ' ' ||
        COALESCE(array_to_string(NEW.effects, ' '), '') || ' ' ||
        COALESCE(array_to_string(NEW.flavors, ' '), '')
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SET search_path = public;
    
    -- Create trigger to maintain search vector
    CREATE TRIGGER trigger_update_product_search_vector
      BEFORE INSERT OR UPDATE ON public.products
      FOR EACH ROW
      EXECUTE FUNCTION public.update_product_search_vector();
    
    -- Update existing products with search vectors
    UPDATE public.products SET search_vector = to_tsvector('english',
      COALESCE(name, '') || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE(category, '') || ' ' ||
      COALESCE(strain_type, '') || ' ' ||
      COALESCE(array_to_string(effects, ' '), '') || ' ' ||
      COALESCE(array_to_string(flavors, ' '), '')
    );
  END IF;
END $$;