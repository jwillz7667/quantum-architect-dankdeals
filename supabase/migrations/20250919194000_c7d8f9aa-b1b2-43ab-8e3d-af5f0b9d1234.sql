-- Admin product management RLS policies and helper functions

-- Enable row level security on product tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Helper function to determine if the current session belongs to an admin or service role
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims text;
BEGIN
  claims := current_setting('request.jwt.claims', true);

  RETURN (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.is_admin = true OR p.role = 'admin')
    )
  )
  OR (
    claims IS NOT NULL
    AND (claims::json->>'role') = 'service_role'
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin_user IS 'Returns true when the current Supabase session belongs to an administrator or service role.';

-- Ensure policies are recreated idempotently
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

DROP POLICY IF EXISTS "Public can view product variants for active products" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can view all product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can delete product variants" ON public.product_variants;

-- Public read access limited to active catalog data
CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
USING (is_active IS TRUE);

CREATE POLICY "Public can view product variants for active products"
ON public.product_variants
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = product_variants.product_id
      AND p.is_active IS TRUE
  )
);

-- Administrator access for full catalog management
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (public.is_admin_user());

CREATE POLICY "Admins can view all product variants"
ON public.product_variants
FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "Admins can insert product variants"
ON public.product_variants
FOR INSERT
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update product variants"
ON public.product_variants
FOR UPDATE
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can delete product variants"
ON public.product_variants
FOR DELETE
USING (public.is_admin_user());

-- Helper function to ensure admin permissions before mutating data
CREATE OR REPLACE FUNCTION public.ensure_admin_access()
RETURNS void
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Administrative privileges required.' USING ERRCODE = '42501';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.ensure_admin_access IS 'Raises an exception when the current session lacks administrator privileges.';

-- RPC: Upsert a product and synchronise its variants in a single transaction
CREATE OR REPLACE FUNCTION public.admin_upsert_product(
  product_data jsonb,
  variant_data jsonb DEFAULT '[]'::jsonb,
  replace_variants boolean DEFAULT false
)
RETURNS public.products
LANGUAGE plpgsql
AS $$
DECLARE
  target_product_id uuid;
  upserted_product public.products%ROWTYPE;
  variant_record jsonb;
  variant_id uuid;
  tracked_variant_ids uuid[] := ARRAY[]::uuid[];
  current_time timestamptz := now();
