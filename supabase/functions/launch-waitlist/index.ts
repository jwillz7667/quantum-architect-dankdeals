import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';
import { logger } from '../_shared/logger.ts';
import '../_shared/deno-types.d.ts';

type WaitlistInterest = 'grand_opening' | 'beta' | 'vip_access';

interface WaitlistRequest {
  email?: string;
  phone?: string;
  name?: string;
  city?: string;
  notes?: string;
  interest?: WaitlistInterest | string;
  source?: string;
  path?: string;
}

interface WaitlistRecord {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  interest: WaitlistInterest;
  status: string;
  source: string;
  city: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_INTERESTS: WaitlistInterest[] = ['grand_opening', 'beta', 'vip_access'];

function cleanText(value: unknown, maxLength = 160): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.trim().slice(0, maxLength);
}

function normalizePhone(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/[^\d]/g, '');
}

function formatPhoneE164(phone: string): string | null {
  if (!phone) return null;
  if (phone.startsWith('+')) return phone;
  if (phone.length === 10) return `+1${phone}`;
  if (phone.length === 11 && phone.startsWith('1')) return `+${phone}`;
  return `+${phone}`;
}

async function sendEmail(
  apiKey: string,
  fromEmail: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `DankDeals <${fromEmail}>`,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Resend email send failed', undefined, { to, status: response.status, errorText });
    return false;
  }

  return true;
}

