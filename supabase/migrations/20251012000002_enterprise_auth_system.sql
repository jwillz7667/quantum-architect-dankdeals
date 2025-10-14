-- Enterprise Authentication System Migration
-- Advanced auth tables for enterprise-grade security and compliance

-- User Sessions Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_verified BOOLEAN DEFAULT false,

  -- Ensure only one active session per device per user
  CONSTRAINT unique_user_device_session UNIQUE (user_id, device_id, is_active)
);

-- Indexes for sessions
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active, expires_at);
CREATE INDEX idx_user_sessions_risk_score ON public.user_sessions(risk_score DESC);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity DESC);

-- Two-Factor Authentication Table
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  secret TEXT NOT NULL, -- TOTP secret (encrypted)
  backup_codes JSONB NOT NULL, -- Array of hashed backup codes
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authentication Events Table (for audit compliance)
CREATE TABLE IF NOT EXISTS public.auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'TWO_FACTOR_SETUP', 'TWO_FACTOR_VERIFY', 'RISK_ALERT')),
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Partition by month for performance (if using PostgreSQL partitioning)
  -- PARTITION BY RANGE (timestamp)
);

-- Indexes for auth events
CREATE INDEX idx_auth_events_user_id ON public.auth_events(user_id);
CREATE INDEX idx_auth_events_timestamp ON public.auth_events(timestamp DESC);
CREATE INDEX idx_auth_events_event_type ON public.auth_events(event_type, success);
CREATE INDEX idx_auth_events_ip_address ON public.auth_events(ip_address);

-- Add 2FA columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_location JSONB,
ADD COLUMN IF NOT EXISTS compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'verified', 'rejected', 'expired'));

-- Add risk assessment columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
ADD COLUMN IF NOT EXISTS last_risk_assessment_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS security_flags JSONB DEFAULT '[]';

-- RLS Policies for Auth Tables
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Users can access their own sessions and auth events
CREATE POLICY "Users can access their own sessions" ON public.user_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can access their own 2FA data" ON public.two_factor_auth
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can access their own auth events" ON public.auth_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Admins can access all auth data
CREATE POLICY "Admins can access all auth data" ON public.user_sessions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can access all 2FA data" ON public.two_factor_auth
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can access all auth events" ON public.auth_events
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access to auth tables" ON public.user_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to 2FA data" ON public.two_factor_auth
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to auth events" ON public.auth_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Functions for Auth Management

-- Clean up expired sessions (should be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.user_sessions
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user risk assessment data
CREATE OR REPLACE FUNCTION get_user_risk_assessment(p_user_id UUID)
RETURNS TABLE (
  risk_score INTEGER,
  last_assessment TIMESTAMPTZ,
  security_flags JSONB,
  recent_failed_logins INTEGER,
  unusual_activity_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.risk_score,
    p.last_risk_assessment_at,
    p.security_flags,
    (
      SELECT COUNT(*)
      FROM public.auth_events ae
      WHERE ae.user_id = p_user_id
        AND ae.event_type = 'LOGIN'
        AND ae.success = false
        AND ae.timestamp > NOW() - INTERVAL '24 hours'
    ) as recent_failed_logins,
    (
      SELECT COUNT(*)
      FROM public.auth_events ae
      WHERE ae.user_id = p_user_id
        AND ae.event_type = 'RISK_ALERT'
        AND ae.timestamp > NOW() - INTERVAL '7 days'
    ) as unusual_activity_count
  FROM public.profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record authentication event
CREATE OR REPLACE FUNCTION record_auth_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_session_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.auth_events (user_id, event_type, session_id, ip_address, user_agent, success, metadata, timestamp)
  VALUES (p_user_id, p_event_type, p_session_id, p_ip_address, p_user_agent, p_success, p_metadata, NOW())
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get security metrics for dashboard
CREATE OR REPLACE FUNCTION get_security_metrics()
RETURNS TABLE (
  total_users INTEGER,
  active_sessions INTEGER,
  failed_logins_24h INTEGER,
  two_factor_enabled_users INTEGER,
  average_risk_score NUMERIC,
  high_risk_users INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.user_sessions WHERE is_active = true AND expires_at > NOW()) as active_sessions,
    (SELECT COUNT(*) FROM public.auth_events WHERE event_type = 'LOGIN' AND success = false AND timestamp > NOW() - INTERVAL '24 hours') as failed_logins_24h,
    (SELECT COUNT(*) FROM public.profiles WHERE two_factor_enabled = true) as two_factor_enabled_users,
    (SELECT AVG(risk_score) FROM public.user_sessions WHERE created_at > NOW() - INTERVAL '24 hours') as average_risk_score,
    (SELECT COUNT(*) FROM public.profiles WHERE risk_score >= 60) as high_risk_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.user_sessions TO service_role;
GRANT ALL ON public.two_factor_auth TO service_role;
GRANT ALL ON public.auth_events TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.two_factor_auth TO authenticated;
GRANT SELECT ON public.auth_events TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_risk_assessment(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_auth_event(UUID, TEXT, UUID, INET, TEXT, BOOLEAN, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_security_metrics() TO authenticated, service_role;

-- Comments for documentation
COMMENT ON TABLE public.user_sessions IS 'Stores active user sessions with risk assessment and security metadata for enterprise-grade authentication';
COMMENT ON TABLE public.two_factor_auth IS 'Two-factor authentication data including TOTP secrets and backup codes for enhanced security';
COMMENT ON TABLE public.auth_events IS 'Immutable audit trail of all authentication events for compliance and security monitoring';

COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Cleans up expired user sessions (should be called by cron job)';
COMMENT ON FUNCTION get_user_risk_assessment(UUID) IS 'Retrieves comprehensive risk assessment data for a user';
COMMENT ON FUNCTION record_auth_event(UUID, TEXT, UUID, INET, TEXT, BOOLEAN, JSONB) IS 'Records authentication events for audit trail';
COMMENT ON FUNCTION get_security_metrics() IS 'Retrieves security metrics for dashboard and monitoring';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ENTERPRISE AUTHENTICATION SYSTEM INSTALLED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Advanced authentication infrastructure created:';
    RAISE NOTICE '- user_sessions table for session management';
    RAISE NOTICE '- two_factor_auth table for 2FA support';
    RAISE NOTICE '- auth_events table for audit compliance';
    RAISE NOTICE '';
    RAISE NOTICE 'Enhanced profiles table with:';
    RAISE NOTICE '- password_hash for secure storage';
    RAISE NOTICE '- two_factor_enabled flag';
    RAISE NOTICE '- risk_score and compliance_status';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created for auth management:';
    RAISE NOTICE '- cleanup_expired_sessions() - session cleanup';
    RAISE NOTICE '- get_user_risk_assessment() - risk analysis';
    RAISE NOTICE '- record_auth_event() - audit logging';
    RAISE NOTICE '- get_security_metrics() - monitoring data';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for enterprise-grade authentication!';
END $$;


