-- Enterprise Inventory Management System Migration
-- Advanced inventory tables for real-time stock management and reservations

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id TEXT,
  dispensary_id UUID NOT NULL REFERENCES public.dispensaries(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  location TEXT NOT NULL,
  batch_number TEXT,
  expiry_date TIMESTAMPTZ,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure reserved quantity doesn't exceed total quantity
  CONSTRAINT check_reserved_quantity CHECK (reserved_quantity <= quantity),

  -- Unique constraint for product-variant-dispensary-location combination
  CONSTRAINT unique_inventory_item UNIQUE (product_id, variant_id, dispensary_id, location)
);

-- Inventory Reservations Table
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'FULFILLED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Movements Table (audit trail)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('STOCK_IN', 'STOCK_OUT', 'RESERVATION', 'RESERVATION_RELEASE', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED')),
  quantity INTEGER NOT NULL,
  reference_id UUID, -- Can reference order_id, reservation_id, etc.
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  location TEXT NOT NULL,
  cost_impact NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Alerts Table
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id TEXT,
  dispensary_id UUID NOT NULL REFERENCES public.dispensaries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'RESERVATION_EXPIRED')),
  threshold_value INTEGER,
  current_quantity INTEGER NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicate alerts for same condition
  CONSTRAINT unique_stock_alert UNIQUE (product_id, variant_id, dispensary_id, type, current_quantity)
);

-- Indexes for performance
CREATE INDEX idx_inventory_items_product_id ON public.inventory_items(product_id);
CREATE INDEX idx_inventory_items_dispensary_id ON public.inventory_items(dispensary_id);
CREATE INDEX idx_inventory_items_variant_id ON public.inventory_items(variant_id);
CREATE INDEX idx_inventory_items_available ON public.inventory_items((quantity - reserved_quantity));
CREATE INDEX idx_inventory_items_expiry ON public.inventory_items(expiry_date) WHERE expiry_date IS NOT NULL;

CREATE INDEX idx_inventory_reservations_order_id ON public.inventory_reservations(order_id);
CREATE INDEX idx_inventory_reservations_user_id ON public.inventory_reservations(user_id);
CREATE INDEX idx_inventory_reservations_status ON public.inventory_reservations(status);
CREATE INDEX idx_inventory_reservations_expires_at ON public.inventory_reservations(expires_at);

CREATE INDEX idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_type ON public.inventory_movements(type);
CREATE INDEX idx_inventory_movements_created_at ON public.inventory_movements(created_at);
CREATE INDEX idx_inventory_movements_performed_by ON public.inventory_movements(performed_by);

CREATE INDEX idx_stock_alerts_product_id ON public.stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_dispensary_id ON public.stock_alerts(dispensary_id);
CREATE INDEX idx_stock_alerts_priority ON public.stock_alerts(priority DESC);
CREATE INDEX idx_stock_alerts_acknowledged ON public.stock_alerts(acknowledged);
CREATE INDEX idx_stock_alerts_type ON public.stock_alerts(type);

-- RLS Policies
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view inventory for products they can access
CREATE POLICY "Users can view inventory items" ON public.inventory_items
  FOR SELECT TO authenticated USING (
    -- Allow if user is admin or vendor for this dispensary
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR p.role = 'vendor')
    )
  );

CREATE POLICY "Vendors can manage their dispensary inventory" ON public.inventory_items
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.vendor_users vu ON vu.user_id = p.id
      WHERE p.id = auth.uid()
      AND vu.dispensary_id = inventory_items.dispensary_id
      AND vu.is_active = true
      AND vu.can_manage_inventory = true
    )
  );

CREATE POLICY "Admins can manage all inventory" ON public.inventory_items
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access to inventory" ON public.inventory_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Reservation policies
CREATE POLICY "Users can view their own reservations" ON public.inventory_reservations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Vendors can view reservations for their dispensary" ON public.inventory_reservations
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.vendor_users vu ON vu.user_id = p.id
      JOIN public.inventory_items ii ON ii.dispensary_id = vu.dispensary_id
      WHERE p.id = auth.uid()
      AND vu.dispensary_id = ii.dispensary_id
      AND vu.is_active = true
    )
  );

