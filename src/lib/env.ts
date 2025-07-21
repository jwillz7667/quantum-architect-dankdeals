/**
 * Environment configuration with proper TypeScript types
 * All environment variables are accessed using bracket notation for strict mode compliance
 */

type Environment = 'development' | 'staging' | 'production';

export interface AppEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_ADMIN_EMAIL: string;
  VITE_ENV: Environment;
  VITE_PLAUSIBLE_DOMAIN?: string;
  VITE_PLAUSIBLE_API_HOST?: string;
  VITE_SITE_URL?: string;
}

/**
 * Validates that required environment variables are present
 */
function _validateEnvironment(): void {
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

  const missing = requiredVars.filter((varName) => {
    const value = import.meta.env[varName] as string | undefined;
    return !value || typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }
}

/**
 * Gets the current environment
 */
function getCurrentEnvironment(): Environment {
  const envValue = import.meta.env['VITE_ENV'] as string | undefined;

  if (envValue === 'production' || envValue === 'staging' || envValue === 'development') {
    return envValue;
  }

  return 'development';
}

/**
 * Check if environment is properly configured for Supabase
 */
export function isEnvironmentConfigured(): boolean {
  try {
    return (
      !!(import.meta.env['VITE_SUPABASE_URL'] as string | undefined) &&
      !!(import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined)
    );
  } catch {
    return false;
  }
}

// Export the validated environment configuration
export const env: AppEnv = {
  VITE_SUPABASE_URL: (import.meta.env['VITE_SUPABASE_URL'] as string) || '',
  VITE_SUPABASE_ANON_KEY: (import.meta.env['VITE_SUPABASE_ANON_KEY'] as string) || '',
  VITE_ADMIN_EMAIL: (import.meta.env['VITE_ADMIN_EMAIL'] as string) || 'admin@dankdealsmn.com',
  VITE_ENV: getCurrentEnvironment(),
  VITE_PLAUSIBLE_DOMAIN: import.meta.env['VITE_PLAUSIBLE_DOMAIN'] as string | undefined,
  VITE_PLAUSIBLE_API_HOST: import.meta.env['VITE_PLAUSIBLE_API_HOST'] as string | undefined,
  VITE_SITE_URL: import.meta.env['VITE_SITE_URL'] as string | undefined,
};

export default env;
