-- scripts/test-realtime-orders.sql
-- SQL script to test real-time order updates
-- Run this in the Supabase SQL editor to test real-time functionality

-- First, get a user ID (replace with an actual user ID from your auth.users table)
-- You can find user IDs by running: SELECT id, email FROM auth.users LIMIT 5;

-- Create a test order (replace the user_id with an actual user ID)
INSERT INTO public.orders (
  user_id,
  status,
  subtotal,
  tax_amount,
  delivery_fee,
  total_amount,
  delivery_first_name,
  delivery_last_name,
  delivery_street_address,
  delivery_city,
  delivery_state,
  delivery_zip_code,
  delivery_phone,
  payment_method,
  payment_status
) VALUES (
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  'pending',
  40.00,
  3.60,
  5.00,
  48.60,
  'Test',
  'User',
  '123 Test Street',
  'Minneapolis',
  'MN',
  '55401',
  '612-555-1234',
  'cash',
  'pending'
);

-- After creating the order, you can update it to test real-time updates:
-- UPDATE public.orders 
-- SET status = 'confirmed' 
-- WHERE order_number = 'YYYYMMDD-XXXX'; -- Use the actual order number

-- Then try updating to different statuses:
-- UPDATE public.orders 
-- SET status = 'processing' 
-- WHERE order_number = 'YYYYMMDD-XXXX';

-- UPDATE public.orders 
-- SET status = 'out_for_delivery' 
-- WHERE order_number = 'YYYYMMDD-XXXX';

-- UPDATE public.orders 
-- SET status = 'delivered' 
-- WHERE order_number = 'YYYYMMDD-XXXX';

-- Or update payment status:
-- UPDATE public.orders 
-- SET payment_status = 'paid' 
-- WHERE order_number = 'YYYYMMDD-XXXX'; 