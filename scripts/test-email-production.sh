#!/bin/bash

echo "🧪 Testing email function in production..."

# Read environment variables
source .env

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "❌ Missing required environment variables"
  exit 1
fi

# First get a recent order from the database
echo "📋 Fetching a recent order..."

# Use the anon key to query the database
ORDER_RESPONSE=$(curl -s -X GET \
  "${VITE_SUPABASE_URL}/rest/v1/orders?select=id,order_number,delivery_first_name,notes&order=created_at.desc&limit=1" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}")

# Check if we got orders
if [ "$ORDER_RESPONSE" = "[]" ] || [ -z "$ORDER_RESPONSE" ]; then
  echo "❌ No orders found in the database"
  echo "Response: $ORDER_RESPONSE"
  exit 1
fi

# Extract order ID and number (basic parsing)
ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | grep -o '"order_number":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ORDER_ID" ]; then
  echo "❌ Could not extract order ID"
  echo "Response: $ORDER_RESPONSE"
  exit 1
fi

echo "✅ Found order: $ORDER_NUMBER (ID: $ORDER_ID)"
echo ""
echo "🚀 Invoking send-order-emails function..."

# Invoke the edge function
FUNCTION_RESPONSE=$(curl -s -X POST \
  "${VITE_SUPABASE_URL}/functions/v1/send-order-emails" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\": \"$ORDER_ID\"}")

echo ""
echo "📧 Function response:"
echo "$FUNCTION_RESPONSE" | jq . 2>/dev/null || echo "$FUNCTION_RESPONSE"

echo ""
echo "✅ Test complete!"
echo ""
echo "💡 Check your email for:"
echo "   - Customer confirmation email (if customer email exists)"
echo "   - Admin notification email (to jwillz7667@gmail.com)"