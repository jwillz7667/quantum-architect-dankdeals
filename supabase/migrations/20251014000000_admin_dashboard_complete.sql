-- ============================================================================
-- COMPREHENSIVE ADMIN DASHBOARD DATABASE MIGRATION
-- ============================================================================
-- This migration provides complete database support for the DankDeals admin
-- dashboard, including metrics, order management, user management, analytics,
-- inventory management, and audit logging.
--
-- Migration follows enterprise patterns:
-- - CQRS-style separation (commands vs queries)
-- - Row-level security with admin role checks
-- - Audit logging for all admin actions
-- - Type-safe JSONB for complex return types
-- - Idempotent function creation
-- ============================================================================

-- ============================================================================
-- SECTION 1: DASHBOARD METRICS & STATISTICS
-- ============================================================================

-- Get comprehensive dashboard metrics
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  metrics jsonb;
  active_products_count int;
  low_inventory_count int;
  pending_orders_count int;
  today_orders_count int;
  today_revenue numeric;
  total_users_count int;
  verified_users_count int;
BEGIN
  -- Ensure admin access
  PERFORM public.ensure_admin_access();

  -- Count active products
  SELECT COUNT(*) INTO active_products_count
  FROM public.products
  WHERE is_active = true;

  -- Count products with low inventory (variants with inventory_count < 10 or null)
  SELECT COUNT(DISTINCT p.id) INTO low_inventory_count
  FROM public.products p
  INNER JOIN public.product_variants pv ON pv.product_id = p.id
  WHERE p.is_active = true
    AND (pv.inventory_count IS NULL OR pv.inventory_count < 10);

  -- Count pending orders (pending, confirmed, processing)
  SELECT COUNT(*) INTO pending_orders_count
  FROM public.orders
  WHERE status IN ('pending', 'confirmed', 'processing');

  -- Count today's orders
  SELECT COUNT(*) INTO today_orders_count
  FROM public.orders
  WHERE created_at >= CURRENT_DATE;

  -- Calculate today's revenue
  SELECT COALESCE(SUM(total_amount), 0) INTO today_revenue
  FROM public.orders
  WHERE created_at >= CURRENT_DATE
    AND payment_status = 'paid';

  -- Count total users
  SELECT COUNT(*) INTO total_users_count
  FROM public.profiles;

  -- Count age-verified users
  SELECT COUNT(*) INTO verified_users_count
  FROM public.profiles
  WHERE age_verified = true;

  -- Build metrics JSON
  metrics := jsonb_build_object(
    'active_products', active_products_count,
    'low_inventory_products', low_inventory_count,
    'pending_orders', pending_orders_count,
    'today_orders', today_orders_count,
    'today_revenue', today_revenue,
    'total_users', total_users_count,
    'verified_users', verified_users_count,
    'storefront_status', 'healthy',
    'generated_at', now()
  );

  RETURN metrics;
END;
$$;

COMMENT ON FUNCTION public.admin_get_dashboard_metrics IS 'Returns comprehensive dashboard metrics for the admin panel';

-- Get low inventory products
CREATE OR REPLACE FUNCTION public.admin_get_low_inventory_products(
  threshold int DEFAULT 10
)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  variant_id text,
  variant_name text,
  inventory_count int,
  is_active boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.ensure_admin_access();

  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    pv.id AS variant_id,
    pv.name AS variant_name,
    pv.inventory_count,
    pv.is_active
  FROM public.products p
  INNER JOIN public.product_variants pv ON pv.product_id = p.id
  WHERE (pv.inventory_count IS NULL OR pv.inventory_count <= threshold)
    AND p.is_active = true
  ORDER BY pv.inventory_count NULLS FIRST, p.name, pv.name;
END;
$$;

COMMENT ON FUNCTION public.admin_get_low_inventory_products IS 'Returns products with inventory below the specified threshold';

-- ============================================================================
-- SECTION 2: ORDER MANAGEMENT
-- ============================================================================