BEGIN
  PERFORM public.ensure_admin_access();

  IF product_data IS NULL OR jsonb_typeof(product_data) <> 'object' THEN
    RAISE EXCEPTION 'product_data must be a JSON object.' USING ERRCODE = '22023';
  END IF;

  target_product_id := COALESCE((product_data->>'id')::uuid, gen_random_uuid());
  product_data := product_data || jsonb_build_object('id', target_product_id::text);

  IF NOT product_data ? 'created_at' THEN
    product_data := jsonb_set(product_data, '{created_at}', to_jsonb(current_time));
  END IF;
  product_data := jsonb_set(product_data, '{updated_at}', to_jsonb(current_time));

  WITH input_record AS (
    SELECT *
    FROM jsonb_to_record(product_data) AS r(
      id uuid,
      name text,
      description text,
      category text,
      price numeric,
      image_url text,
      thc_content numeric,
      cbd_content numeric,
      strain_type text,
      effects text[],
      flavors text[],
      gallery_urls text[],
      lab_results_url text,
      lab_tested boolean,
      is_active boolean,
      is_featured boolean,
      stock_quantity integer,
      weight_grams numeric,
      search_vector tsvector,
      slug text,
      created_at timestamptz,
      updated_at timestamptz
    )
  )
  INSERT INTO public.products AS p (
    id,
    name,
    description,
    category,
    price,
    image_url,
    thc_content,
    cbd_content,
    strain_type,
    effects,
    flavors,
    gallery_urls,
    lab_results_url,
    lab_tested,
    is_active,
    is_featured,
    stock_quantity,
    weight_grams,
    slug,
    created_at,
    updated_at
  )
  SELECT
    id,
    name,
    description,
    category,
    price,
    image_url,
    thc_content,
    cbd_content,
    strain_type,
    effects,
    flavors,
    gallery_urls,
    lab_results_url,
    lab_tested,
    is_active,
    is_featured,
    stock_quantity,
    weight_grams,
    slug,
    created_at,
    updated_at
  FROM input_record
  ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      price = EXCLUDED.price,
      image_url = EXCLUDED.image_url,
      thc_content = EXCLUDED.thc_content,
      cbd_content = EXCLUDED.cbd_content,
      strain_type = EXCLUDED.strain_type,
      effects = EXCLUDED.effects,
      flavors = EXCLUDED.flavors,
      gallery_urls = EXCLUDED.gallery_urls,
      lab_results_url = EXCLUDED.lab_results_url,
      lab_tested = EXCLUDED.lab_tested,
      is_active = EXCLUDED.is_active,
      is_featured = EXCLUDED.is_featured,
      stock_quantity = EXCLUDED.stock_quantity,
      weight_grams = EXCLUDED.weight_grams,
      slug = COALESCE(EXCLUDED.slug, public.products.slug),
      updated_at = current_time
  RETURNING * INTO upserted_product;

  IF variant_data IS NULL THEN
    variant_data := '[]'::jsonb;
  END IF;

  IF jsonb_typeof(variant_data) <> 'array' THEN
    RAISE EXCEPTION 'variant_data must be a JSON array.' USING ERRCODE = '22023';
  END IF;

  FOR variant_record IN
    SELECT value
    FROM jsonb_array_elements(variant_data)
  LOOP
    IF jsonb_typeof(variant_record) <> 'object' THEN
      RAISE EXCEPTION 'Each entry in variant_data must be a JSON object.' USING ERRCODE = '22023';
    END IF;

    variant_id := COALESCE((variant_record->>'id')::uuid, gen_random_uuid());
    variant_record := variant_record || jsonb_build_object('id', variant_id::text);
    variant_record := variant_record || jsonb_build_object('product_id', target_product_id::text);

    IF NOT variant_record ? 'created_at' THEN
      variant_record := jsonb_set(variant_record, '{created_at}', to_jsonb(current_time));
    END IF;
    variant_record := jsonb_set(variant_record, '{updated_at}', to_jsonb(current_time));

    WITH variant_input AS (
      SELECT *
      FROM jsonb_to_record(variant_record) AS v(
        id uuid,
        product_id uuid,
        name text,
        price numeric,
        weight_grams numeric,
        inventory_count integer,
        is_active boolean,
        created_at timestamptz,
        updated_at timestamptz
      )
    )
    INSERT INTO public.product_variants AS pv (
      id,
      product_id,
      name,
      price,
      weight_grams,
      inventory_count,
      is_active,
      created_at,
      updated_at
    )
    SELECT
      id,
      product_id,
      name,
      price,
      weight_grams,
      inventory_count,
      is_active,
      created_at,
      updated_at
    FROM variant_input
    ON CONFLICT (id) DO UPDATE
      SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        weight_grams = EXCLUDED.weight_grams,
        inventory_count = EXCLUDED.inventory_count,
        is_active = EXCLUDED.is_active,
        updated_at = current_time;

    tracked_variant_ids := array_append(tracked_variant_ids, variant_id);
  END LOOP;

  IF replace_variants THEN
    IF array_length(tracked_variant_ids, 1) IS NULL THEN
      DELETE FROM public.product_variants
      WHERE product_id = target_product_id;
    ELSE
      DELETE FROM public.product_variants
      WHERE product_id = target_product_id
        AND NOT (id = ANY(tracked_variant_ids));
    END IF;
  END IF;

  RETURN upserted_product;
END;
$$;

COMMENT ON FUNCTION public.admin_upsert_product(jsonb, jsonb, boolean) IS 'Creates or updates a product along with its variants. Requires administrator permissions.';

-- RPC: Soft delete or hard delete a product
CREATE OR REPLACE FUNCTION public.admin_delete_product(
  target_product_id uuid,
  hard_delete boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.ensure_admin_access();

  IF hard_delete THEN
    DELETE FROM public.product_variants WHERE product_id = target_product_id;
    DELETE FROM public.products WHERE id = target_product_id;
  ELSE
    UPDATE public.products
    SET is_active = false,
        updated_at = now()
    WHERE id = target_product_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.admin_delete_product(uuid, boolean) IS 'Soft deletes a product by default or performs a hard delete when explicitly requested.';
