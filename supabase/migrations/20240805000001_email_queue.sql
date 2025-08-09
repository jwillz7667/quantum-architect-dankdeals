-- Ensure email_queue table exists with expected columns used by edge functions
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb NOT NULL,
  priority TEXT DEFAULT 'normal' NOT NULL CHECK (priority IN ('low','normal','high')),
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending','processing','sent','failed')),
  attempts INT DEFAULT 0 NOT NULL,
  error TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Helpful indexes for processor queries
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON public.email_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority_scheduled ON public.email_queue(priority, scheduled_at) WHERE status = 'pending';

-- RLS (allow service role full access)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'email_queue' AND policyname = 'Service role access'
  ) THEN
    CREATE POLICY "Service role access" ON public.email_queue FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;


