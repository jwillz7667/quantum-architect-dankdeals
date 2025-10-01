-- EMERGENCY FIX: Disable RLS on products table to allow public access
-- Products should be publicly viewable without authentication

-- Disable RLS entirely on products table
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Disable RLS on product_variants
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;

-- Grant public SELECT access
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;

-- Add comment explaining why RLS is disabled
COMMENT ON TABLE public.products IS 'RLS disabled - products are publicly viewable. Guest checkout requires public access.';
COMMENT ON TABLE public.product_variants IS 'RLS disabled - variants are publicly viewable. Guest checkout requires public access.';
