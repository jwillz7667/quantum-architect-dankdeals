import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/lib/env';
import { performHealthCheck } from '@/utils/healthCheck';

interface HealthStatus {
  status: 'checking' | 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    environment: boolean;
    supabase: boolean;
    database: boolean;
    auth: boolean;
    modules: boolean;
  };
  details?: Record<string, unknown>;
  error?: string;
}

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'checking',
    timestamp: new Date().toISOString(),
    checks: {
      environment: false,
      supabase: false,
      database: false,
      auth: false,
      modules: false,
    },
  });

  useEffect(() => {
    void checkHealth();
  }, []);

  const checkHealth = async () => {
    const startTime = Date.now();
    const results: HealthStatus = {
      status: 'checking',
      timestamp: new Date().toISOString(),
      checks: {
        environment: false,
        supabase: false,
        database: false,
        auth: false,
        modules: false,
      },
      details: {},
    };

    try {
      // Check environment variables
      results.checks.environment = !!(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
      if (results.details) {
        results.details.environment = {
          mode: env.VITE_ENV,
          hasSupabaseUrl: !!env.VITE_SUPABASE_URL,
          hasSupabaseKey: !!env.VITE_SUPABASE_ANON_KEY,
        };
      }

      // Check module imports
      const moduleCheck = performHealthCheck();
      results.checks.modules = moduleCheck.status === 'healthy';
      if (results.details) {
        results.details.modules = moduleCheck;
      }

      // Check Supabase connection
      try {
        const { error: pingError } = await supabase.from('profiles').select('count').limit(1);
        results.checks.supabase = !pingError;
        if (results.details) {
          results.details.supabase = { error: pingError?.message };
        }
      } catch (_error) {
        results.checks.supabase = false;
        if (results.details) {
          results.details.supabase = { error: 'Connection failed' };
        }
      }

      // Check database access
      try {
        const { error: dbError } = await supabase.from('categories').select('id').limit(1);
        results.checks.database = !dbError;
        if (results.details) {
          results.details.database = { error: dbError?.message };
        }
      } catch (_error) {
        results.checks.database = false;
        if (results.details) {
          results.details.database = { error: 'Database query failed' };
        }
      }

      // Check auth service
      try {
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();
        results.checks.auth = !authError;
        if (results.details) {
          results.details.auth = {
            hasSession: !!session,
            error: authError?.message,
          };
        }
      } catch (_error) {
        results.checks.auth = false;
        if (results.details) {
          results.details.auth = { error: 'Auth service unreachable' };
        }
      }

      // Calculate overall status
      const checkValues = Object.values(results.checks);
      const passedChecks = checkValues.filter(Boolean).length;
      const totalChecks = checkValues.length;

      if (passedChecks === totalChecks) {
        results.status = 'healthy';
      } else if (passedChecks >= totalChecks * 0.7) {
        results.status = 'degraded';
      } else {
        results.status = 'unhealthy';
      }

      if (results.details) {
        results.details.performance = {
          checkDuration: Date.now() - startTime,
        };
      }
    } catch (error) {
      results.status = 'unhealthy';
      results.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setHealth(results);
  };

  // Simple text response for monitoring tools
  if (window.location.search.includes('format=simple')) {
    return (
      <pre style={{ fontFamily: 'monospace', margin: '20px' }}>{health.status.toUpperCase()}</pre>
    );
  }

  // JSON response for API monitoring
  if (window.location.search.includes('format=json')) {
    return (
      <pre style={{ fontFamily: 'monospace', margin: '20px' }}>
        {JSON.stringify(health, null, 2)}
      </pre>
    );
  }

  // Default HTML view
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">System Health Check</h1>

      <div
        className={`p-4 rounded-lg mb-6 ${
          health.status === 'healthy'
            ? 'bg-green-100 text-green-800'
            : health.status === 'degraded'
              ? 'bg-yellow-100 text-yellow-800'
              : health.status === 'unhealthy'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
        }`}
      >
        <p className="text-lg font-semibold">Status: {health.status.toUpperCase()}</p>
        <p className="text-sm">Last checked: {health.timestamp}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Service Checks</h2>

        {Object.entries(health.checks).map(([service, status]) => (
          <div key={service} className="flex items-center justify-between p-3 border rounded">
            <span className="capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className={status ? 'text-green-600' : 'text-red-600'}>
              {status ? '✓ Operational' : '✗ Failed'}
            </span>
          </div>
        ))}
      </div>

      {env.VITE_ENV === 'development' && health.details && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-gray-600">
            Debug Information (Development Only)
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(health.details, null, 2)}
          </pre>
        </details>
      )}

      {health.error && (
        <div className="mt-6 p-4 bg-red-100 text-red-800 rounded">
          <p className="font-semibold">Error:</p>
          <p>{health.error}</p>
        </div>
      )}
    </div>
  );
}
