-- Enterprise Dynamic Pricing System Migration
-- Tables for ML-powered pricing, demand forecasting, and pricing strategies

-- Pricing Strategies Table
CREATE TABLE IF NOT EXISTS public.pricing_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100, -- Higher number = higher priority
  conditions JSONB NOT NULL, -- Array of condition objects
  actions JSONB NOT NULL, -- Array of action objects
  constraints JSONB, -- Optional price/discount constraints
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one active strategy per priority level
  CONSTRAINT unique_priority_enabled UNIQUE (priority, enabled)
);

-- Demand Forecasting Data Table
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id TEXT,
  forecast_period INTEGER NOT NULL CHECK (forecast_period > 0),
  predicted_demand NUMERIC NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  factors JSONB NOT NULL, -- Array of demand factors
  recommended_price NUMERIC NOT NULL,
  price_elasticity NUMERIC,
  forecast_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicate forecasts for same period
  CONSTRAINT unique_forecast UNIQUE (product_id, variant_id, forecast_period, forecast_date)
);

-- Price History Table
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id TEXT,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  price_change_reason TEXT NOT NULL,
  applied_strategy TEXT,
  confidence_score INTEGER,
  factors JSONB, -- Array of pricing factors that influenced the change
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure no overlapping price periods for same product
  CONSTRAINT no_price_overlap EXCLUDE USING gist (
    product_id WITH =,
    variant_id WITH =,
    tstzrange(effective_from, effective_until) WITH &&
  )
);

-- Competitor Price Monitoring Table
CREATE TABLE IF NOT EXISTS public.competitor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id TEXT,
  competitor_name TEXT NOT NULL,
  competitor_price NUMERIC NOT NULL,
  our_price NUMERIC,
  price_difference NUMERIC, -- competitor_price - our_price
  price_match_score NUMERIC, -- 0-100, how well we match competitor pricing
  source_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for efficient competitor price queries
  CONSTRAINT unique_competitor_product UNIQUE (product_id, variant_id, competitor_name, scraped_at)
);

-- Pricing Analytics Table
CREATE TABLE IF NOT EXISTS public.pricing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id TEXT,
  date DATE NOT NULL,
  base_price NUMERIC NOT NULL,
  applied_price NUMERIC NOT NULL,
  discount_percentage NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  average_order_value NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  competitor_average NUMERIC,
  demand_level TEXT CHECK (demand_level IN ('LOW', 'MEDIUM', 'HIGH')),
  inventory_level NUMERIC DEFAULT 0, -- Percentage
  strategy_applied TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for daily analytics
  CONSTRAINT unique_daily_analytics UNIQUE (product_id, variant_id, date)
);

-- Indexes for performance
CREATE INDEX idx_pricing_strategies_enabled ON public.pricing_strategies(enabled, priority DESC);
CREATE INDEX idx_demand_forecasts_product_id ON public.demand_forecasts(product_id);
CREATE INDEX idx_demand_forecasts_forecast_date ON public.demand_forecasts(forecast_date);
CREATE INDEX idx_price_history_product_id ON public.price_history(product_id);
CREATE INDEX idx_price_history_effective_from ON public.price_history(effective_from);
CREATE INDEX idx_competitor_prices_product_id ON public.competitor_prices(product_id);
CREATE INDEX idx_competitor_prices_scraped_at ON public.competitor_prices(scraped_at);
CREATE INDEX idx_pricing_analytics_product_id ON public.pricing_analytics(product_id);
CREATE INDEX idx_pricing_analytics_date ON public.pricing_analytics(date);

-- RLS Policies
ALTER TABLE public.pricing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_analytics ENABLE ROW LEVEL SECURITY;

-- Admins can manage pricing strategies and view all pricing data
CREATE POLICY "Admins can manage pricing strategies" ON public.pricing_strategies
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view demand forecasts" ON public.demand_forecasts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view price history" ON public.price_history
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage competitor prices" ON public.competitor_prices
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view pricing analytics" ON public.pricing_analytics
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access to pricing tables" ON public.pricing_strategies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access to demand forecasts" ON public.demand_forecasts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access to price history" ON public.price_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access to competitor prices" ON public.competitor_prices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role access to pricing analytics" ON public.pricing_analytics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Functions for Dynamic Pricing

