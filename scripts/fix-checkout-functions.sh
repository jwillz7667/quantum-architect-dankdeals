#!/bin/bash

# Script to fix checkout edge functions
set -e

echo "🔧 Fixing checkout edge functions..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Backup current functions
echo "📦 Creating backups..."
cp supabase/functions/create-order/index.ts supabase/functions/create-order/index-backup.ts
cp supabase/functions/send-order-emails/index.ts supabase/functions/send-order-emails/index-backup.ts

# Apply the fixed create-order function
echo "🔄 Updating create-order function..."
cp supabase/functions/create-order/index-fixed.ts supabase/functions/create-order/index.ts

# Deploy the updated functions
echo "🚀 Deploying edge functions..."
npx supabase functions deploy create-order --no-verify-jwt
npx supabase functions deploy send-order-emails --no-verify-jwt

echo "✅ Edge functions updated successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Test the checkout flow on production"
echo "2. Monitor Supabase logs for any errors"
echo "3. If issues persist, run: ./scripts/rollback-checkout-functions.sh"