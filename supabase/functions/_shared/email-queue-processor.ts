// Email queue processor for reliable email delivery
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import type { EmailJob, Order } from './types.ts';
import { EmailService } from './email-service.ts';
import { logger } from './logger.ts';
import '../_shared/deno-types.d.ts';

export class EmailQueueProcessor {
  private supabase;
  private emailService: EmailService;
  private isProcessing = false;

  constructor() {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.emailService = new EmailService();
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      logger.info('Queue processor already running');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      logger.info('Starting email queue processing');

      // Get pending emails ordered by priority and scheduled time
      const { data: jobs, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .in('status', ['pending', 'processing'])
        .lte('scheduled_at', new Date().toISOString())
        .lt('attempts', 3)
        .order('priority', { ascending: false })
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (error) {
        throw error;
      }

      if (!jobs || jobs.length === 0) {
        logger.debug('No pending emails in queue');
        return;
      }

      logger.info(`Processing ${jobs.length} emails from queue`);

      // Process emails in parallel with concurrency limit
      const results = await this.processJobsConcurrently(jobs as EmailJob[], 3);

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      const duration = Date.now() - startTime;
      logger.info('Queue processing completed', {
        total: jobs.length,
        successful,
        failed,
        duration,
      });
    } catch (error) {
      logger.error('Queue processing failed', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJobsConcurrently(
    jobs: EmailJob[],
    maxConcurrency: number
  ): Promise<Array<{ jobId: string; success: boolean }>> {
    const results: Array<{ jobId: string; success: boolean }> = [];
    const processing = new Set<Promise<void>>();

    for (const job of jobs) {
      const promise = this.processJob(job).then((success) => {
        results.push({ jobId: job.id!, success });
        processing.delete(promise);
      });

      processing.add(promise);

      if (processing.size >= maxConcurrency) {
        await Promise.race(processing);
      }
    }

    await Promise.all(processing);
    return results;
  }

  private async processJob(job: EmailJob): Promise<boolean> {
    const logContext = { jobId: job.id, type: job.type };
    logger.info('Processing email job', logContext);

    try {
      // Mark as processing
      await this.updateJobStatus(job.id!, 'processing');

      // Load order data if needed
      const order = await this.loadOrderData(job.data.orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Send email based on type
      let success = false;
      const emailType = (job as any).email_type || job.type;
      switch (emailType) {
        case 'ORDER_CONFIRMATION':
        case 'order_confirmation':
          const results = await this.emailService.sendOrderConfirmation(order);
          success = results.some((r) => r.success);
          break;

        case 'ORDER_UPDATE':
          const result = await this.emailService.sendOrderUpdate(
            order,
            job.data.updateType,
            job.data.message
          );
          success = result.success;
          break;

        case 'ADMIN_NOTIFICATION':
          // Send admin-only notification
          const adminResult = await this.sendAdminNotification(order, job.data);
          success = adminResult;
          break;

        default:
          logger.warn('Unknown email type', { type: job.type });
          success = false;
      }

      if (success) {
        await this.markJobComplete(job.id!);
        logger.info('Email job completed', logContext);
        return true;
      } else {
        throw new Error('Email send failed');
      }
    } catch (error) {
      logger.error('Email job failed', error, logContext);
      await this.handleJobFailure(job, error);
      return false;
    }
  }

  private async loadOrderData(orderId: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          products (
            name,
            category,
            thc_content,
            cbd_content,
            strain_type
          )
        )
      `
      )
      .eq('id', orderId)
      .single();

    if (error || !data) {
      logger.error('Failed to load order data', error, { orderId });
      return null;
    }

    return data as Order;
  }

  private async sendAdminNotification(
    order: Order,
    _data: Record<string, unknown>
  ): Promise<boolean> {
    try {
      // Custom admin notification logic
      logger.info('Sending admin notification', { orderId: order.id });
      return true;
    } catch (error) {
      logger.error('Admin notification failed', error);
      return false;
    }
  }

  private async updateJobStatus(jobId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('email_queue')
      .update({
        status,
        last_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to update job status', error, { jobId, status });
    }
  }

  private async markJobComplete(jobId: string): Promise<void> {
    const { error } = await this.supabase
      .from('email_queue')
      .update({
        status: 'sent',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to mark job complete', error, { jobId });
    }
  }

  private async handleJobFailure(job: EmailJob, error: unknown): Promise<void> {
    const attempts = (job.attempts || 0) + 1;
    const maxAttempts = 3; // Fixed max attempts

    if (attempts >= maxAttempts) {
      // Mark as permanently failed
      await this.supabase
        .from('email_queue')
        .update({
          status: 'failed',
          attempts,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      logger.error('Email job permanently failed', error, {
        jobId: job.id,
        attempts,
      });

      // Send alert for critical emails
      if (job.priority === 'high') {
        await this.alertOnFailure(job, error);
      }
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, attempts), 300000); // Max 5 minutes
      const nextAttempt = new Date(Date.now() + retryDelay);

      await this.supabase
        .from('email_queue')
        .update({
          status: 'pending',
          attempts,
          scheduled_at: nextAttempt.toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      logger.info('Email job scheduled for retry', {
        jobId: job.id,
        attempts,
        nextAttempt: nextAttempt.toISOString(),
      });
    }
  }

  private alertOnFailure(job: EmailJob, error: unknown): void {
    // Log critical failure for monitoring
    logger.error('CRITICAL: High priority email failed', error, {
      jobId: job.id,
      type: job.type,
      to: job.to,
    });

    // Could implement additional alerting here (e.g., Slack, PagerDuty)
  }

  // Clean up old completed/failed jobs
  async cleanupOldJobs(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await this.supabase
      .from('email_queue')
      .delete()
      .in('status', ['sent', 'failed'])
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      logger.error('Failed to cleanup old jobs', error);
    } else {
      logger.info('Old email jobs cleaned up', { cutoffDate: cutoffDate.toISOString() });
    }
  }
}