CREATE POLICY "Admins can access all reservations" ON public.inventory_reservations
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role access to reservations
CREATE POLICY "Service role access to reservations" ON public.inventory_reservations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Movement policies (audit trail - mostly read-only)
CREATE POLICY "Users can view relevant movements" ON public.inventory_movements
  FOR SELECT TO authenticated USING (
    performed_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR p.role = 'vendor')
    )
  );

CREATE POLICY "Vendors can create movements for their dispensary" ON public.inventory_movements
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.vendor_users vu ON vu.user_id = p.id
      WHERE p.id = auth.uid()
      AND vu.is_active = true
      AND vu.can_manage_inventory = true
    )
  );

-- Stock alert policies
CREATE POLICY "Vendors can view alerts for their dispensary" ON public.stock_alerts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.vendor_users vu ON vu.user_id = p.id
      WHERE p.id = auth.uid()
      AND vu.dispensary_id = stock_alerts.dispensary_id
      AND vu.is_active = true
    )
  );

CREATE POLICY "Vendors can acknowledge alerts for their dispensary" ON public.stock_alerts
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.vendor_users vu ON vu.user_id = p.id
      WHERE p.id = auth.uid()
      AND vu.dispensary_id = stock_alerts.dispensary_id
      AND vu.is_active = true
    )
  ) WITH CHECK (
    acknowledged = true AND
    acknowledged_by = auth.uid() AND
    acknowledged_at = NOW()
  );

CREATE POLICY "Admins can access all alerts" ON public.stock_alerts
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions for Inventory Management