function buildUserEmailHtml(name: string | undefined, interest: WaitlistInterest): string {
  const headline =
    interest === 'beta'
      ? 'You are on the DankDeals beta list'
      : 'You are on the DankDeals launch list';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headline}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1115; color: #e5f5d6; margin: 0; padding: 0; }
    .wrapper { max-width: 620px; margin: 0 auto; padding: 24px 20px 40px; }
    .card { background: radial-gradient(circle at 20% 20%, rgba(109,212,0,0.08), transparent 35%), #1c1f26; border: 1px solid #2e343f; border-radius: 18px; padding: 28px; box-shadow: 0 10px 40px rgba(0,0,0,0.35); }
    .badge { display: inline-block; background: rgba(109,212,0,0.12); border: 1px solid rgba(109,212,0,0.35); color: #c9f58a; padding: 6px 12px; border-radius: 999px; font-size: 12px; letter-spacing: 0.02em; }
    .cta { display: inline-block; margin-top: 22px; padding: 14px 18px; background: linear-gradient(135deg, #6dd400, #5ab700); color: #0f1115; border-radius: 12px; font-weight: 700; text-decoration: none; }
    p { line-height: 1.6; color: #d8dfd0; }
    h1 { color: #f4ffe8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="badge">DankDeals Insider</div>
      <h1 style="margin-top: 18px; margin-bottom: 12px;">${headline}</h1>
      <p>Hey${name ? ` ${name}` : ''},</p>
      <p>Thanks for raising your hand. We will reach out with grand opening news, early beta invites, and limited drops as we get closer.</p>
      <p style="margin: 18px 0; padding: 14px; border-radius: 12px; background: rgba(109,212,0,0.08); border: 1px solid rgba(109,212,0,0.2); color: #d8dfd0;">
        You will hear from us on ${interest === 'beta' ? 'beta access and soft launches first.' : 'our opening timeline, early deals, and drop alerts.'}
      </p>
      <p>Want to talk to a human? Reply here and we will get back fast.</p>
      <a class="cta" href="https://dankdealsmn.com">See what we are building</a>
    </div>
  </div>
</body>
</html>
`;
}

function buildAdminEmailHtml(record: WaitlistRecord): string {
  const meta = record.metadata || {};
  const userAgent = typeof meta['userAgent'] === 'string' ? meta['userAgent'] : '';
  const referer = typeof meta['referer'] === 'string' ? meta['referer'] : '';
  const ip = typeof meta['ip'] === 'string' ? meta['ip'] : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New launch waitlist signup</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1115; color: #e5f5d6; margin: 0; padding: 0; }
    .wrapper { max-width: 640px; margin: 0 auto; padding: 24px 20px 40px; }
    .card { background: #1c1f26; border: 1px solid #2e343f; border-radius: 16px; padding: 24px; color: #d8dfd0; }
    .row { margin: 10px 0; }
    .label { color: #9fb7a3; font-size: 13px; letter-spacing: 0.02em; text-transform: uppercase; }
    .value { font-weight: 600; color: #f4ffe8; }
    .pill { display: inline-block; padding: 6px 12px; border-radius: 999px; background: rgba(109,212,0,0.12); border: 1px solid rgba(109,212,0,0.25); color: #c9f58a; font-size: 12px; }
    ul { padding-left: 18px; color: #c8d7c6; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px;">
        <h2 style="margin: 0; color: #f4ffe8;">New Launch Signup</h2>
        <span class="pill">${record.interest}</span>
      </div>
      <div class="row">
        <div class="label">Email</div>
        <div class="value">${record.email ?? 'n/a'}</div>
      </div>
      <div class="row">
        <div class="label">Phone</div>
        <div class="value">${record.phone ?? 'n/a'}</div>
      </div>
      <div class="row">
        <div class="label">Name</div>
        <div class="value">${record.name ?? 'n/a'}</div>
      </div>
      <div class="row">
        <div class="label">City</div>
        <div class="value">${record.city ?? 'n/a'}</div>
      </div>
      <div class="row">
        <div class="label">Source</div>
        <div class="value">${record.source}</div>
      </div>
      ${
        record.notes
          ? `
      <div class="row">
        <div class="label">Notes</div>
        <div class="value">${record.notes}</div>
      </div>`
          : ''
      }
      <div class="row" style="margin-top: 16px;">
        <div class="label">Metadata</div>
        <ul>
      ${userAgent ? `<li>User Agent: ${userAgent}</li>` : ''}
          ${referer ? `<li>Referrer: ${referer}</li>` : ''}
          ${ip ? `<li>IP: ${ip}</li>` : ''}
        </ul>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  logger.setContext({ correlationId });

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const payload = (await req.json().catch(() => ({}))) as WaitlistRequest;
    const email = cleanText(payload.email)?.toLowerCase();
    const phoneRaw = normalizePhone(payload.phone);
    const phone = phoneRaw ? (formatPhoneE164(phoneRaw) ?? phoneRaw) : undefined;

    if (!email && !phone) {
      return new Response(JSON.stringify({ success: false, error: 'Email or phone is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid email address' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (phoneRaw && phoneRaw.length < 10) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid phone number' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const interest = ALLOWED_INTERESTS.includes(payload.interest as WaitlistInterest)
      ? (payload.interest as WaitlistInterest)
      : 'grand_opening';
    const name = cleanText(payload.name, 80);
    const city = cleanText(payload.city, 80);
    const notes = cleanText(payload.notes, 400);
    const source = cleanText(payload.source, 80) ?? 'coming-soon';

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase environment variables are not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const filters = [];
    if (email) filters.push(`email.eq.${email}`);
    if (phone) filters.push(`phone.eq.${phone}`);

    let existing: WaitlistRecord | null = null;
    if (filters.length > 0) {
      const { data: existingRow, error: existingError } = await supabase
        .from('launch_waitlist')
        .select('*')
        .or(filters.join(','))
        .maybeSingle();

      if (existingError) {
        logger.error('Lookup failed', existingError);
      } else {
        existing = existingRow as WaitlistRecord | null;
      }
    }

    const metadata = {
      userAgent: req.headers.get('user-agent') ?? '',
      referer: req.headers.get('referer') ?? payload.path ?? '',
      ip: req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for') ?? '',
      submitted_from: payload.path ?? '',
      source,
      last_submission_at: new Date().toISOString(),
    };

    let record: WaitlistRecord | null = null;
    let alreadyRegistered = false;

    if (existing) {
      const mergedMetadata = { ...(existing.metadata ?? {}), ...metadata };
      const { data, error } = await supabase
        .from('launch_waitlist')
        .update({
          email: email ?? existing.email,
          phone: phone ?? existing.phone,
          name: name ?? existing.name,
          city: city ?? existing.city,
          interest,
          source,
          notes: notes ?? existing.notes,
          metadata: mergedMetadata,
          status: existing.status ?? 'pending',
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      record = data as WaitlistRecord;
      alreadyRegistered = true;
    } else {
      const { data, error } = await supabase
        .from('launch_waitlist')
        .insert({
          email: email ?? null,
          phone: phone ?? null,
          name: name ?? null,
          city: city ?? null,
          interest,
          source,
          notes: notes ?? null,
          metadata,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          alreadyRegistered = true;
        } else {
          throw error;
        }
      } else {
        record = data as WaitlistRecord;
      }
    }

    // Fetch record if we hit a unique constraint race
    if (!record) {
      const { data } = await supabase
        .from('launch_waitlist')
        .select('*')
        .or(filters.join(','))
        .maybeSingle();
      record = data as WaitlistRecord | null;
    }

    let adminEmailSent = false;
    let userEmailSent = false;
    let emailWarning: string | undefined;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'orders@dankdealsmn.com';
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || fromEmail;

    if (!resendApiKey) {
      emailWarning = 'RESEND_API_KEY not configured; email was skipped.';
    } else if (record) {
      try {
        adminEmailSent = await sendEmail(
          resendApiKey,
          fromEmail,
          adminEmail,
          `New launch waitlist signup (${record.interest})`,
          buildAdminEmailHtml(record)
        );
      } catch (error) {
        logger.error('Admin email send failed', error);
        emailWarning = 'Admin email failed';
      }

      if (record.email) {
        try {
          userEmailSent = await sendEmail(
            resendApiKey,
            fromEmail,
            record.email,
            'You are on the DankDeals launch list',
            buildUserEmailHtml(record.name ?? undefined, record.interest)
          );
        } catch (error) {
          logger.error('User email send failed', error);
          emailWarning = 'User email failed';
        }
      }
    }

    const responseBody = {
      success: true,
      message: alreadyRegistered
        ? 'You are already on the list. We will keep you posted.'
        : 'You are on the list. We will share launch updates soon.',
      alreadyRegistered,
      contactId: record?.id,
      adminEmailSent,
      userEmailSent,
      emailWarning,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    logger.error('Waitlist signup failed', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