-- Get orders with filters and pagination
CREATE OR REPLACE FUNCTION public.admin_get_orders(
  page_number int DEFAULT 1,
  page_size int DEFAULT 20,
  status_filter text DEFAULT NULL,
  payment_status_filter text DEFAULT NULL,
  search_term text DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  order_id uuid,
  order_number text,
  status text,
  payment_status text,
  customer_email text,
  customer_name text,
  subtotal numeric,
  tax_amount numeric,
  delivery_fee numeric,
  total_amount numeric,
  items_count bigint,
  created_at timestamptz,
  updated_at timestamptz,
  delivery_city text,
  delivery_state text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  offset_count int;
BEGIN
  PERFORM public.ensure_admin_access();

  offset_count := (page_number - 1) * page_size;

  RETURN QUERY
  WITH filtered_orders AS (
    SELECT
      o.id,
      o.order_number,
      o.status,
      o.payment_status,
      o.customer_email,
      CONCAT(o.delivery_first_name, ' ', o.delivery_last_name) AS customer_name,
      o.subtotal,
      o.tax_amount,
      o.delivery_fee,
      o.total_amount,
      o.created_at,
      o.updated_at,
      o.delivery_city,
      o.delivery_state
    FROM public.orders o
    WHERE
      (status_filter IS NULL OR o.status = status_filter)
      AND (payment_status_filter IS NULL OR o.payment_status = payment_status_filter)
      AND (date_from IS NULL OR o.created_at >= date_from)
      AND (date_to IS NULL OR o.created_at <= date_to)
      AND (
        search_term IS NULL
        OR o.order_number ILIKE '%' || search_term || '%'
        OR o.customer_email ILIKE '%' || search_term || '%'
        OR CONCAT(o.delivery_first_name, ' ', o.delivery_last_name) ILIKE '%' || search_term || '%'
      )
  ),
  order_counts AS (
    SELECT
      fo.id,
      COUNT(oi.id) AS items_count
    FROM filtered_orders fo
    LEFT JOIN public.order_items oi ON oi.order_id = fo.id
    GROUP BY fo.id
  ),
  total AS (
    SELECT COUNT(*) AS total_count FROM filtered_orders
  )
  SELECT
    fo.id AS order_id,
    fo.order_number,
    fo.status,
    fo.payment_status,
    fo.customer_email,
    fo.customer_name,
    fo.subtotal,
    fo.tax_amount,
    fo.delivery_fee,
    fo.total_amount,
    COALESCE(oc.items_count, 0) AS items_count,
    fo.created_at,
    fo.updated_at,
    fo.delivery_city,
    fo.delivery_state,
    t.total_count
  FROM filtered_orders fo
  LEFT JOIN order_counts oc ON oc.id = fo.id
  CROSS JOIN total t
  ORDER BY fo.created_at DESC
  LIMIT page_size
  OFFSET offset_count;
END;
$$;

COMMENT ON FUNCTION public.admin_get_orders IS 'Returns paginated orders with filtering and search capabilities';

-- Get order details with items
CREATE OR REPLACE FUNCTION public.admin_get_order_details(order_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.ensure_admin_access();

  SELECT jsonb_build_object(
    'order', row_to_json(o.*),
    'items', COALESCE(
      (
        SELECT jsonb_agg(row_to_json(oi.*))
        FROM public.order_items oi
        WHERE oi.order_id = o.id
      ),
      '[]'::jsonb
    ),
    'customer', (
      SELECT row_to_json(p.*)
      FROM public.profiles p
      WHERE p.id = o.user_id
    ),
    'status_history', COALESCE(
      (
        SELECT jsonb_agg(row_to_json(osh.*) ORDER BY osh.created_at DESC)
        FROM public.order_status_history osh
        WHERE osh.order_id = o.id
      ),
      '[]'::jsonb
    )
  ) INTO result
  FROM public.orders o
  WHERE o.id = order_id_param;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.admin_get_order_details IS 'Returns complete order details including items, customer, and history';

-- Update order status
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  order_id_param uuid,
  new_status text,
  status_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  updated_order public.orders%ROWTYPE;
  admin_user_id uuid;
BEGIN
  PERFORM public.ensure_admin_access();
  admin_user_id := auth.uid();

  -- Validate status
  IF new_status NOT IN ('pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status: %', new_status USING ERRCODE = '22023';
  END IF;

  -- Update order
  UPDATE public.orders
  SET
    status = new_status,
    updated_at = now(),
    delivered_at = CASE WHEN new_status = 'delivered' THEN now() ELSE delivered_at END
  WHERE id = order_id_param
  RETURNING * INTO updated_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', order_id_param USING ERRCODE = '22023';
  END IF;

  -- Log status change in history
  INSERT INTO public.order_status_history (order_id, status, message, created_at)
  VALUES (order_id_param, new_status, status_message, now());

  -- Log admin action
  INSERT INTO public.admin_actions (user_id, action, resource_type, resource_id, metadata, created_at)
  VALUES (
    admin_user_id,
    'update_order_status',
    'order',
    order_id_param,
    jsonb_build_object(
      'old_status', updated_order.status,
      'new_status', new_status,
      'message', status_message
    ),
    now()
  );

  RETURN row_to_json(updated_order)::jsonb;
END;
$$;

COMMENT ON FUNCTION public.admin_update_order_status IS 'Updates order status and logs the change';

-- ============================================================================
-- SECTION 3: USER MANAGEMENT
-- ============================================================================

-- Get users with filters and pagination
CREATE OR REPLACE FUNCTION public.admin_get_users(
  page_number int DEFAULT 1,
  page_size int DEFAULT 20,
  search_term text DEFAULT NULL,
  role_filter text DEFAULT NULL,
  verified_filter boolean DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  role text,
  is_admin boolean,
  age_verified boolean,
  is_verified boolean,
  created_at timestamptz,
  last_login_at timestamptz,
  total_orders bigint,
  total_spent numeric,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  offset_count int;
BEGIN
  PERFORM public.ensure_admin_access();

  offset_count := (page_number - 1) * page_size;

  RETURN QUERY
  WITH filtered_users AS (
    SELECT
      p.id,
      p.email,
      COALESCE(p.full_name, CONCAT(p.first_name, ' ', p.last_name)) AS full_name,
      p.role,
      p.is_admin,
      p.age_verified,
      p.is_verified,
      p.created_at,
      p.last_login_at
    FROM public.profiles p
    WHERE
      (search_term IS NULL OR
        p.email ILIKE '%' || search_term || '%' OR
        p.full_name ILIKE '%' || search_term || '%' OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE '%' || search_term || '%'
      )
      AND (role_filter IS NULL OR p.role = role_filter)
      AND (verified_filter IS NULL OR p.age_verified = verified_filter)
  ),
  user_stats AS (
    SELECT
      fu.id,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS total_spent
    FROM filtered_users fu
    LEFT JOIN public.orders o ON o.user_id = fu.id AND o.payment_status = 'paid'
    GROUP BY fu.id
  ),
  total AS (
    SELECT COUNT(*) AS total_count FROM filtered_users
  )
  SELECT
    fu.id AS user_id,
    fu.email,
    fu.full_name,
    fu.role,
    fu.is_admin,
    fu.age_verified,
    fu.is_verified,
    fu.created_at,
    fu.last_login_at,
    COALESCE(us.total_orders, 0) AS total_orders,
    COALESCE(us.total_spent, 0) AS total_spent,
    t.total_count
  FROM filtered_users fu
  LEFT JOIN user_stats us ON us.id = fu.id
  CROSS JOIN total t
  ORDER BY fu.created_at DESC
  LIMIT page_size
  OFFSET offset_count;
END;
$$;

COMMENT ON FUNCTION public.admin_get_users IS 'Returns paginated users with statistics and filtering';

-- Get user details
CREATE OR REPLACE FUNCTION public.admin_get_user_details(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.ensure_admin_access();

  SELECT jsonb_build_object(
    'profile', row_to_json(p.*),
    'preferences', (
      SELECT row_to_json(up.*)
      FROM public.user_preferences up
      WHERE up.user_id = p.id
    ),
    'addresses', COALESCE(
      (
        SELECT jsonb_agg(row_to_json(a.*))
        FROM public.addresses a
        WHERE a.user_id = p.id
      ),
      '[]'::jsonb
    ),
    'recent_orders', COALESCE(
      (
        SELECT jsonb_agg(row_to_json(o.*) ORDER BY o.created_at DESC)
        FROM public.orders o
        WHERE o.user_id = p.id
        LIMIT 10
      ),
      '[]'::jsonb
    ),
    'stats', jsonb_build_object(
      'total_orders', (SELECT COUNT(*) FROM public.orders WHERE user_id = p.id),
      'total_spent', (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE user_id = p.id AND payment_status = 'paid'),
      'average_order_value', (SELECT COALESCE(AVG(total_amount), 0) FROM public.orders WHERE user_id = p.id AND payment_status = 'paid'),
      'last_order_date', (SELECT MAX(created_at) FROM public.orders WHERE user_id = p.id)
    )
  ) INTO result
  FROM public.profiles p
  WHERE p.id = user_id_param;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.admin_get_user_details IS 'Returns complete user profile with stats, orders, and preferences';

-- Update user role
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  user_id_param uuid,
  new_role text,
  new_is_admin boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  updated_profile public.profiles%ROWTYPE;
  admin_user_id uuid;
BEGIN
  PERFORM public.ensure_admin_access();
  admin_user_id := auth.uid();

  -- Validate role
  IF new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role USING ERRCODE = '22023';
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET
    role = new_role,
    is_admin = COALESCE(new_is_admin, (new_role = 'admin')),
    updated_at = now()
  WHERE id = user_id_param
  RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id_param USING ERRCODE = '22023';
  END IF;

  -- Log admin action
  INSERT INTO public.admin_actions (user_id, action, resource_type, resource_id, metadata, created_at)
  VALUES (
    admin_user_id,
    'update_user_role',
    'profile',
    user_id_param,
    jsonb_build_object(
      'new_role', new_role,
      'new_is_admin', COALESCE(new_is_admin, (new_role = 'admin'))
    ),
    now()
  );

  RETURN row_to_json(updated_profile)::jsonb;
END;
$$;

COMMENT ON FUNCTION public.admin_update_user_role IS 'Updates user role and admin status';

-- ============================================================================
-- SECTION 4: ANALYTICS & REPORTING
-- ============================================================================

-- Get sales analytics
CREATE OR REPLACE FUNCTION public.admin_get_sales_analytics(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL,
  group_by_period text DEFAULT 'day' -- 'day', 'week', 'month'
)
RETURNS TABLE(
  period_start timestamptz,
  period_end timestamptz,
  total_orders bigint,
  completed_orders bigint,
  cancelled_orders bigint,
  total_revenue numeric,
  average_order_value numeric,
  unique_customers bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.ensure_admin_access();

  -- Default to last 30 days if no dates provided
  start_date := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
  end_date := COALESCE(end_date, CURRENT_DATE + INTERVAL '1 day');

  RETURN QUERY
  WITH period_series AS (
    SELECT
      date_trunc(group_by_period, generate_series(start_date, end_date, ('1 ' || group_by_period)::interval)) AS period_start
  ),
  period_bounds AS (
    SELECT
      period_start,
      CASE
        WHEN group_by_period = 'day' THEN period_start + INTERVAL '1 day'
        WHEN group_by_period = 'week' THEN period_start + INTERVAL '1 week'
        WHEN group_by_period = 'month' THEN period_start + INTERVAL '1 month'
      END AS period_end
    FROM period_series
  )
  SELECT
    pb.period_start,
    pb.period_end,
    COUNT(o.id) AS total_orders,
    COUNT(o.id) FILTER (WHERE o.status = 'delivered') AS completed_orders,
    COUNT(o.id) FILTER (WHERE o.status = 'cancelled') AS cancelled_orders,
    COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_status = 'paid'), 0) AS total_revenue,
    COALESCE(AVG(o.total_amount) FILTER (WHERE o.payment_status = 'paid'), 0) AS average_order_value,
    COUNT(DISTINCT o.user_id) AS unique_customers
  FROM period_bounds pb
  LEFT JOIN public.orders o ON o.created_at >= pb.period_start AND o.created_at < pb.period_end
  GROUP BY pb.period_start, pb.period_end
  ORDER BY pb.period_start DESC;
END;
$$;

COMMENT ON FUNCTION public.admin_get_sales_analytics IS 'Returns sales analytics grouped by time period';

-- Get top products
CREATE OR REPLACE FUNCTION public.admin_get_top_products(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL,
  limit_count int DEFAULT 10
)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  category text,
  total_quantity bigint,
  total_revenue numeric,
  order_count bigint,
  avg_price numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.ensure_admin_access();

  start_date := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
  end_date := COALESCE(end_date, CURRENT_DATE + INTERVAL '1 day');

  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.total_price) AS total_revenue,
    COUNT(DISTINCT oi.order_id) AS order_count,
    AVG(oi.unit_price) AS avg_price
  FROM public.products p
  INNER JOIN public.order_items oi ON oi.product_id = p.id
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE o.created_at >= start_date
    AND o.created_at < end_date
    AND o.payment_status = 'paid'
  GROUP BY p.id, p.name, p.category
  ORDER BY total_revenue DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION public.admin_get_top_products IS 'Returns top-selling products by revenue';

-- Get category performance
CREATE OR REPLACE FUNCTION public.admin_get_category_analytics(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  category text,
  total_products bigint,
  active_products bigint,
  total_orders bigint,
  total_revenue numeric,
  avg_order_value numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.ensure_admin_access();

  start_date := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
  end_date := COALESCE(end_date, CURRENT_DATE + INTERVAL '1 day');

  RETURN QUERY
  SELECT
    p.category,
    COUNT(DISTINCT p.id) AS total_products,
    COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true) AS active_products,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    COALESCE(SUM(oi.total_price), 0) AS total_revenue,
    COALESCE(AVG(oi.total_price), 0) AS avg_order_value
  FROM public.products p
  LEFT JOIN public.order_items oi ON oi.product_id = p.id
  LEFT JOIN public.orders o ON o.id = oi.order_id
    AND o.created_at >= start_date
    AND o.created_at < end_date
    AND o.payment_status = 'paid'
  GROUP BY p.category
  ORDER BY total_revenue DESC;
END;
$$;

COMMENT ON FUNCTION public.admin_get_category_analytics IS 'Returns performance metrics by product category';

-- ============================================================================
-- SECTION 5: INVENTORY MANAGEMENT
-- ============================================================================

-- Bulk update inventory
CREATE OR REPLACE FUNCTION public.admin_bulk_update_inventory(
  updates jsonb -- Array of {variant_id, quantity_change, reason}
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  update_record jsonb;
  variant_id_param text;
  quantity_change_param int;
  reason_param text;
  current_inventory int;
  new_inventory int;
  affected_count int := 0;
  admin_user_id uuid;
BEGIN
  PERFORM public.ensure_admin_access();
  admin_user_id := auth.uid();

  IF jsonb_typeof(updates) <> 'array' THEN
    RAISE EXCEPTION 'updates must be a JSON array' USING ERRCODE = '22023';
  END IF;

  FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    variant_id_param := update_record->>'variant_id';
    quantity_change_param := (update_record->>'quantity_change')::int;
    reason_param := update_record->>'reason';

    -- Get current inventory
    SELECT inventory_count INTO current_inventory
    FROM public.product_variants
    WHERE id = variant_id_param;

    IF NOT FOUND THEN
      CONTINUE; -- Skip if variant not found
    END IF;

    -- Calculate new inventory
    new_inventory := GREATEST(0, COALESCE(current_inventory, 0) + quantity_change_param);

    -- Update inventory
    UPDATE public.product_variants
    SET
      inventory_count = new_inventory,
      updated_at = now()
    WHERE id = variant_id_param;

    -- Log inventory change
    INSERT INTO public.inventory_logs (
      variant_id,
      product_id,
      dispensary_id,
      action,
      quantity_before,
      quantity_change,
      quantity_after,
      reason,
      changed_by,
      created_at
    )
    SELECT
      variant_id_param,
      pv.product_id,
      p.dispensary_id,
      CASE
        WHEN quantity_change_param > 0 THEN 'restock'
        ELSE 'adjustment'
      END,
      current_inventory,
      quantity_change_param,
      new_inventory,
      reason_param,
      admin_user_id,
      now()
    FROM public.product_variants pv
    INNER JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = variant_id_param;

    affected_count := affected_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'affected_count', affected_count,
    'updated_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.admin_bulk_update_inventory IS 'Bulk updates inventory for multiple variants with logging';

-- Get inventory history
CREATE OR REPLACE FUNCTION public.admin_get_inventory_history(
  product_id_param uuid DEFAULT NULL,
  variant_id_param text DEFAULT NULL,
  action_filter text DEFAULT NULL,
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL,
  page_number int DEFAULT 1,
  page_size int DEFAULT 50
)
RETURNS TABLE(
  log_id uuid,
  product_id uuid,
  product_name text,
  variant_id text,
  variant_name text,
  action text,
  quantity_before int,
  quantity_change int,
  quantity_after int,
  reason text,
  changed_by_email text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  offset_count int;
BEGIN
  PERFORM public.ensure_admin_access();

  offset_count := (page_number - 1) * page_size;
  start_date := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
  end_date := COALESCE(end_date, CURRENT_DATE + INTERVAL '1 day');

  RETURN QUERY
  WITH filtered_logs AS (
    SELECT
      il.id,
      il.product_id,
      il.variant_id,
      il.action,
      il.quantity_before,
      il.quantity_change,
      il.quantity_after,
      il.reason,
      il.changed_by,
      il.created_at
    FROM public.inventory_logs il
    WHERE
      (product_id_param IS NULL OR il.product_id = product_id_param)
      AND (variant_id_param IS NULL OR il.variant_id = variant_id_param)
      AND (action_filter IS NULL OR il.action = action_filter)
      AND il.created_at >= start_date
      AND il.created_at < end_date
  ),
  total AS (
    SELECT COUNT(*) AS total_count FROM filtered_logs
  )
  SELECT
    fl.id AS log_id,
    fl.product_id,
    p.name AS product_name,
    fl.variant_id,
    pv.name AS variant_name,
    fl.action,
    fl.quantity_before,
    fl.quantity_change,
    fl.quantity_after,
    fl.reason,
    pr.email AS changed_by_email,
    fl.created_at,
    t.total_count
  FROM filtered_logs fl
  INNER JOIN public.products p ON p.id = fl.product_id
  LEFT JOIN public.product_variants pv ON pv.id = fl.variant_id
  LEFT JOIN public.profiles pr ON pr.id = fl.changed_by
  CROSS JOIN total t
  ORDER BY fl.created_at DESC
  LIMIT page_size
  OFFSET offset_count;
END;
$$;

COMMENT ON FUNCTION public.admin_get_inventory_history IS 'Returns paginated inventory change history with filters';

-- ============================================================================
-- SECTION 6: SYSTEM SETTINGS & CONFIGURATION
-- ============================================================================

-- Get all system settings
CREATE OR REPLACE FUNCTION public.admin_get_system_settings()
RETURNS TABLE(
  key text,
  value text,
  description text,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.ensure_admin_access();

  RETURN QUERY
  SELECT
    sc.key,
    sc.value,
    sc.description,
    sc.updated_at
  FROM public.system_config sc
  ORDER BY sc.key;
END;
$$;

COMMENT ON FUNCTION public.admin_get_system_settings IS 'Returns all system configuration settings';

-- Update system setting
CREATE OR REPLACE FUNCTION public.admin_update_system_setting(
  setting_key text,
  setting_value text,
  setting_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
  old_value text;
BEGIN
  PERFORM public.ensure_admin_access();
  admin_user_id := auth.uid();

  -- Get old value for logging
  SELECT value INTO old_value
  FROM public.system_config
  WHERE key = setting_key;

  -- Upsert setting
  INSERT INTO public.system_config (key, value, description, updated_at)
  VALUES (setting_key, setting_value, setting_description, now())
  ON CONFLICT (key) DO UPDATE
  SET
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, system_config.description),
    updated_at = now();

  -- Log admin action
  INSERT INTO public.admin_actions (user_id, action, resource_type, resource_id, metadata, created_at)
  VALUES (
    admin_user_id,
    'update_system_setting',
    'system_config',
    NULL,
    jsonb_build_object(
      'key', setting_key,
      'old_value', old_value,
      'new_value', setting_value
    ),
    now()
  );

  RETURN jsonb_build_object(
    'key', setting_key,
    'value', setting_value,
    'updated_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.admin_update_system_setting IS 'Updates or creates a system configuration setting';

-- ============================================================================
-- SECTION 7: ADMIN AUDIT LOG
-- ============================================================================

-- Get admin action logs
CREATE OR REPLACE FUNCTION public.admin_get_action_logs(
  action_filter text DEFAULT NULL,
  resource_type_filter text DEFAULT NULL,
  user_id_filter uuid DEFAULT NULL,
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL,
  page_number int DEFAULT 1,
  page_size int DEFAULT 50
)
RETURNS TABLE(
  log_id uuid,
  user_email text,
  action text,
  resource_type text,
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  offset_count int;
BEGIN
  PERFORM public.ensure_admin_access();

  offset_count := (page_number - 1) * page_size;
  start_date := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
  end_date := COALESCE(end_date, CURRENT_DATE + INTERVAL '1 day');

  RETURN QUERY
  WITH filtered_logs AS (
    SELECT
      aa.id,
      aa.user_id,
      aa.action,
      aa.resource_type,
      aa.resource_id,
      aa.metadata,
      aa.created_at
    FROM public.admin_actions aa
    WHERE
      (action_filter IS NULL OR aa.action = action_filter)
      AND (resource_type_filter IS NULL OR aa.resource_type = resource_type_filter)
      AND (user_id_filter IS NULL OR aa.user_id = user_id_filter)
      AND aa.created_at >= start_date
      AND aa.created_at < end_date
  ),
  total AS (
    SELECT COUNT(*) AS total_count FROM filtered_logs
  )
  SELECT
    fl.id AS log_id,
    p.email AS user_email,
    fl.action,
    fl.resource_type,
    fl.resource_id,
    fl.metadata,
    fl.created_at,
    t.total_count
  FROM filtered_logs fl
  INNER JOIN public.profiles p ON p.id = fl.user_id
  CROSS JOIN total t
  ORDER BY fl.created_at DESC
  LIMIT page_size
  OFFSET offset_count;
END;
$$;

COMMENT ON FUNCTION public.admin_get_action_logs IS 'Returns paginated admin action audit logs with filters';

-- ============================================================================
-- SECTION 8: BULK OPERATIONS
-- ============================================================================

-- Bulk activate/deactivate products
CREATE OR REPLACE FUNCTION public.admin_bulk_toggle_products(
  product_ids uuid[],
  set_active boolean
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  affected_count int;
  admin_user_id uuid;
BEGIN
  PERFORM public.ensure_admin_access();
  admin_user_id := auth.uid();

  UPDATE public.products
  SET
    is_active = set_active,
    updated_at = now()
  WHERE id = ANY(product_ids);

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  -- Log admin action
  INSERT INTO public.admin_actions (user_id, action, resource_type, resource_id, metadata, created_at)
  VALUES (
    admin_user_id,
    'bulk_toggle_products',
    'product',
    NULL,
    jsonb_build_object(
      'product_ids', product_ids,
      'set_active', set_active,
      'affected_count', affected_count
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'affected_count', affected_count,
    'set_active', set_active
  );
END;
$$;

COMMENT ON FUNCTION public.admin_bulk_toggle_products IS 'Bulk activate or deactivate products';

-- Bulk update product category
CREATE OR REPLACE FUNCTION public.admin_bulk_update_category(
  product_ids uuid[],
  new_category text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  affected_count int;
  admin_user_id uuid;
BEGIN
  PERFORM public.ensure_admin_access();
  admin_user_id := auth.uid();

  -- Validate category
  IF new_category NOT IN ('flower', 'edibles', 'concentrates', 'accessories') THEN
    RAISE EXCEPTION 'Invalid category: %', new_category USING ERRCODE = '22023';
  END IF;

  UPDATE public.products
  SET
    category = new_category,
    updated_at = now()
  WHERE id = ANY(product_ids);

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  -- Log admin action
  INSERT INTO public.admin_actions (user_id, action, resource_type, resource_id, metadata, created_at)
  VALUES (
    admin_user_id,
    'bulk_update_category',
    'product',
    NULL,
    jsonb_build_object(
      'product_ids', product_ids,
      'new_category', new_category,
      'affected_count', affected_count
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'affected_count', affected_count,
    'new_category', new_category
  );
END;
$$;

COMMENT ON FUNCTION public.admin_bulk_update_category IS 'Bulk update product categories';

-- ============================================================================
-- SECTION 9: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on all admin functions to authenticated users
-- (the functions themselves check for admin privileges using ensure_admin_access)
GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_low_inventory_products(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_orders(int, int, text, text, text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_order_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_users(int, int, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_sales_analytics(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_top_products(timestamptz, timestamptz, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_category_analytics(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_inventory(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_inventory_history(uuid, text, text, timestamptz, timestamptz, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_system_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_system_setting(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_action_logs(text, text, uuid, timestamptz, timestamptz, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_toggle_products(uuid[], boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_category(uuid[], text) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