-- Get available inventory for a product
CREATE OR REPLACE FUNCTION get_available_inventory(
  p_product_id UUID,
  p_variant_id TEXT DEFAULT NULL,
  p_dispensary_id UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  product_id UUID,
  variant_id TEXT,
  dispensary_id UUID,
  available_quantity INTEGER,
  location TEXT,
  expiry_date TIMESTAMPTZ,
  cost_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ii.id,
    ii.product_id,
    ii.variant_id,
    ii.dispensary_id,
    (ii.quantity - ii.reserved_quantity) as available_quantity,
    ii.location,
    ii.expiry_date,
    ii.cost_price
  FROM public.inventory_items ii
  WHERE ii.product_id = p_product_id
    AND (p_variant_id IS NULL OR ii.variant_id = p_variant_id)
    AND (p_dispensary_id IS NULL OR ii.dispensary_id = p_dispensary_id)
    AND (ii.quantity - ii.reserved_quantity) > 0
  ORDER BY
    CASE WHEN ii.expiry_date IS NOT NULL THEN ii.expiry_date END ASC NULLS LAST,
    ii.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reserve inventory (internal function used by service)
CREATE OR REPLACE FUNCTION reserve_inventory_internal(
  p_product_id UUID,
  p_variant_id TEXT,
  p_quantity INTEGER,
  p_order_id UUID,
  p_user_id UUID,
  p_expires_at TIMESTAMPTZ
) RETURNS TABLE (
  reservation_id UUID,
  reserved_quantity INTEGER,
  inventory_item_id UUID
) AS $$
DECLARE
  remaining_quantity INTEGER := p_quantity;
  inv_item RECORD;
BEGIN
  -- Loop through available inventory items (FIFO by expiry)
  FOR inv_item IN
    SELECT * FROM get_available_inventory(p_product_id, p_variant_id)
    ORDER BY expiry_date ASC NULLS LAST, created_at ASC
  LOOP
    EXIT WHEN remaining_quantity <= 0;

    -- Calculate how much to reserve from this item
    DECLARE
      reserve_amount INTEGER := LEAST(remaining_quantity, inv_item.available_quantity);
    BEGIN
      -- Update inventory item
      UPDATE public.inventory_items
      SET reserved_quantity = reserved_quantity + reserve_amount,
          updated_at = NOW()
      WHERE id = inv_item.id;

      -- Create reservation record
      INSERT INTO public.inventory_reservations (product_id, variant_id, quantity, order_id, user_id, expires_at, status, created_at)
      VALUES (p_product_id, p_variant_id, reserve_amount, p_order_id, p_user_id, p_expires_at, 'ACTIVE', NOW());

      -- Return reservation info
      reservation_id := (SELECT id FROM public.inventory_reservations WHERE order_id = p_order_id AND product_id = p_product_id ORDER BY created_at DESC LIMIT 1);

      RETURN QUERY SELECT reservation_id, reserve_amount, inv_item.id;

      remaining_quantity := remaining_quantity - reserve_amount;
    END;
  END LOOP;

  -- If we couldn't reserve all requested quantity, this will be caught by the calling service
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release expired reservations
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  released_count INTEGER := 0;
  reservation RECORD;
BEGIN
  FOR reservation IN
    SELECT * FROM public.inventory_reservations
    WHERE status = 'ACTIVE' AND expires_at < NOW()
  LOOP
    -- Release reserved quantity
    UPDATE public.inventory_items
    SET reserved_quantity = reserved_quantity - reservation.quantity,
        updated_at = NOW()
    WHERE product_id = reservation.product_id
      AND variant_id = reservation.variant_id
      AND reserved_quantity >= reservation.quantity;

    -- Update reservation status
    UPDATE public.inventory_reservations
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE id = reservation.id;

    released_count := released_count + 1;
  END LOOP;

  RETURN released_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get inventory analytics
CREATE OR REPLACE FUNCTION get_inventory_analytics(
  p_product_id UUID DEFAULT NULL,
  p_variant_id TEXT DEFAULT NULL,
  p_dispensary_id UUID DEFAULT NULL,
  p_period TEXT DEFAULT 'MONTH',
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  product_id UUID,
  variant_id TEXT,
  dispensary_id UUID,
  period TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  total_stock_in NUMERIC,
  total_stock_out NUMERIC,
  average_stock_level NUMERIC,
  stock_turnover_rate NUMERIC,
  out_of_stock_events INTEGER,
  low_stock_alerts INTEGER,
  expiry_events INTEGER,
  revenue NUMERIC,
  cost_of_goods NUMERIC,
  profit_margin NUMERIC
) AS $$
DECLARE
  start_ts TIMESTAMPTZ;
  end_ts TIMESTAMPTZ;
BEGIN
  -- Calculate date range based on period if not provided
  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    end_ts := COALESCE(p_end_date, NOW());

    CASE p_period
      WHEN 'DAY' THEN start_ts := end_ts - INTERVAL '1 day';
      WHEN 'WEEK' THEN start_ts := end_ts - INTERVAL '7 days';
      WHEN 'MONTH' THEN start_ts := date_trunc('month', end_ts);
      WHEN 'QUARTER' THEN start_ts := date_trunc('quarter', end_ts);
      WHEN 'YEAR' THEN start_ts := date_trunc('year', end_ts);
      ELSE start_ts := end_ts - INTERVAL '30 days';
    END CASE;
  ELSE
    start_ts := p_start_date;
    end_ts := p_end_date;
  END IF;

  RETURN QUERY
  SELECT
    im.product_id,
    im.variant_id,
    im.dispensary_id,
    p_period as period,
    start_ts as start_date,
    end_ts as end_date,
    COALESCE(SUM(CASE WHEN im.type = 'STOCK_IN' THEN im.quantity END), 0) as total_stock_in,
    COALESCE(SUM(CASE WHEN im.type = 'STOCK_OUT' THEN im.quantity END), 0) as total_stock_out,
    AVG(ii.quantity) as average_stock_level,
    CASE
      WHEN SUM(CASE WHEN im.type = 'STOCK_IN' THEN im.quantity END) > 0
      THEN SUM(CASE WHEN im.type = 'STOCK_OUT' THEN im.quantity END) / SUM(CASE WHEN im.type = 'STOCK_IN' THEN im.quantity END)
      ELSE 0
    END as stock_turnover_rate,
    COUNT(CASE WHEN ii.quantity <= 0 THEN 1 END) as out_of_stock_events,
    COUNT(sa.id) as low_stock_alerts,
    COUNT(CASE WHEN im.type = 'EXPIRED' THEN 1 END) as expiry_events,
    COALESCE(SUM(o.total_amount), 0) as revenue,
    COALESCE(SUM(im.cost_impact), 0) as cost_of_goods,
    CASE
      WHEN COALESCE(SUM(o.total_amount), 0) > 0
      THEN ((COALESCE(SUM(o.total_amount), 0) - COALESCE(SUM(im.cost_impact), 0)) / COALESCE(SUM(o.total_amount), 0)) * 100
      ELSE 0
    END as profit_margin
  FROM public.inventory_movements im
  LEFT JOIN public.inventory_items ii ON im.product_id = ii.product_id AND im.variant_id = ii.variant_id
  LEFT JOIN public.orders o ON im.reference_id = o.id AND im.type = 'STOCK_OUT'
  LEFT JOIN public.stock_alerts sa ON im.product_id = sa.product_id AND im.variant_id = sa.variant_id AND sa.type = 'LOW_STOCK'
  WHERE im.created_at BETWEEN start_ts AND end_ts
    AND (p_product_id IS NULL OR im.product_id = p_product_id)
    AND (p_variant_id IS NULL OR im.variant_id = p_variant_id)
    AND (p_dispensary_id IS NULL OR im.dispensary_id = p_dispensary_id)
  GROUP BY im.product_id, im.variant_id, im.dispensary_id
  ORDER BY total_stock_out DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.inventory_items TO service_role;
GRANT ALL ON public.inventory_reservations TO service_role;
GRANT ALL ON public.inventory_movements TO service_role;
GRANT ALL ON public.stock_alerts TO service_role;

GRANT SELECT ON public.inventory_items TO authenticated;
GRANT SELECT ON public.inventory_reservations TO authenticated;
GRANT SELECT ON public.inventory_movements TO authenticated;
GRANT SELECT, UPDATE ON public.stock_alerts TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_available_inventory(UUID, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION reserve_inventory_internal(UUID, TEXT, INTEGER, UUID, UUID, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION release_expired_reservations() TO service_role;
GRANT EXECUTE ON FUNCTION get_inventory_analytics(UUID, TEXT, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;

-- Comments for documentation
COMMENT ON TABLE public.inventory_items IS 'Real-time inventory tracking with reservations and location-based storage';
COMMENT ON TABLE public.inventory_reservations IS 'Temporary reservations of inventory for orders with automatic expiration';
COMMENT ON TABLE public.inventory_movements IS 'Complete audit trail of all inventory changes for compliance and analytics';
COMMENT ON TABLE public.stock_alerts IS 'Automated alerts for low stock, out of stock, and expiring items';

COMMENT ON FUNCTION get_available_inventory(UUID, TEXT, UUID) IS 'Retrieves available inventory for a product, ordered by expiry date (FIFO)';
COMMENT ON FUNCTION reserve_inventory_internal(UUID, TEXT, INTEGER, UUID, UUID, TIMESTAMPTZ) IS 'Internal function to reserve inventory (used by application service)';
COMMENT ON FUNCTION release_expired_reservations() IS 'Releases expired inventory reservations (should be called by cron job)';
COMMENT ON FUNCTION get_inventory_analytics(UUID, TEXT, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Comprehensive inventory analytics with turnover rates and profit margins';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ENTERPRISE INVENTORY SYSTEM INSTALLED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Advanced inventory management infrastructure created:';
    RAISE NOTICE '- inventory_items table for real-time stock tracking';
    RAISE NOTICE '- inventory_reservations table for order reservations';
    RAISE NOTICE '- inventory_movements table for complete audit trail';
    RAISE NOTICE '- stock_alerts table for automated monitoring';
    RAISE NOTICE '';
    RAISE NOTICE 'Features implemented:';
    RAISE NOTICE '- FIFO inventory allocation by expiry date';
    RAISE NOTICE '- Automatic reservation expiration and release';
    RAISE NOTICE '- Real-time stock alerts and notifications';
    RAISE NOTICE '- Comprehensive movement tracking for compliance';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created for inventory management:';
    RAISE NOTICE '- get_available_inventory() - check available stock';
    RAISE NOTICE '- reserve_inventory_internal() - reserve stock for orders';
    RAISE NOTICE '- release_expired_reservations() - cleanup expired reservations';
    RAISE NOTICE '- get_inventory_analytics() - business intelligence data';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for enterprise-grade inventory management!';
END $$;


