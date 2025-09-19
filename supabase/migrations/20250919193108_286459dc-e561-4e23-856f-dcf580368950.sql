-- Product search helper function

-- Create a function to search products with full-text search
CREATE OR REPLACE FUNCTION public.search_products(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  category TEXT,
  price NUMERIC,
  image_url TEXT,
  is_featured BOOLEAN,
  is_active BOOLEAN,
  thc_content NUMERIC,
  cbd_content NUMERIC,
  strain_type TEXT,
  effects TEXT[],
  flavors TEXT[],
  stock_quantity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  search_rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.category,
    p.price,
    p.image_url,
    p.is_featured,
    p.is_active,
    p.thc_content,
    p.cbd_content,
    p.strain_type,
    p.effects,
    p.flavors,
    p.stock_quantity,
    p.created_at,
    ts_rank(p.search_vector, to_tsquery('english', search_query)) as search_rank
  FROM public.products p
  WHERE 
    p.is_active = true
    AND (
      search_query IS NULL 
      OR search_query = '' 
      OR p.search_vector @@ to_tsquery('english', search_query)
    )
    AND (
      category_filter IS NULL 
      OR category_filter = '' 
      OR p.category ILIKE category_filter
    )
  ORDER BY 
    CASE 
      WHEN search_query IS NOT NULL AND search_query != '' 
      THEN ts_rank(p.search_vector, to_tsquery('english', search_query)) 
      ELSE 0 
    END DESC,
    p.is_featured DESC,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;