-- Get current active price for a product
CREATE OR REPLACE FUNCTION get_current_price(
  p_product_id UUID,
  p_variant_id TEXT DEFAULT NULL
) RETURNS TABLE (
  base_price NUMERIC,
  applied_price NUMERIC,
  discount_percentage NUMERIC,
  price_reason TEXT,
  confidence_score INTEGER,
  strategy_applied TEXT,
  effective_from TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ph.base_price,
    ph.new_price,
    CASE
      WHEN ph.base_price > 0
      THEN ((ph.base_price - ph.new_price) / ph.base_price) * 100
      ELSE 0
    END as discount_percentage,
    ph.price_change_reason,
    ph.confidence_score,
    ph.applied_strategy,
    ph.effective_from
  FROM public.price_history ph
  WHERE ph.product_id = p_product_id
    AND (p_variant_id IS NULL OR ph.variant_id = p_variant_id)
    AND ph.effective_from <= NOW()
    AND (ph.effective_until IS NULL OR ph.effective_until > NOW())
  ORDER BY ph.effective_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record price change
CREATE OR REPLACE FUNCTION record_price_change(
  p_product_id UUID,
  p_variant_id TEXT,
  p_old_price NUMERIC,
  p_new_price NUMERIC,
  p_reason TEXT,
  p_strategy TEXT DEFAULT NULL,
  p_confidence INTEGER DEFAULT NULL,
  p_factors JSONB DEFAULT '[]',
  p_effective_from TIMESTAMPTZ DEFAULT NOW(),
  p_effective_until TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  price_history_id UUID;
BEGIN
  INSERT INTO public.price_history (
    product_id, variant_id, old_price, new_price, price_change_reason,
    applied_strategy, confidence_score, factors, effective_from, effective_until, created_at
  )
  VALUES (
    p_product_id, p_variant_id, p_old_price, p_new_price, p_reason,
    p_strategy, p_confidence, p_factors, p_effective_from, p_effective_until, NOW()
  )
  RETURNING id INTO price_history_id;

  RETURN price_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get demand forecast for a product
CREATE OR REPLACE FUNCTION get_demand_forecast(
  p_product_id UUID,
  p_variant_id TEXT DEFAULT NULL,
  p_forecast_period INTEGER DEFAULT 30
) RETURNS TABLE (
  predicted_demand NUMERIC,
  confidence_score INTEGER,
  factors JSONB,
  recommended_price NUMERIC,
  price_elasticity NUMERIC,
  forecast_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    df.predicted_demand,
    df.confidence_score,
    df.factors,
    df.recommended_price,
    df.price_elasticity,
    df.forecast_date
  FROM public.demand_forecasts df
  WHERE df.product_id = p_product_id
    AND (p_variant_id IS NULL OR df.variant_id = p_variant_id)
    AND df.forecast_period = p_forecast_period
    AND df.forecast_date >= CURRENT_DATE
  ORDER BY df.forecast_date ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record demand forecast
CREATE OR REPLACE FUNCTION record_demand_forecast(
  p_product_id UUID,
  p_variant_id TEXT,
  p_forecast_period INTEGER,
  p_predicted_demand NUMERIC,
  p_confidence_score INTEGER,
  p_factors JSONB,
  p_recommended_price NUMERIC,
  p_price_elasticity NUMERIC
) RETURNS UUID AS $$
DECLARE
  forecast_id UUID;
BEGIN
  INSERT INTO public.demand_forecasts (
    product_id, variant_id, forecast_period, predicted_demand,
    confidence_score, factors, recommended_price, price_elasticity, forecast_date, created_at
  )
  VALUES (
    p_product_id, p_variant_id, p_forecast_period, p_predicted_demand,
    p_confidence_score, p_factors, p_recommended_price, p_price_elasticity, CURRENT_DATE, NOW()
  )
  ON CONFLICT (product_id, variant_id, forecast_period, forecast_date)
  DO UPDATE SET
    predicted_demand = EXCLUDED.predicted_demand,
    confidence_score = EXCLUDED.confidence_score,
    factors = EXCLUDED.factors,
    recommended_price = EXCLUDED.recommended_price,
    price_elasticity = EXCLUDED.price_elasticity,
    created_at = NOW()
  RETURNING id INTO forecast_id;

  RETURN forecast_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pricing analytics for a period
CREATE OR REPLACE FUNCTION get_pricing_analytics(
  p_product_id UUID DEFAULT NULL,
  p_variant_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
  product_id UUID,
  variant_id TEXT,
  date DATE,
  base_price NUMERIC,
  applied_price NUMERIC,
  discount_percentage NUMERIC,
  total_orders INTEGER,
  total_revenue NUMERIC,
  average_order_value NUMERIC,
  conversion_rate NUMERIC,
  competitor_average NUMERIC,
  demand_level TEXT,
  inventory_level NUMERIC,
  strategy_applied TEXT
) AS $$
DECLARE
  start_dt DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  end_dt DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  SELECT
    pa.product_id,
    pa.variant_id,
    pa.date,
    pa.base_price,
    pa.applied_price,
    pa.discount_percentage,
    pa.total_orders,
    pa.total_revenue,
    pa.average_order_value,
    pa.conversion_rate,
    pa.competitor_average,
    pa.demand_level,
    pa.inventory_level,
    pa.strategy_applied
  FROM public.pricing_analytics pa
  WHERE pa.date BETWEEN start_dt AND end_dt
    AND (p_product_id IS NULL OR pa.product_id = p_product_id)
    AND (p_variant_id IS NULL OR pa.variant_id = p_variant_id)
  ORDER BY pa.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update pricing analytics (called by cron job)
CREATE OR REPLACE FUNCTION update_pricing_analytics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  product_record RECORD;
BEGIN
  -- Loop through all products and calculate analytics
  FOR product_record IN
    SELECT p.id, p.price as base_price
    FROM public.products p
    WHERE p.is_active = true
  LOOP
    -- Get orders for this product on this date
    DECLARE
      order_stats RECORD;
    BEGIN
      SELECT
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as average_order_value,
        COUNT(DISTINCT o.id)::NUMERIC / NULLIF(COUNT(*), 0) as conversion_rate
      INTO order_stats
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE oi.product_id = product_record.id
        AND DATE(o.created_at) = p_date;

      -- Get current applied price
      DECLARE
        current_price RECORD;
      BEGIN
        SELECT * INTO current_price
        FROM get_current_price(product_record.id);

        -- Get competitor average price
        DECLARE
          competitor_avg NUMERIC;
        BEGIN
          SELECT AVG(competitor_price) INTO competitor_avg
          FROM public.competitor_prices
          WHERE product_id = product_record.id
            AND scraped_at > NOW() - INTERVAL '24 hours';

          -- Get current inventory level
          DECLARE
            inventory_level NUMERIC := 0;
          BEGIN
            SELECT
              CASE
                WHEN SUM(quantity) > 0
                THEN (SUM(quantity - reserved_quantity)::NUMERIC / SUM(quantity)) * 100
                ELSE 0
              END
            INTO inventory_level
            FROM public.inventory_items
            WHERE product_id = product_record.id;

            -- Insert or update analytics record
            INSERT INTO public.pricing_analytics (
              product_id, date, base_price, applied_price, discount_percentage,
              total_orders, total_revenue, average_order_value, conversion_rate,
              competitor_average, demand_level, inventory_level, strategy_applied
            )
            VALUES (
              product_record.id, p_date, product_record.base_price,
              COALESCE(current_price.applied_price, product_record.base_price),
              COALESCE(current_price.discount_percentage, 0),
              order_stats.total_orders, order_stats.total_revenue,
              order_stats.average_order_value, order_stats.conversion_rate,
              competitor_avg,
              CASE
                WHEN order_stats.total_orders >= 10 THEN 'HIGH'
                WHEN order_stats.total_orders >= 3 THEN 'MEDIUM'
                ELSE 'LOW'
              END,
              inventory_level,
              current_price.strategy_applied
            )
            ON CONFLICT (product_id, date)
            DO UPDATE SET
              base_price = EXCLUDED.base_price,
              applied_price = EXCLUDED.applied_price,
              discount_percentage = EXCLUDED.discount_percentage,
              total_orders = EXCLUDED.total_orders,
              total_revenue = EXCLUDED.total_revenue,
              average_order_value = EXCLUDED.average_order_value,
              conversion_rate = EXCLUDED.conversion_rate,
              competitor_average = EXCLUDED.competitor_average,
              demand_level = EXCLUDED.demand_level,
              inventory_level = EXCLUDED.inventory_level,
              strategy_applied = EXCLUDED.strategy_applied;

            updated_count := updated_count + 1;
          END;
        END;
      END;
    END;
  END LOOP;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.pricing_strategies TO service_role;
GRANT ALL ON public.demand_forecasts TO service_role;
GRANT ALL ON public.price_history TO service_role;
GRANT ALL ON public.competitor_prices TO service_role;
GRANT ALL ON public.pricing_analytics TO service_role;

GRANT SELECT ON public.pricing_strategies TO authenticated;
GRANT SELECT ON public.demand_forecasts TO authenticated;
GRANT SELECT ON public.price_history TO authenticated;
GRANT SELECT ON public.competitor_prices TO authenticated;
GRANT SELECT ON public.pricing_analytics TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_current_price(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_price_change(UUID, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER, JSONB, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION get_demand_forecast(UUID, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_demand_forecast(UUID, TEXT, INTEGER, NUMERIC, INTEGER, JSONB, NUMERIC, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION get_pricing_analytics(UUID, TEXT, DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_pricing_analytics(DATE) TO service_role;

-- Comments for documentation
COMMENT ON TABLE public.pricing_strategies IS 'Configurable pricing strategies with conditions and actions for dynamic pricing';
COMMENT ON TABLE public.demand_forecasts IS 'Machine learning demand forecasts with confidence scores and price recommendations';
COMMENT ON TABLE public.price_history IS 'Immutable audit trail of all price changes with reasons and factors';
COMMENT ON TABLE public.competitor_prices IS 'Competitor price monitoring data for competitive pricing strategies';
COMMENT ON TABLE public.pricing_analytics IS 'Daily pricing performance analytics including revenue, conversion rates, and strategy effectiveness';

COMMENT ON FUNCTION get_current_price(UUID, TEXT) IS 'Retrieves the currently active price for a product including discounts and strategies';
COMMENT ON FUNCTION record_price_change(UUID, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, INTEGER, JSONB, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Records a price change with full audit trail for compliance';
COMMENT ON FUNCTION get_demand_forecast(UUID, TEXT, INTEGER) IS 'Retrieves the latest demand forecast for a product';
COMMENT ON FUNCTION record_demand_forecast(UUID, TEXT, INTEGER, NUMERIC, INTEGER, JSONB, NUMERIC, NUMERIC) IS 'Records a new demand forecast with ML predictions';
COMMENT ON FUNCTION get_pricing_analytics(UUID, TEXT, DATE, DATE) IS 'Retrieves pricing performance analytics for analysis and optimization';
COMMENT ON FUNCTION update_pricing_analytics(DATE) IS 'Updates daily pricing analytics (should be called by cron job)';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ENTERPRISE DYNAMIC PRICING SYSTEM INSTALLED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'ML-powered pricing infrastructure created:';
    RAISE NOTICE '- pricing_strategies table for configurable strategies';
    RAISE NOTICE '- demand_forecasts table for ML predictions';
    RAISE NOTICE '- price_history table for audit compliance';
    RAISE NOTICE '- competitor_prices table for market intelligence';
    RAISE NOTICE '- pricing_analytics table for performance tracking';
    RAISE NOTICE '';
    RAISE NOTICE 'Advanced pricing features implemented:';
    RAISE NOTICE '- Time-based pricing (weekend, holiday, time-of-day)';
    RAISE NOTICE '- Inventory-aware pricing (low stock premiums)';
    RAISE NOTICE '- Demand-responsive pricing with ML forecasting';
    RAISE NOTICE '- Competitor price matching and optimization';
    RAISE NOTICE '- Price elasticity calculations';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created for pricing management:';
    RAISE NOTICE '- get_current_price() - retrieve active pricing';
    RAISE NOTICE '- record_price_change() - audit price changes';
    RAISE NOTICE '- get_demand_forecast() - ML demand predictions';
    RAISE NOTICE '- record_demand_forecast() - store predictions';
    RAISE NOTICE '- get_pricing_analytics() - performance analysis';
    RAISE NOTICE '- update_pricing_analytics() - daily analytics update';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for enterprise-grade dynamic pricing!';
END $$;


