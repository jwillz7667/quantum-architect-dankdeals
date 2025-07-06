import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Required variables
  VITE_SUPABASE_URL: z.string().url().min(1),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_ADMIN_EMAIL: z.string().email().default('admin@dankdealsmn.com'),
  VITE_ENV: z.enum(['development', 'staging', 'production']).default('production'),

  // Optional analytics
  VITE_PLAUSIBLE_DOMAIN: z.string().optional(),
  VITE_PLAUSIBLE_API_HOST: z.string().url().optional(),

  // Optional error tracking
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_SENTRY_ENVIRONMENT: z.string().optional(),
});

// Validate environment variables
export const validateEnv = () => {
  try {
    const env = envSchema.parse(import.meta.env);

    // Additional production checks
    if (env.VITE_ENV === 'production') {
      // Ensure we're not using placeholder values
      if (
        env.VITE_SUPABASE_URL.includes('your-project') ||
        env.VITE_SUPABASE_URL.includes('example') ||
        env.VITE_SUPABASE_ANON_KEY.includes('your-') ||
        env.VITE_SUPABASE_ANON_KEY.includes('example')
      ) {
        throw new Error('Production environment detected but using placeholder credentials');
      }

      // Warn about missing optional services
      if (!env.VITE_PLAUSIBLE_DOMAIN) {
        console.warn('⚠️ Analytics not configured (VITE_PLAUSIBLE_DOMAIN missing)');
      }

      if (!env.VITE_SENTRY_DSN) {
        console.warn('⚠️ Error tracking not configured (VITE_SENTRY_DSN missing)');
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Environment validation error:', error);
    }

    // In production, fail fast
    if (import.meta.env.PROD) {
      throw new Error('Invalid environment configuration');
    }

    // In development, return defaults
    return {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_ADMIN_EMAIL: 'admin@dankdealsmn.com',
      VITE_ENV: 'development' as const,
    };
  }
};

// Export validated environment
export const env = validateEnv();

// Type-safe environment access
export type Env = z.infer<typeof envSchema>;
