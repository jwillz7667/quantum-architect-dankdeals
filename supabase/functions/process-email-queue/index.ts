// @ts-ignore - Deno types
/// <reference types="https://deno.land/x/types/index.d.ts" />

// @ts-ignore - Deno module
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno module
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

declare const Deno: any;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailQueueItem {
  id: string;
  order_id: string;
  email_type: string;
  status: string;
  attempts: number;
  last_attempt_at?: string | null;
  sent_at?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

interface ProcessResult {
  id: string;
  status: string;
  error?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Get pending emails from queue
    const { data: pendingEmails, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10)

    if (queueError) {
      throw new Error(`Failed to fetch email queue: ${queueError.message}`)
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results: ProcessResult[] = []

    for (const emailJob of pendingEmails as EmailQueueItem[]) {
      try {
        // Update status to processing
        await supabase
          .from('email_queue')
          .update({ 
            status: 'processing',
            attempts: emailJob.attempts + 1,
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', emailJob.id)

        // Call the send-order-emails function
        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order-emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ orderId: emailJob.order_id })
        })

        if (response.ok) {
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', emailJob.id)

          results.push({ id: emailJob.id, status: 'sent' })
        } else {
          const error = await response.text()
          
          // Mark as failed if max attempts reached
          const status = emailJob.attempts >= 2 ? 'failed' : 'pending'
          
          await supabase
            .from('email_queue')
            .update({ 
              status,
              error_message: error
            })
            .eq('id', emailJob.id)

          results.push({ id: emailJob.id, status, error })
        }
      } catch (error) {
        // Handle individual email errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        await supabase
          .from('email_queue')
          .update({ 
            status: emailJob.attempts >= 2 ? 'failed' : 'pending',
            error_message: errorMessage
          })
          .eq('id', emailJob.id)

        results.push({ id: emailJob.id, status: 'error', error: errorMessage })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing email queue:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 