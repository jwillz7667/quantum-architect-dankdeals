#!/bin/bash

# Script to rollback checkout edge functions
set -e

echo "🔄 Rolling back checkout edge functions..."

# Check if backups exist
if [ ! -f "supabase/functions/create-order/index-backup.ts" ]; then
    echo "❌ Error: No backup found for create-order function"
    exit 1
fi

if [ ! -f "supabase/functions/send-order-emails/index-backup.ts" ]; then
    echo "❌ Error: No backup found for send-order-emails function"
    exit 1
fi

# Restore from backups
echo "📦 Restoring from backups..."
cp supabase/functions/create-order/index-backup.ts supabase/functions/create-order/index.ts
cp supabase/functions/send-order-emails/index-backup.ts supabase/functions/send-order-emails/index.ts

# Deploy the restored functions
echo "🚀 Deploying restored functions..."
npx supabase functions deploy create-order --no-verify-jwt
npx supabase functions deploy send-order-emails --no-verify-jwt

echo "✅ Functions rolled back successfully!"