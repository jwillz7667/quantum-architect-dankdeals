#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function checkEmailQueue() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_SERVICE_KEY) {
    console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('Checking email queue...\n');

  try {
    // Get recent email queue entries
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching email queue:', error);
      return;
    }

    if (!emails || emails.length === 0) {
      console.log('No emails in queue');
      return;
    }

    console.log(`Found ${emails.length} emails in queue:\n`);

    emails.forEach((email, index) => {
      console.log(`${index + 1}. Email ID: ${email.id}`);
      console.log(`   Type: ${email.email_type}`);
      console.log(`   To: ${email.to_email}`);
      console.log(`   Status: ${email.status}`);
      console.log(`   Attempts: ${email.attempts}`);
      console.log(`   Created: ${email.created_at}`);
      if (email.error) {
        console.log(`   Error: ${email.error}`);
      }
      console.log('');
    });

    // Check for pending emails
    const { data: pending, error: pendingError } = await supabase
      .from('email_queue')
      .select('count')
      .eq('status', 'pending');

    if (!pendingError && pending) {
      console.log(`\nTotal pending emails: ${pending[0]?.count || 0}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEmailQueue();
