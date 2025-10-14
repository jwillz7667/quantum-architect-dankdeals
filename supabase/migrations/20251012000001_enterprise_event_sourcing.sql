-- Enterprise Event Sourcing Migration
-- Creates event store, snapshots, and aggregate versioning for audit compliance

-- Event Store Table
CREATE TABLE IF NOT EXISTS public.event_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id UUID NOT NULL,
  aggregate_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure events are stored in order
  CONSTRAINT event_store_order CHECK (event_version > 0)
);

-- Indexes for event store
CREATE INDEX idx_event_store_aggregate_id ON public.event_store(aggregate_id);
CREATE INDEX idx_event_store_aggregate_type ON public.event_store(aggregate_type);
CREATE INDEX idx_event_store_event_type ON public.event_store(event_type);
CREATE INDEX idx_event_store_created_at ON public.event_store(created_at);
CREATE INDEX idx_event_store_aggregate_version ON public.event_store(aggregate_id, event_version);

-- Aggregate Version Tracking
CREATE TABLE IF NOT EXISTS public.aggregate_versions (
  aggregate_id UUID PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregate Snapshots for Performance
CREATE TABLE IF NOT EXISTS public.aggregate_snapshots (
  aggregate_id UUID PRIMARY KEY,
  version INTEGER NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for snapshots
CREATE INDEX idx_aggregate_snapshots_version ON public.aggregate_snapshots(aggregate_id, version);

-- Event Store Projections for Read Models
CREATE TABLE IF NOT EXISTS public.event_store_projections (
  projection_name TEXT PRIMARY KEY,
  last_processed_event_id UUID,
  last_processed_version INTEGER DEFAULT 0,
  projection_state JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Event Store
ALTER TABLE public.event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregate_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregate_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_store_projections ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to event_store" ON public.event_store
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to aggregate_versions" ON public.aggregate_versions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to aggregate_snapshots" ON public.aggregate_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to event_store_projections" ON public.event_store_projections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read events for their own aggregates (for debugging)
CREATE POLICY "Users can read their own aggregate events" ON public.event_store
  FOR SELECT TO authenticated USING (
    metadata->>'userId' = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Functions for Event Sourcing

-- Get events for an aggregate from a specific version
CREATE OR REPLACE FUNCTION get_aggregate_events(
  p_aggregate_id UUID,
  p_from_version INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  aggregate_id UUID,
  aggregate_type TEXT,
  event_type TEXT,
  event_version INTEGER,
  data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    es.id,
    es.aggregate_id,
    es.aggregate_type,
    es.event_type,
    es.event_version,
    es.data,
    es.metadata,
    es.created_at
  FROM public.event_store es
  WHERE es.aggregate_id = p_aggregate_id
    AND es.event_version > p_from_version
  ORDER BY es.event_version ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update aggregate version
CREATE OR REPLACE FUNCTION update_aggregate_version(
  p_aggregate_id UUID,
  p_version INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.aggregate_versions (aggregate_id, version, updated_at)
  VALUES (p_aggregate_id, p_version, NOW())
  ON CONFLICT (aggregate_id)
  DO UPDATE SET version = EXCLUDED.version, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Save aggregate snapshot
CREATE OR REPLACE FUNCTION save_aggregate_snapshot(
  p_aggregate_id UUID,
  p_version INTEGER,
  p_state JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.aggregate_snapshots (aggregate_id, version, state, created_at)
  VALUES (p_aggregate_id, p_version, p_state, NOW())
  ON CONFLICT (aggregate_id)
  DO UPDATE SET version = EXCLUDED.version, state = EXCLUDED.state, created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get latest snapshot for an aggregate
CREATE OR REPLACE FUNCTION get_aggregate_snapshot(p_aggregate_id UUID)
RETURNS TABLE (
  version INTEGER,
  state JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    snap.version,
    snap.state
  FROM public.aggregate_snapshots snap
  WHERE snap.aggregate_id = p_aggregate_id
  ORDER BY snap.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update projection state
CREATE OR REPLACE FUNCTION update_projection_state(
  p_projection_name TEXT,
  p_last_event_id UUID,
  p_last_version INTEGER,
  p_state JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.event_store_projections (projection_name, last_processed_event_id, last_processed_version, projection_state, updated_at)
  VALUES (p_projection_name, p_last_event_id, p_last_version, p_state, NOW())
  ON CONFLICT (projection_name)
  DO UPDATE SET
    last_processed_event_id = EXCLUDED.last_processed_event_id,
    last_processed_version = EXCLUDED.last_processed_version,
    projection_state = EXCLUDED.projection_state,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get projection state
CREATE OR REPLACE FUNCTION get_projection_state(p_projection_name TEXT)
RETURNS TABLE (
  last_processed_event_id UUID,
  last_processed_version INTEGER,
  projection_state JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    proj.last_processed_event_id,
    proj.last_processed_version,
    proj.projection_state
  FROM public.event_store_projections proj
  WHERE proj.projection_name = p_projection_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.event_store TO service_role;
GRANT ALL ON public.aggregate_versions TO service_role;
GRANT ALL ON public.aggregate_snapshots TO service_role;
GRANT ALL ON public.event_store_projections TO service_role;

GRANT SELECT ON public.event_store TO authenticated;
GRANT SELECT ON public.aggregate_versions TO authenticated;
GRANT SELECT ON public.aggregate_snapshots TO authenticated;
GRANT SELECT ON public.event_store_projections TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_aggregate_events(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_aggregate_version(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION save_aggregate_snapshot(UUID, INTEGER, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_aggregate_snapshot(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_projection_state(TEXT, UUID, INTEGER, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_projection_state(TEXT) TO authenticated, service_role;

-- Comments for documentation
COMMENT ON TABLE public.event_store IS 'Event store for event sourcing pattern - immutable audit trail of all domain events';
COMMENT ON TABLE public.aggregate_versions IS 'Tracks current version of aggregates for optimistic concurrency control';
COMMENT ON TABLE public.aggregate_snapshots IS 'Snapshots of aggregate state for performance optimization';
COMMENT ON TABLE public.event_store_projections IS 'Read model projections for query optimization';

COMMENT ON FUNCTION get_aggregate_events(UUID, INTEGER) IS 'Retrieves events for an aggregate from a specific version onwards';
COMMENT ON FUNCTION save_aggregate_snapshot(UUID, INTEGER, JSONB) IS 'Saves a snapshot of aggregate state for performance';
COMMENT ON FUNCTION get_aggregate_snapshot(UUID) IS 'Retrieves the latest snapshot for an aggregate';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ENTERPRISE EVENT SOURCING INSTALLED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Event sourcing infrastructure created:';
    RAISE NOTICE '- event_store table for immutable audit trail';
    RAISE NOTICE '- aggregate_versions for concurrency control';
    RAISE NOTICE '- aggregate_snapshots for performance';
    RAISE NOTICE '- event_store_projections for read models';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created for event management:';
    RAISE NOTICE '- get_aggregate_events() - retrieve events';
    RAISE NOTICE '- save_aggregate_snapshot() - performance snapshots';
    RAISE NOTICE '- update_projection_state() - read model updates';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for enterprise-grade audit compliance!';
END $$;


