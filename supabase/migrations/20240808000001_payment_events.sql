-- Payment events table for webhook idempotency and auditing
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure idempotency on (provider, event_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_events_provider_event
  ON public.payment_events(provider, event_id);

-- Index for order lookups
CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON public.payment_events(order_id);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access" ON public.payment_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);


