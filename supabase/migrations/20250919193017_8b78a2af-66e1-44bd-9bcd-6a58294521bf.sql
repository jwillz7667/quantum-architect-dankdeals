-- Product slug and search functionality

-- Add unique constraint for product slug (if not exists)
ALTER TABLE public.products ADD CONSTRAINT IF NOT EXISTS unique_product_slug UNIQUE (slug);

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