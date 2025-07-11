# Real-Time Order Updates Setup Guide

This guide explains how to enable and verify real-time order updates in the DankDeals application.

## Prerequisites

1. **Supabase Real-Time Enabled**: Ensure real-time is enabled for the `orders` table in your Supabase dashboard:
   - Go to Database → Replication
   - Find the `orders` table
   - Toggle on "Enable replication"
   - Click "Apply" to save changes

2. **User Authentication**: You must be logged in to see real-time updates (updates are filtered by user ID)

## How It Works

The real-time functionality provides:
- Instant order status updates
- Toast notifications for order changes
- Automatic UI updates in the Orders page
- Console logging for debugging

## Testing Real-Time Updates

### Step 1: Create a Test User
1. Sign up for a new account in your app
2. Complete age verification
3. Note the user's email

### Step 2: Find the User ID
Run this query in Supabase SQL Editor:
```sql
SELECT id, email FROM auth.users WHERE email = 'your-test-email@example.com';
```

### Step 3: Create a Test Order
Use the provided SQL script in `scripts/test-realtime-orders.sql`:
1. Replace `YOUR_USER_ID_HERE` with the actual user ID
2. Run the INSERT query to create a test order
3. Note the generated order number

### Step 4: Verify Real-Time Updates
1. Log into the app with your test user
2. Navigate to Profile → Order History
3. Keep the browser console open (F12)
4. In a separate Supabase SQL Editor tab, update the order:

```sql
-- Update order status
UPDATE public.orders 
SET status = 'confirmed' 
WHERE order_number = 'YOUR-ORDER-NUMBER';
```

### Step 5: Expected Results
You should see:
- Console log: "Real-time order update: {payload details}"
- Toast notification: "Order #YOUR-ORDER-NUMBER has been confirmed!"
- The order card in the UI updates immediately
- No page refresh required

## Status Update Messages

The following status changes trigger notifications:
- `pending` → `confirmed`: "Order has been confirmed!"
- `confirmed` → `processing`: "Order is being processed."
- `processing` → `out_for_delivery`: "Order is out for delivery!"
- `out_for_delivery` → `delivered`: "Order has been delivered. Enjoy!"
- Any → `cancelled`: "Order has been cancelled." (destructive variant)

Payment status updates:
- `pending` → `paid`: "Payment for order has been confirmed."

## Troubleshooting

### No Real-Time Updates
1. Check browser console for errors
2. Verify real-time is enabled in Supabase
3. Ensure you're logged in with the correct user
4. Check network tab for WebSocket connections

### Console Debugging
The app logs several helpful messages:
- "Real-time subscription status: {status}"
- "Real-time order update: {payload}"
- "Order update received in ProfileOrders: {payload}"

### Common Issues
- **No updates**: Real-time might not be enabled for the orders table
- **Wrong user**: Updates are filtered by user_id
- **Network issues**: WebSocket connection might be blocked
- **RLS policies**: Ensure Row Level Security allows SELECT on orders

## Integration Details

The real-time functionality is implemented in:
- `src/context/RealTimeContext.tsx`: Core real-time logic
- `src/pages/profile/ProfileOrders.tsx`: UI updates
- `src/App.tsx`: Provider wrapping

The system uses Supabase's PostgreSQL real-time features to:
1. Subscribe to changes on the `orders` table
2. Filter updates by the current user's ID
3. Handle INSERT, UPDATE, and DELETE events
4. Show appropriate toast notifications
5. Update the UI without refreshing 