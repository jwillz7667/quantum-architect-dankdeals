-- Fix UUID type casting in admin_upsert_product function
-- Error: operator does not exist: text = uuid
-- Issue: Converting UUIDs to text when building JSONB, then trying to extract as UUID
-- Fix: Store UUIDs directly in JSONB without text casting

DROP FUNCTION IF EXISTS public.admin_upsert_product(jsonb, jsonb, boolean) CASCADE;

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
BEGIN
  PERFORM public.ensure_admin_access();

  IF product_data IS NULL OR jsonb_typeof(product_data) <> 'object' THEN
    RAISE EXCEPTION 'product_data must be a JSON object.' USING ERRCODE = '22023';
  END IF;

  target_product_id := COALESCE((product_data->>'id')::uuid, gen_random_uuid());
  -- FIXED: Don't cast UUID to text when storing in JSONB
  product_data := product_data || jsonb_build_object('id', target_product_id);

  IF NOT product_data ? 'created_at' THEN
    product_data := jsonb_set(product_data, '{created_at}', to_jsonb(now()));
  END IF;
  product_data := jsonb_set(product_data, '{updated_at}', to_jsonb(now()));

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
  INSERT INTO public.products (
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
      slug = COALESCE(EXCLUDED.slug, products.slug),
      updated_at = now()
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
    -- FIXED: Don't cast UUIDs to text when storing in JSONB
    variant_record := variant_record || jsonb_build_object('id', variant_id);
    variant_record := variant_record || jsonb_build_object('product_id', target_product_id);

    IF NOT variant_record ? 'created_at' THEN
      variant_record := jsonb_set(variant_record, '{created_at}', to_jsonb(now()));
    END IF;
    variant_record := jsonb_set(variant_record, '{updated_at}', to_jsonb(now()));

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
    INSERT INTO public.product_variants (
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
        updated_at = now();

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_upsert_product(jsonb, jsonb, boolean)
TO authenticated, service_role;

-- Update comment
COMMENT ON FUNCTION public.admin_upsert_product(jsonb, jsonb, boolean) IS
'Creates or updates a product along with its variants. Requires administrator permissions. Uses proper UUID types throughout JSONB handling.';
