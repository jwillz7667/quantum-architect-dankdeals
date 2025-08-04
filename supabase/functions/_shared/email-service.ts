// Email service with Resend integration and rate limiting
import type { Order, EmailJob, EmailResult } from './types.ts';
import { EmailTemplateEngine } from './email-templates.ts';
import { RateLimiter, withRetry, CircuitBreaker } from './utils.ts';
import { logger } from './logger.ts';
import '../_shared/deno-types.d.ts';

interface EmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}

export class EmailService {
  private readonly templates = new EmailTemplateEngine();
  private readonly rateLimiter = new RateLimiter(10, 10, 1000); // 10 requests per second
  private readonly circuitBreaker = new CircuitBreaker('resend-api', 5, 60000);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly adminEmail: string;

  constructor() {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    this.apiKey = apiKey;
    this.fromEmail = Deno.env.get('FROM_EMAIL') || 'orders@dankdealsmn.com';
    this.adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@dankdealsmn.com';
  }

  async sendOrderConfirmation(order: Order): Promise<EmailResult[]> {
    const emails: EmailPayload[] = [];

    // Customer email
    if (order.customer_email && this.isValidEmail(order.customer_email)) {
      emails.push({
        from: `DankDeals <${this.fromEmail}>`,
        to: order.customer_email,
        subject: `Order Confirmed - ${order.order_number}`,
        html: this.templates.generateCustomerOrderConfirmation(order),
        headers: {
          'X-Order-ID': order.id,
          'X-Order-Number': order.order_number,
        },
      });
    }

    // Admin notification
    emails.push({
      from: `DankDeals Orders <${this.fromEmail}>`,
      to: this.adminEmail,
      subject: `🚨 NEW ORDER - ${order.order_number} - $${order.total_amount.toFixed(2)}`,
      html: this.templates.generateAdminOrderNotification(order),
      headers: {
        'X-Order-ID': order.id,
        'X-Order-Number': order.order_number,
        Priority: 'high',
      },
    });

    return this.sendBatch(emails);
  }

  async sendOrderUpdate(order: Order, updateType: string, message: string): Promise<EmailResult> {
    if (!order.customer_email || !this.isValidEmail(order.customer_email)) {
      return { success: false, error: 'Invalid customer email' };
    }

    const email: EmailPayload = {
      from: `DankDeals <${this.fromEmail}>`,
      to: order.customer_email,
      subject: `Order Update - ${order.order_number}`,
      html: this.templates.generateOrderUpdateEmail(order, updateType, message),
    };

    const results = await this.sendBatch([email]);
    return results[0];
  }

  private async sendBatch(emails: EmailPayload[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const email of emails) {
      try {
        const result = await this.sendWithRateLimit(email);
        results.push(result);
      } catch (error) {
        logger.error('Email send failed', error, { to: email.to });
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private async sendWithRateLimit(email: EmailPayload): Promise<EmailResult> {
    await this.rateLimiter.acquire();

    return this.circuitBreaker.execute(() => {
      return withRetry(() => this.sendEmail(email), {
        maxAttempts: 3,
        initialDelay: 1000,
        shouldRetry: (error) => {
          // Retry on network errors or rate limits
          if (error instanceof Error) {
            return (
              error.message.includes('rate limit') ||
              error.message.includes('network') ||
              error.message.includes('timeout')
            );
          }
          return false;
        },
      });
    });
  }

  private async sendEmail(email: EmailPayload): Promise<EmailResult> {
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(email),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        logger.error('Resend API error', undefined, {
          status: response.status,
          error,
          duration,
        });

        // Check for rate limiting
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }

        return {
          success: false,
          error: `Email send failed: ${error}`,
        };
      }

      const data = await response.json();
      logger.info('Email sent successfully', {
        messageId: data.id,
        to: email.to,
        duration,
      });

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Email send exception', error, { duration });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email !== 'guest@example.com';
  }

  // Queue an email for async processing
  async queueEmail(job: Omit<EmailJob, 'id' | 'attempts' | 'status'>): Promise<void> {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase.from('email_queue').insert({
      ...job,
      status: 'pending',
      attempts: 0,
      scheduled_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Failed to queue email', error, { type: job.type });
      throw error;
    }

    logger.info('Email queued', { type: job.type, to: job.to });
  }
}
