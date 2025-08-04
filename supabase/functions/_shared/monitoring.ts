// Monitoring and health check utilities
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { logger } from './logger.ts';
import '../_shared/deno-types.d.ts';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  duration?: number;
}

interface HealthStatus {
  healthy: boolean;
  timestamp: string;
  checks: HealthCheckResult[];
  metrics?: {
    ordersToday?: number;
    pendingEmails?: number;
    failedEmails?: number;
  };
}

export class OrderMonitoring {
  private static supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  static async healthCheck(): Promise<HealthStatus> {
    const checks: HealthCheckResult[] = [];

    // Check database connectivity
    const dbCheck = await this.checkDatabase();
    checks.push(dbCheck);

    // Check email service
    const emailCheck = await this.checkEmailService();
    checks.push(emailCheck);

    // Check queue depth
    const queueCheck = await this.checkQueueDepth();
    checks.push(queueCheck);

    // Get metrics
    const metrics = await this.getMetrics();

    const healthy = checks.every((c) => c.status === 'healthy');

    return {
      healthy,
      timestamp: new Date().toISOString(),
      checks,
      metrics,
    };
  }

  private static async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const { error } = await this.supabase.from('orders').select('count').limit(1);

      if (error) throw error;

      return {
        service: 'database',
        status: 'healthy',
        message: 'Database connection successful',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Database health check failed', error);
      return {
        service: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database check failed',
        duration: Date.now() - startTime,
      };
    }
  }

  private static async checkEmailService(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const apiKey = Deno.env.get('RESEND_API_KEY');
      if (!apiKey) {
        throw new Error('RESEND_API_KEY not configured');
      }

      // Check Resend API health
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok && response.status !== 429) {
        // 429 is rate limit, which means API is working
        throw new Error(`Resend API returned ${response.status}`);
      }

      return {
        service: 'email',
        status: 'healthy',
        message: 'Email service is operational',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Email service health check failed', error);
      return {
        service: 'email',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Email service check failed',
        duration: Date.now() - startTime,
      };
    }
  }

  private static async checkQueueDepth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const { data, error } = await this.supabase
        .from('email_queue')
        .select('status')
        .in('status', ['pending', 'processing']);

      if (error) throw error;

      const queueDepth = data?.length || 0;
      const isHealthy = queueDepth < 100; // Alert if more than 100 pending emails

      return {
        service: 'email_queue',
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: `${queueDepth} emails in queue`,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Queue depth check failed', error);
      return {
        service: 'email_queue',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Queue check failed',
        duration: Date.now() - startTime,
      };
    }
  }

  private static async getMetrics(): Promise<HealthStatus['metrics']> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Orders today
      const { count: ordersToday } = await this.supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Pending emails
      const { count: pendingEmails } = await this.supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Failed emails in last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: failedEmails } = await this.supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('updated_at', yesterday.toISOString());

      return {
        ordersToday: ordersToday || 0,
        pendingEmails: pendingEmails || 0,
        failedEmails: failedEmails || 0,
      };
    } catch (error) {
      logger.error('Failed to get metrics', error);
      return {};
    }
  }

  // Performance tracking
  static trackOrderCreation(orderId: string, duration: number): void {
    logger.info('Order creation tracked', {
      orderId,
      duration,
      performance: {
        category: duration < 1000 ? 'fast' : duration < 3000 ? 'normal' : 'slow',
      },
    });
  }

  static trackEmailStatus(type: string, success: boolean, duration?: number): void {
    logger.info('Email status tracked', {
      type,
      success,
      duration,
    });
  }

  // Alert on critical failures
  static alertCriticalFailure(error: Error, context: Record<string, unknown>): void {
    logger.error('CRITICAL FAILURE', error, {
      ...context,
      severity: 'critical',
      timestamp: new Date().toISOString(),
    });

    // In production, this could trigger PagerDuty, Slack, or other alerting systems
  }
}
