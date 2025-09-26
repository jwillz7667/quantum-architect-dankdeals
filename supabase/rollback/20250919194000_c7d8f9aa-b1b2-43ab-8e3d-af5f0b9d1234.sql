-- Rollback script for admin product management RLS and helper functions

-- Drop RPC functions
DROP FUNCTION IF EXISTS public.admin_delete_product(uuid, boolean);
DROP FUNCTION IF EXISTS public.admin_upsert_product(jsonb, jsonb, boolean);
DROP FUNCTION IF EXISTS public.ensure_admin_access();
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Drop policies associated with products and variants
DROP POLICY IF EXISTS "Admins can delete product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can view all product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public can view product variants for active products" ON public.product_variants;

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

-- Disable row level security to restore previous behaviour
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
