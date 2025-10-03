// SMS queue processor edge function using Twilio
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';
import { logger } from '../_shared/logger.ts';

interface SmsJob {
  id: string;
  order_id: string | null;
  sms_type: string;
  to_phone: string;
  message: string;
  priority: string;
  status: string;
  attempts: number;
  max_attempts: number;
  data: Record<string, unknown>;
}

class TwilioSmsService {
  private accountSid: string;
  private authToken: string;
  private fromPhone: string;

  constructor() {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromPhone) {
      throw new Error('Missing Twilio configuration');
    }

    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromPhone = fromPhone;
  }

  async sendSms(
    to: string,
    body: string
  ): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      // Format phone number (ensure E.164 format)
      const formattedTo = this.formatPhoneNumber(to);

      // Twilio API endpoint
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      // Create authorization header
      const auth = btoa(`${this.accountSid}:${this.authToken}`);

      // Create request body
      const params = new URLSearchParams({
        To: formattedTo,
        From: this.fromPhone,
        Body: body,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Twilio API error', undefined, {
          status: response.status,
          error: data,
        });

        return {
          success: false,
          error: data.message || 'SMS send failed',
        };
      }

      logger.info('SMS sent successfully', {
        sid: data.sid,
        to: formattedTo,
        status: data.status,
      });

      return {
        success: true,
        sid: data.sid,
      };
    } catch (error) {
      logger.error('SMS send exception', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^0-9+]/g, '');

    // Add +1 for US numbers if not present
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = `+1${cleaned}`;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = `+${cleaned}`;
      }
    }

    return cleaned;
  }
}

class SmsQueueProcessor {
  private supabase;
  private smsService: TwilioSmsService;
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

    this.smsService = new TwilioSmsService();
  }

  async processQueue(): Promise<{ processed: number; successful: number; failed: number }> {
    if (this.isProcessing) {
      logger.info('SMS queue processor already running');
      return { processed: 0, successful: 0, failed: 0 };
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      logger.info('Starting SMS queue processing');

      // Get pending SMS ordered by priority and scheduled time
      const { data: jobs, error } = await this.supabase
        .from('sms_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .lt('attempts', this.supabase.from('sms_queue').select('max_attempts'))
        .order('priority', { ascending: false })
        .order('scheduled_at', { ascending: true })
        .limit(20);

      if (error) {
        throw error;
      }

      if (!jobs || jobs.length === 0) {
        logger.debug('No pending SMS in queue');
        return { processed: 0, successful: 0, failed: 0 };
      }

      logger.info(`Processing ${jobs.length} SMS from queue`);

      let successful = 0;
      let failed = 0;

      // Process each SMS
      for (const job of jobs as SmsJob[]) {
        const success = await this.processJob(job);
        if (success) {
          successful++;
        } else {
          failed++;
        }
      }

      const duration = Date.now() - startTime;
      logger.info('SMS queue processing completed', {
        total: jobs.length,
        successful,
        failed,
        duration,
      });

      return { processed: jobs.length, successful, failed };
    } catch (error) {
      logger.error('SMS queue processing failed', error);
      return { processed: 0, successful: 0, failed: 0 };
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job: SmsJob): Promise<boolean> {
    const logContext = { jobId: job.id, type: job.sms_type };
    logger.info('Processing SMS job', logContext);

    try {
      // Mark as processing
      await this.updateJobStatus(job.id, 'processing');

      // Send SMS via Twilio
      const result = await this.smsService.sendSms(job.to_phone, job.message);

      if (result.success) {
        // Mark as sent
        await this.supabase
          .from('sms_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            twilio_sid: result.sid,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        logger.info('SMS job completed', { ...logContext, sid: result.sid });
        return true;
      } else {
        throw new Error(result.error || 'SMS send failed');
      }
    } catch (error) {
      logger.error('SMS job failed', error, logContext);
      await this.handleJobFailure(job, error);
      return false;
    }
  }

  private async updateJobStatus(jobId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('sms_queue')
      .update({
        status,
        last_attempt_at: new Date().toISOString(),
        attempts: this.supabase.rpc('increment', { row_id: jobId }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      logger.error('Failed to update SMS job status', error, { jobId, status });
    }
  }

  private async handleJobFailure(job: SmsJob, error: unknown): Promise<void> {
    const attempts = (job.attempts || 0) + 1;
    const maxAttempts = job.max_attempts || 3;

    if (attempts >= maxAttempts) {
      // Mark as permanently failed
      await this.supabase
        .from('sms_queue')
        .update({
          status: 'failed',
          attempts,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      logger.error('SMS job permanently failed', error, {
        jobId: job.id,
        attempts,
      });
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, attempts), 300000); // Max 5 minutes
      const nextAttempt = new Date(Date.now() + retryDelay);

      await this.supabase
        .from('sms_queue')
        .update({
          status: 'pending',
          attempts,
          scheduled_at: nextAttempt.toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      logger.info('SMS job scheduled for retry', {
        jobId: job.id,
        attempts,
        nextAttempt: nextAttempt.toISOString(),
      });
    }
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  logger.setContext({ correlationId });

  try {
    logger.info('SMS queue processor triggered', {
      method: req.method,
      url: req.url,
    });

    // Verify authorization
    const authToken = req.headers.get('Authorization');
    const expectedToken = Deno.env.get('QUEUE_PROCESSOR_TOKEN');

    if (expectedToken && authToken !== `Bearer ${expectedToken}`) {
      logger.warn('Unauthorized SMS queue processor request');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Verify environment configuration
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER',
    ];

    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        logger.error(`Missing environment variable: ${envVar}`);
        throw new Error('Server configuration error');
      }
    }

    // Process the queue
    const processor = new SmsQueueProcessor();
    const results = await processor.processQueue();

    const duration = Date.now() - startTime;
    logger.info('SMS queue processing completed', {
      ...results,
      duration,
      correlationId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SMS queue processed',
        ...results,
        duration,
        correlationId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('SMS queue processor error', error, {
      duration,
      correlationId,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
        correlationId,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
