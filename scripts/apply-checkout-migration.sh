#!/bin/bash

# Script to apply the checkout fix migration directly
set -e

echo "🔧 Applying checkout fix migration..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Source environment variables
source .env.local

# Extract database connection details from Supabase URL
# Format: https://[project-ref].supabase.co
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Error: Could not extract project reference from VITE_SUPABASE_URL"
    exit 1
fi

echo "📊 Project reference: $PROJECT_REF"
echo ""
echo "To apply the migration manually:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of:"
echo "   supabase/migrations/20250804000000_ensure_order_items_columns.sql"
echo "4. Run the query"
echo ""
echo "Or use the Supabase CLI:"
echo "npx supabase db push --include-all"
echo ""
echo "The migration will:"
echo "✅ Add missing columns to order_items table"
echo "✅ Populate product snapshot data"
echo "✅ Add performance indexes"
echo "✅ Fix any existing orders with missing data"