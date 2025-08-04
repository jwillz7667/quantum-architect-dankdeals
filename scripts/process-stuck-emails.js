#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function processStuckEmails() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_SERVICE_KEY) {
    console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('Resetting stuck emails from processing to pending...\n');

  try {
    // Reset stuck emails from processing to pending
    const { data: updated, error } = await supabase
      .from('email_queue')
      .update({
        status: 'pending',
        last_attempt_at: new Date().toISOString(),
      })
      .eq('status', 'processing')
      .select();

    if (error) {
      console.error('Error updating emails:', error);
      return;
    }

    if (updated && updated.length > 0) {
      console.log(`Reset ${updated.length} stuck emails to pending status`);
      updated.forEach((email) => {
        console.log(`- ${email.email_type} to ${email.to_email}`);
      });
    } else {
      console.log('No stuck emails found');
    }

    // Now trigger the email processor
    console.log('\nTriggering email processor...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-email-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ action: 'process' }),
    });

    const result = await response.json();
    console.log('Email processor response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

processStuckEmails();
