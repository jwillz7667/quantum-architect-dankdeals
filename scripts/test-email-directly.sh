#!/bin/bash

echo "🧪 Testing email function directly..."

# Get the project ref from supabase status
PROJECT_REF=$(supabase status 2>/dev/null | grep "Project Ref" | awk '{print $3}')

if [ -z "$PROJECT_REF" ]; then
  echo "❌ Could not get project reference. Make sure you're linked to a Supabase project."
  exit 1
fi

# Get a recent order ID from the database
echo "📋 Getting a recent order to test with..."

# Get the first order from the database
ORDER_DATA=$(supabase db dump --data-only -t orders | grep -E "^[a-f0-9\-]{36}" | head -1)

if [ -z "$ORDER_DATA" ]; then
  echo "❌ No orders found in the database"
  exit 1
fi

# Extract the order ID (UUID is the first field)
ORDER_ID=$(echo "$ORDER_DATA" | awk -F'\t' '{print $1}')

echo "✅ Found order ID: $ORDER_ID"
echo ""
echo "🚀 Invoking send-order-emails function..."

# Invoke the function with the order ID
supabase functions invoke send-order-emails \
  --project-ref "$PROJECT_REF" \
  --body "{\"orderId\": \"$ORDER_ID\"}"

echo ""
echo "✅ Test complete! Check the logs above for results."
echo ""
echo "💡 To see function logs, run:"
echo "   supabase functions logs send-order-emails"