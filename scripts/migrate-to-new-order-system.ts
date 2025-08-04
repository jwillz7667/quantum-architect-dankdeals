#!/usr/bin/env tsx

// Migration script to update frontend to use the new order processing system
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function updateFile(filePath: string, replacements: Array<[string, string]>) {
  try {
    let content = await readFile(filePath, 'utf-8');

    for (const [oldText, newText] of replacements) {
      content = content.replace(new RegExp(oldText, 'g'), newText);
    }

    await writeFile(filePath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}:`, error);
  }
}

async function main() {
  console.log('🚀 Migrating to new order processing system...\n');

  // Update API endpoints in frontend
  const apiReplacements: Array<[string, string]> = [
    // Replace create-order with process-order
    ['/functions/v1/create-order', '/functions/v1/process-order'],
    // Remove separate send-order-emails calls since it's now handled by process-order
    [
      `await supabase.functions.invoke\\('send-order-emails'[^)]*\\)`,
      '// Email sending now handled automatically by process-order',
    ],
  ];

  // Files to update
  const filesToUpdate = [
    'src/lib/supabase/orders.ts',
    'src/composables/useOrder.ts',
    'src/components/checkout/CheckoutForm.vue',
  ];

  for (const file of filesToUpdate) {
    await updateFile(join(process.cwd(), file), apiReplacements);
  }

  // Create environment variable documentation
  const envDoc = `
# New Order Processing System Environment Variables

## Required for Supabase Edge Functions:

### Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=orders@dankdealsmn.com
ADMIN_EMAIL=admin@dankdealsmn.com

### Queue Processing (Optional)
QUEUE_PROCESSOR_TOKEN=your_secret_token_for_queue_processor

## Setting Environment Variables in Supabase:

\`\`\`bash
# Set Resend API key
supabase secrets set RESEND_API_KEY=your_resend_api_key

# Set email addresses
supabase secrets set FROM_EMAIL=orders@dankdealsmn.com
supabase secrets set ADMIN_EMAIL=admin@dankdealsmn.com

# Set queue processor token (optional)
supabase secrets set QUEUE_PROCESSOR_TOKEN=your_secret_token
\`\`\`

## Database Migration:

Run the following migration to create the email queue table:
\`\`\`bash
supabase db push
\`\`\`

## Deploying Edge Functions:

\`\`\`bash
# Deploy the new process-order function
supabase functions deploy process-order

# Deploy the email queue processor
supabase functions deploy process-email-queue

# Deploy the health check endpoint
supabase functions deploy health-check

# Remove old functions (after verifying new system works)
supabase functions delete create-order
supabase functions delete send-order-emails
\`\`\`

## Setting up Email Queue Processing:

### Option 1: Using pg_cron (Recommended)
Enable pg_cron extension and run:
\`\`\`sql
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.queue_processor_token'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('action', 'process')
    );
  $$
);
\`\`\`

### Option 2: Using GitHub Actions
Create .github/workflows/process-email-queue.yml:
\`\`\`yaml
name: Process Email Queue
on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Process Email Queue
        run: |
          curl -X POST \\
            -H "Authorization: Bearer \${{ secrets.QUEUE_PROCESSOR_TOKEN }}" \\
            -H "Content-Type: application/json" \\
            https://your-project.supabase.co/functions/v1/process-email-queue
\`\`\`

## Monitoring:

Access health check endpoint:
\`\`\`bash
curl https://your-project.supabase.co/functions/v1/health-check
\`\`\`

Set up monitoring with your preferred service (e.g., UptimeRobot, Pingdom).
`;

  await writeFile(join(process.cwd(), 'ORDER_SYSTEM_MIGRATION.md'), envDoc);
  console.log('✅ Created ORDER_SYSTEM_MIGRATION.md with setup instructions');

  console.log('\n✨ Migration complete! Next steps:');
  console.log('1. Review the changes in your frontend files');
  console.log('2. Follow the instructions in ORDER_SYSTEM_MIGRATION.md');
  console.log('3. Test the new order processing system thoroughly');
  console.log('4. Deploy the edge functions to Supabase');
}

main().catch(console.error);
