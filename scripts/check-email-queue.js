import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkEmailQueue() {
  console.log('Checking email queue...\n');

  // Get recent emails
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
    console.log(`Email ${index + 1}:`);
    console.log(`  ID: ${email.id}`);
    console.log(`  Type: ${email.type}`);
    console.log(`  To: ${email.to || email.to_email || 'N/A'}`);
    console.log(`  Subject: ${email.subject || 'N/A'}`);
    console.log(`  Status: ${email.status}`);
    console.log(`  Priority: ${email.priority || 'normal'}`);
    console.log(`  Attempts: ${email.attempts || 0}`);
    console.log(`  Created: ${new Date(email.created_at).toLocaleString()}`);
    if (email.data?.orderId) {
      console.log(`  Order ID: ${email.data.orderId}`);
    }
    console.log('');
  });

  // Check processing stats
  const statusCounts = emails.reduce((acc, email) => {
    acc[email.status] = (acc[email.status] || 0) + 1;
    return acc;
  }, {});

  console.log('Status Summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // Also check email logs
  console.log('\n\nChecking email logs...\n');
  const { data: logs, error: logsError } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!logsError && logs && logs.length > 0) {
    console.log(`Found ${logs.length} recent email logs:\n`);
    logs.forEach((log, index) => {
      console.log(`Log ${index + 1}:`);
      console.log(`  To: ${log.to_email}`);
      console.log(`  Template: ${log.email_template}`);
      console.log(`  Status: ${log.status}`);
      console.log(`  Sent: ${new Date(log.created_at).toLocaleString()}`);
      if (log.order_id) {
        console.log(`  Order ID: ${log.order_id}`);
      }
      console.log('');
    });
  } else {
    console.log('No email logs found');
  }
}

checkEmailQueue();
