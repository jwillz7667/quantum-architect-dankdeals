#!/bin/bash

# Deploy Email System Fixes
# This script deploys the updated email edge function with fixes

echo "🚀 Deploying Email System Fixes..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase status > /dev/null 2>&1; then
    echo "⚠️ Not connected to Supabase project. Please run:"
    echo "   supabase login"
    echo "   supabase link"
    exit 1
fi

echo "📦 Deploying send-order-emails function..."
supabase functions deploy send-order-emails

if [ $? -eq 0 ]; then
    echo "✅ Email function deployed successfully!"
else
    echo "❌ Failed to deploy email function"
    exit 1
fi

echo "🔧 Checking required environment variables..."

# Check if secrets are set (this will show which ones exist)
echo "📋 Current secrets status:"
supabase secrets list

echo ""
echo "🎯 Required environment variables for email function:"
echo "   ✓ RESEND_API_KEY - Your Resend API key"
echo "   ✓ ADMIN_EMAIL - Email to receive order notifications (currently: jwillz7667@gmail.com)"
echo "   ✓ FROM_EMAIL - Email address for sending (e.g., orders@dankdealsmn.com)"

echo ""
echo "💡 To set missing variables, use:"
echo "   supabase secrets set RESEND_API_KEY=your_key_here"
echo "   supabase secrets set ADMIN_EMAIL=jwillz7667@gmail.com"
echo "   supabase secrets set FROM_EMAIL=orders@dankdealsmn.com"

echo ""
echo "🧪 To test the email function:"
echo "   cd scripts && node test-email-fix.js"

echo ""
echo "✅ Email system deployment complete!"
echo "📧 The function now includes:"
echo "   • Better email extraction for guest orders"
echo "   • Improved error handling and logging"
echo "   • Correct environment variable usage"
echo "   • Enhanced debugging information"