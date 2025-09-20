-- Product slug and search functionality - Fixed

-- Add unique constraint for product slug using DO block
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate slugs
DROP TRIGGER IF EXISTS trigger_generate_product_slug ON public.products;
CREATE TRIGGER trigger_generate_product_slug
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_product_slug();

-- Add search vector column for full-text search
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'search_vector' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.products ADD COLUMN search_vector tsvector;
  END IF;
END $$;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to maintain search vector
DROP TRIGGER IF EXISTS trigger_update_product_search_vector ON public.products;
CREATE TRIGGER trigger_update_product_search_vector
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_search_vector();

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON public.products USING GIN(search_vector);

-- Update existing products with search vectors
UPDATE public.products SET search_vector = to_tsvector('english',
  COALESCE(name, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(category, '') || ' ' ||
  COALESCE(strain_type, '') || ' ' ||
  COALESCE(array_to_string(effects, ' '), '') || ' ' ||
  COALESCE(array_to_string(flavors, ' '), '')
);