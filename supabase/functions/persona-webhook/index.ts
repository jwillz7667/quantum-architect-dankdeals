import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

declare const Deno: { env: { get(key: string): string | undefined } };

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const WEBHOOK_SECRET = Deno.env.get('PERSONA_WEBHOOK_SECRET');

    const signature = req.headers.get('persona-signature');
    if (WEBHOOK_SECRET && !signature) {
      return new Response('unauthorized', { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const event = body?.data?.attributes?.name; // e.g., inquiry.completed
    const status = body?.data?.attributes?.status; // e.g., approved / declined
    const referenceId = body?.data?.attributes?.referenceId;

    if (!referenceId) return new Response('ok', { status: 200, headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (event === 'inquiry.completed') {
      const approved = status === 'approved';
      // Save to profiles: age_verified & age_verified_at
      await supabase
        .from('profiles')
        .update({ age_verified: approved, age_verified_at: new Date().toISOString() })
        .eq('id', referenceId);
    }

    return new Response('ok', { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
});
