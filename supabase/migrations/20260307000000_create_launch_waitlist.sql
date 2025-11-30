-- Launch waitlist for coming-soon / beta notifications
CREATE TABLE IF NOT EXISTS public.launch_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  name text,
  interest text NOT NULL DEFAULT 'grand_opening' CHECK (interest IN ('grand_opening', 'beta', 'vip_access')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'notified', 'unsubscribed')),
  source text NOT NULL DEFAULT 'coming-soon',
  city text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Avoid duplicate contacts while allowing null values
CREATE UNIQUE INDEX IF NOT EXISTS launch_waitlist_email_key ON public.launch_waitlist(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS launch_waitlist_phone_key ON public.launch_waitlist(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS launch_waitlist_status_interest_idx ON public.launch_waitlist(status, interest);
CREATE INDEX IF NOT EXISTS launch_waitlist_created_idx ON public.launch_waitlist(created_at DESC);

-- Keep updated_at fresh
CREATE TRIGGER update_launch_waitlist_updated_at
  BEFORE UPDATE ON public.launch_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: service role + admins
ALTER TABLE public.launch_waitlist ENABLE ROW LEVEL SECURITY;

DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'launch_waitlist'
      AND policyname = 'Service role full access to launch_waitlist'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Service role full access to launch_waitlist" ON public.launch_waitlist
        FOR ALL TO public
        USING (
          (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
          OR (
            (SELECT auth.uid()) IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role = 'admin'
            )
          )
        )
        WITH CHECK (
          (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
          OR (
            (SELECT auth.uid()) IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role = 'admin'
            )
          )
        )
    $sql$;
  END IF;
END
$policy$;

